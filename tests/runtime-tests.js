(function () {
  'use strict';

  const fixtures = window.RuntimeFixtures;
  const tests = [];
  const sandbox = document.getElementById('testSandbox');

  function test(name, run) {
    tests.push({ name: name, run: run });
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  function equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error((message || 'Values differ') + ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createRuntime(gameState, overrides) {
    const root = document.createElement('div');
    root.className = 'runtime-test-root';
    sandbox.appendChild(root);
    const options = Object.assign({
      root: root,
      initialGameState: clone(gameState),
      width: 650,
      height: 400,
      autoPlay: false
    }, overrides || {});
    const runtime = window.AsciiGameGenerator.createAsciiGameRuntime(options);
    return {
      root: root,
      runtime: runtime,
      cleanup: function () {
        runtime.destroy();
        root.remove();
      }
    };
  }

  function player() {
    return fixtures.object({ itemName: 'player', mainCharacter: true, collision: false });
  }

  function rewardObject(overrides) {
    return fixtures.object(Object.assign({
      ascii: '$',
      itemName: 'reward',
      left: 10,
      collision: false,
      giveCurrency: { enabled: true, trigger: 'touch', currency: 'gold', amount: 1, deleteAfter: false }
    }, overrides || {}));
  }

  test('zero main character', function () {
    const context = createRuntime(fixtures.empty);
    equal(context.runtime.getSnapshot().activePlayer, null, 'zero-main scene should have no active player');
    equal(context.runtime.move(3, 0), false, 'movement should fail safely without a player');
    context.cleanup();
  });

  test('one main character', function () {
    const context = createRuntime(fixtures.oneMain);
    equal(context.runtime.getSnapshot().activePlayer.itemName, 'player', 'the marked object should be active');
    context.runtime.move(3, 0);
    equal(context.runtime.getSnapshot().activePlayer.x, 3, 'the active player should move');
    context.cleanup();
  });

  test('malformed two-main scene uses only the first', function () {
    const context = createRuntime(fixtures.twoMain);
    equal(context.runtime.getSnapshot().activePlayer.itemName, 'first', 'the first marked object should win');
    context.cleanup();
  });

  test('active player clears between scenes', function () {
    const state = fixtures.project({ first: [player()], empty: [] }, 'first');
    const context = createRuntime(state);
    context.runtime.switchScene('empty');
    equal(context.runtime.getSnapshot().activePlayer, null, 'the old scene player must not remain active');
    context.cleanup();
  });

  test('visible and invisible objects render with matching opacity', function () {
    const state = fixtures.project({ room: [
      fixtures.object({ ascii: 'V' }),
      fixtures.object({ ascii: 'I', left: 30, visible: false }),
      fixtures.object({ ascii: 'D', left: 60, visible: undefined })
    ] }, 'room');
    const context = createRuntime(state);
    const elements = context.root.querySelectorAll('.asciiObject');
    equal(elements[0].style.opacity, '1', 'visible object should be opaque');
    equal(elements[1].style.opacity, '0', 'invisible object should be transparent');
    equal(elements[2].style.opacity, '1', 'missing visibility should default visible');
    context.cleanup();
  });

  test('blocking collision prevents movement after evaluating touch actions', function () {
    const blocker = rewardObject({ collision: true });
    const state = fixtures.project({ room: [player(), blocker] }, 'room');
    const context = createRuntime(state);
    equal(context.runtime.move(3, 0), false, 'blocking collision should reject movement');
    equal(context.runtime.getSnapshot().activePlayer.x, 0, 'blocked player position should not change');
    equal(context.runtime.getSnapshot().currencies.gold, 1, 'blocking contact should still run touch actions');
    context.cleanup();
  });

  test('non-blocking touch object allows movement', function () {
    const state = fixtures.project({ room: [player(), rewardObject()] }, 'room');
    const context = createRuntime(state);
    equal(context.runtime.move(3, 0), true, 'non-blocking contact should allow movement');
    equal(context.runtime.getSnapshot().activePlayer.x, 3, 'player should move through non-blocking object');
    context.cleanup();
  });

  test('touch action runs once per continuous contact', function () {
    const state = fixtures.project({ room: [player(), rewardObject()] }, 'room');
    const context = createRuntime(state);
    context.runtime.move(3, 0);
    context.runtime.move(0, 0);
    equal(context.runtime.getSnapshot().currencies.gold, 1, 'continuous contact should reward once');
    context.cleanup();
  });

  test('touch action enforces one-second cooldown after contact ends', function () {
    let clock = 0;
    const state = fixtures.project({ room: [player(), rewardObject()] }, 'room');
    const context = createRuntime(state, { now: function () { return clock; } });
    context.runtime.move(3, 0);
    context.runtime.move(-20, 0);
    clock = 500;
    context.runtime.move(3, 0);
    equal(context.runtime.getSnapshot().currencies.gold, 1, 'touch inside cooldown should not reward');
    context.runtime.move(-20, 0);
    clock = 1001;
    context.runtime.move(3, 0);
    equal(context.runtime.getSnapshot().currencies.gold, 2, 'touch after cooldown should reward again');
    context.cleanup();
  });

  test('click reward', function () {
    const clickable = rewardObject({
      clickable: true,
      left: 40,
      giveCurrency: { enabled: true, trigger: 'click', currency: 'gold', amount: 4, deleteAfter: false }
    });
    const context = createRuntime(fixtures.project({ room: [player(), clickable] }, 'room'));
    context.root.querySelectorAll('.asciiObject')[1].click();
    equal(context.runtime.getSnapshot().currencies.gold, 4, 'click should grant configured currency');
    context.cleanup();
  });

  test('touch reward', function () {
    const context = createRuntime(fixtures.project({ room: [player(), rewardObject()] }, 'room'));
    context.runtime.move(3, 0);
    equal(context.runtime.getSnapshot().currencies.gold, 1, 'touch should grant configured currency');
    context.cleanup();
  });

  test('delete-after removes the exact touched object', function () {
    const target = rewardObject({ giveCurrency: { enabled: true, trigger: 'touch', currency: 'gold', amount: 1, deleteAfter: true } });
    const context = createRuntime(fixtures.project({ room: [player(), target] }, 'room'));
    context.runtime.move(3, 0);
    const objects = context.runtime.getSnapshot().gameState.sceneList.room;
    equal(objects.length, 1, 'delete-after should remove one object');
    equal(objects[0].itemName, 'player', 'the player should remain');
    context.cleanup();
  });

  test('duplicate item names do not delete the wrong object', function () {
    const first = fixtures.object({ ascii: 'A', itemName: 'duplicate', left: 50 });
    const second = fixtures.object({
      ascii: 'B', itemName: 'duplicate', left: 80, clickable: true,
      giveObject: { enabled: true, trigger: 'click', object: 'key', deleteAfter: true }
    });
    const context = createRuntime(fixtures.project({ room: [player(), first, second] }, 'room'));
    context.root.querySelectorAll('.asciiObject')[2].click();
    const objects = context.runtime.getSnapshot().gameState.sceneList.room;
    equal(objects.length, 2, 'only one duplicate should be removed');
    equal(objects[1].ascii, 'A', 'the unclicked duplicate should remain');
    context.cleanup();
  });

  test('scene switching', function () {
    const door = fixtures.object({
      ascii: 'D', left: 50, clickable: true,
      switchScene: { enabled: true, trigger: 'click', target: 'second' }
    });
    const state = fixtures.project({ first: [player(), door], second: [] }, 'first');
    const context = createRuntime(state);
    context.root.querySelectorAll('.asciiObject')[1].click();
    equal(context.runtime.getSnapshot().currentScene, 'second', 'click action should switch scenes');
    context.cleanup();
  });

  test('player position persists before scene switching', function () {
    const state = fixtures.project({ first: [player()], second: [] }, 'first');
    const context = createRuntime(state);
    context.runtime.move(20, 0);
    context.runtime.switchScene('second');
    equal(context.runtime.getSnapshot().gameState.sceneList.first[0].left, 20, 'source scene should retain the player position');
    context.cleanup();
  });

  test('reset restores original state and remains paused', function () {
    const reward = rewardObject({ giveCurrency: { enabled: true, trigger: 'touch', currency: 'gold', amount: 2, deleteAfter: true } });
    const state = fixtures.project({ room: [player(), reward] }, 'room', { inventory: ['map'], currencies: { gold: 5 } });
    const context = createRuntime(state);
    context.runtime.play();
    context.runtime.move(3, 0);
    context.runtime.reset();
    const snapshot = context.runtime.getSnapshot();
    equal(snapshot.playing, false, 'reset should pause the runtime');
    equal(snapshot.currentScene, 'room', 'reset should restore the initial scene');
    equal(snapshot.gameState.sceneList.room.length, 2, 'reset should restore deleted objects');
    equal(snapshot.gameState.sceneList.room[0].left, 0, 'reset should restore object positions');
    equal(snapshot.currencies.gold, 5, 'reset should restore currencies');
    equal(snapshot.inventory[0], 'map', 'reset should restore inventory');
    context.cleanup();
  });

  test('inventory and currencies initialize as copies of persistent settings', function () {
    const state = fixtures.project({ room: [] }, 'room', { inventory: ['key'], currencies: { gems: 7 } });
    const context = createRuntime(state);
    const snapshot = context.runtime.getSnapshot();
    equal(snapshot.inventory[0], 'key', 'inventory should initialize from persistent settings');
    equal(snapshot.currencies.gems, 7, 'currencies should initialize from persistent settings');
    snapshot.inventory.push('mutation');
    equal(context.runtime.getSnapshot().inventory.length, 1, 'inspection data should be copied');
    context.cleanup();
  });

  test('destroy removes runtime activity and listeners', function () {
    let requested = 0;
    let canceled = 0;
    const context = createRuntime(fixtures.oneMain, {
      requestAnimationFrame: function () { requested += 1; return 99; },
      cancelAnimationFrame: function (id) { if (id === 99) canceled += 1; }
    });
    context.runtime.play();
    equal(requested, 1, 'play should schedule one animation frame');
    context.runtime.destroy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    const snapshot = context.runtime.getSnapshot();
    equal(canceled, 1, 'destroy should cancel the scheduled frame');
    equal(snapshot.destroyed, true, 'runtime should report destroyed state');
    equal(snapshot.pressedKeys.length, 0, 'destroyed runtime should not receive key events');
    context.root.remove();
  });

  test('runtime builder produces safe self-contained source', function () {
    const state = fixtures.project({ room: [fixtures.object({ ascii: '</script><script>unsafe()</script>' })] }, 'room');
    const source = window.AsciiGameGenerator.buildRuntimeSource({
      initialGameState: state,
      width: 650,
      height: 400,
      autoPlay: true
    });
    new Function(source);
    assert(source.includes('createAsciiGameRuntime'), 'generated source should contain the runtime factory');
    assert(!source.includes('</script>'), 'embedded project text should not terminate a script element');
    assert(!source.includes('localStorage'), 'standalone source must not depend on editor storage');
    new Function(source)();
    assert(window.asciiGameRuntime, 'generated source should bootstrap a runtime');
    equal(window.asciiGameRuntime.getSnapshot().currentScene, 'room', 'generated runtime should receive embedded state');
    window.asciiGameRuntime.destroy();
    document.getElementById('asciiGameWrapper').remove();
    delete window.asciiGameRuntime;
  });

  function runTests() {
    const results = document.getElementById('results');
    let passed = 0;
    tests.forEach(function (entry) {
      const item = document.createElement('li');
      try {
        entry.run();
        item.className = 'pass';
        item.textContent = 'PASS — ' + entry.name;
        passed += 1;
      } catch (error) {
        item.className = 'fail';
        item.textContent = 'FAIL — ' + entry.name + ': ' + error.message;
        console.error(entry.name, error);
      }
      results.appendChild(item);
    });

    const summary = document.getElementById('summary');
    summary.textContent = `${passed}/${tests.length} tests passed`;
    summary.className = passed === tests.length ? 'pass' : 'fail';
    document.title = `${passed}/${tests.length} runtime tests passed`;
    document.body.dataset.testStatus = passed === tests.length ? 'passed' : 'failed';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests, { once: true });
  } else {
    runTests();
  }
})();
