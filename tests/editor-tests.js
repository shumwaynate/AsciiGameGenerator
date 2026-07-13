(function () {
  'use strict';

  const namespace = window.AsciiGameGenerator;
  const model = namespace.ProjectModel;
  const tests = [];
  const fixture = document.getElementById('editorFixture');

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

  function object(overrides) {
    return model.createDefaultObject(Object.assign({ ascii: '@', itemName: 'object' }, overrides || {}));
  }

  function createState(scenes, currentScene) {
    return namespace.createEditorState({
      scenes: scenes || {},
      currentScene: currentScene || '',
      keyBindings: {},
      persistentSettings: model.createDefaultPersistentSettings()
    });
  }

  function installFixtureMarkup() {
    fixture.innerHTML = `
      <div id="ascii-display"></div>
      <div id="context-menu" style="display:none"></div>
      <input id="item-name"><input id="default-color" type="color"><input id="hover-color" type="color"><input id="click-color" type="color">
      <input id="enable-default-color" type="checkbox"><input id="enable-hover-color" type="checkbox"><input id="enable-click-color" type="checkbox">
      <input id="prop-clickable" type="checkbox"><input id="prop-invisible" type="checkbox"><input id="prop-main-player" type="checkbox"><input id="prop-collision" type="checkbox">
      <input id="prop-switch-scene-enabled" type="checkbox"><select id="switch-scene-trigger"><option value="click">click</option><option value="touch">touch</option></select><select id="switch-scene-list"></select>
      <input id="prop-give-currency-enabled" type="checkbox"><select id="give-currency-trigger"><option value="click">click</option><option value="touch">touch</option></select><select id="give-currency-list"></select><input id="give-currency-amount"><input id="give-currency-delete-after" type="checkbox">
      <input id="prop-give-object-enabled" type="checkbox"><select id="give-object-trigger"><option value="click">click</option><option value="touch">touch</option></select><select id="give-object-list"></select><input id="give-object-delete-after" type="checkbox">
      <input id="enable-rpg-mechanics" type="checkbox"><div id="rpg-stats-config"></div><input id="enable-toolbar" type="checkbox"><input id="enable-inventory" type="checkbox">
      <ul id="object-list"></ul><ul id="scene-list"></ul><span id="scene-total"></span><ul id="keybindings-ul"></ul><ul id="editor-currency-list"></ul><ul id="object-library-list"></ul><ul id="object-stat-effects-list"></ul>
      <textarea id="ascii-input"></textarea><input id="scene-name"><button id="add-ascii-art"></button><button id="save-scene"></button><button id="load-scene"></button><button id="clear-canvas"></button><button id="delete-selected-item"></button><button id="delete-item"></button><button id="save-properties"></button><button id="close-context-menu"></button>
      <input id="global-key-input"><select id="global-action-select"><option value="toggleInventory">toggleInventory</option></select><button id="add-global-keybinding"></button>
      <input id="new-currency-name"><input id="new-currency-value"><button id="add-currency"></button><input id="new-object-name"><button id="add-object-button"></button>
      <button id="settings-button"></button><button id="clear-storage"></button>`;
  }

  function createEditorContext(state, controllerOptions) {
    installFixtureMarkup();
    const renderer = namespace.createEditorRenderer({ state: state, document: document });
    const fakeWindow = {
      alert: function () {},
      confirm: function () { return true; },
      setTimeout: window.setTimeout.bind(window),
      clearTimeout: window.clearTimeout.bind(window),
      localStorage: window.localStorage,
      location: { href: '', reload: function () {} }
    };
    const controller = namespace.createEditorController(Object.assign({
      state: state,
      renderer: renderer,
      document: document,
      window: fakeWindow,
      onSave: function () {},
      onSilentSave: function () {},
      onNavigateToSettings: function () {},
      onClearStorage: function () {}
    }, controllerOptions || {}));
    return {
      renderer: renderer,
      controller: controller,
      cleanup: function () {
        controller.destroy();
        renderer.destroy();
        fixture.replaceChildren();
      }
    };
  }

  test('default objects have independent nested settings', function () {
    const first = model.createDefaultObject();
    const second = model.createDefaultObject();
    first.colors.hover.color = '#ffffff';
    first.giveCurrency.amount = 10;
    equal(second.colors.hover.color, '#000000', 'hover defaults must not be shared');
    equal(second.giveCurrency.amount, 0, 'action defaults must not be shared');
  });

  test('scene normalization preserves only the first main character', function () {
    const scene = model.normalizeScene([object({ itemName: 'first', mainCharacter: true }), object({ itemName: 'second', mainCharacter: true })]);
    equal(scene[0].mainCharacter, true, 'first main character should remain marked');
    equal(scene[1].mainCharacter, false, 'later main characters should be unmarked');
  });

  test('missing visible defaults to true', function () {
    equal(model.normalizeObject({}).visible, true);
  });

  test('missing collision defaults to true', function () {
    equal(model.normalizeObject({}).collision, true);
  });

  test('loading deep-clones a saved scene', function () {
    const state = createState({ room: [object({ itemName: 'saved' })] }, '');
    state.loadSceneIntoWorkspace('room');
    const workspace = state.getWorkspaceState();
    workspace.objects[0].itemName = 'external mutation';
    equal(state.getWorkspaceState().objects[0].itemName, 'saved', 'workspace getter should be isolated');
    equal(state.getProjectState().scenes.room[0].itemName, 'saved', 'saved scene should remain isolated');
  });

  test('editing workspace does not mutate saved scenes', function () {
    const state = createState({ room: [object({ itemName: 'saved' })] }, 'room');
    const id = state.getWorkspaceState().objects[0]._editorId;
    state.updateObject(id, { itemName: 'working' });
    equal(state.getProjectState().scenes.room[0].itemName, 'saved');
  });

  test('saving commits the current workspace snapshot', function () {
    const state = createState({ room: [object({ itemName: 'saved' })] }, 'room');
    const id = state.getWorkspaceState().objects[0]._editorId;
    state.updateObject(id, { itemName: 'working' });
    state.saveWorkspaceAsScene('room');
    equal(state.getProjectState().scenes.room[0].itemName, 'working');
  });

  test('Save As creates a separate scene snapshot', function () {
    const state = createState({ first: [object({ itemName: 'original' })] }, 'first');
    const id = state.getWorkspaceState().objects[0]._editorId;
    state.updateObject(id, { itemName: 'copy' });
    state.saveWorkspaceAsScene('second');
    equal(state.getProjectState().scenes.first[0].itemName, 'original');
    equal(state.getProjectState().scenes.second[0].itemName, 'copy');
    equal(state.getProjectState().currentScene, 'second');
  });

  test('loading another scene replaces the workspace', function () {
    const state = createState({ first: [object({ ascii: '1' })], second: [object({ ascii: '2' })] }, 'first');
    state.loadSceneIntoWorkspace('second');
    equal(state.getWorkspaceState().objects.length, 1);
    equal(state.getWorkspaceState().objects[0].ascii, '2');
  });

  test('deleting a selected object clears selection', function () {
    const state = createState();
    const created = state.createObject('@');
    state.selectObject(created._editorId);
    state.deleteObject(created._editorId);
    equal(state.getWorkspaceState().selectedObjectId, null);
  });

  test('clearing workspace clears selection', function () {
    const state = createState();
    const created = state.createObject('@');
    state.selectObject(created._editorId);
    state.clearWorkspace();
    equal(state.getWorkspaceState().selectedObjectId, null);
  });

  test('dirty becomes true after edits', function () {
    const state = createState({ room: [object()] }, 'room');
    const id = state.getWorkspaceState().objects[0]._editorId;
    state.updateObject(id, { left: 20 });
    equal(state.getWorkspaceState().dirty, true);
  });

  test('dirty becomes false after save', function () {
    const state = createState();
    state.createObject('@');
    state.saveWorkspaceAsScene('room');
    equal(state.getWorkspaceState().dirty, false);
  });

  test('dirty becomes false after load', function () {
    const state = createState({ room: [object()] }, 'room');
    const id = state.getWorkspaceState().objects[0]._editorId;
    state.updateObject(id, { top: 20 });
    state.loadSceneIntoWorkspace('room');
    equal(state.getWorkspaceState().dirty, false);
  });

  test('editor-only IDs are not serialized', function () {
    const serialized = model.serializeObject(Object.assign(object(), { _editorId: 'temporary' }));
    assert(!Object.prototype.hasOwnProperty.call(serialized, '_editorId'), 'serialized object must omit transient ID');
  });

  test('checking a new main character unmarks the previous one', function () {
    const state = createState();
    const first = state.createObject('1', { mainCharacter: true });
    const second = state.createObject('2');
    state.updateObject(second._editorId, { mainCharacter: true });
    const objects = state.getWorkspaceState().objects;
    equal(objects.find(function (item) { return item._editorId === first._editorId; }).mainCharacter, false);
    equal(objects.find(function (item) { return item._editorId === second._editorId; }).mainCharacter, true);
  });

  test('unchecking the main character permits zero', function () {
    const state = createState();
    const first = state.createObject('1', { mainCharacter: true });
    state.updateObject(first._editorId, { mainCharacter: false });
    equal(state.getWorkspaceState().objects.some(function (item) { return item.mainCharacter; }), false);
  });

  test('keybinding state operations', function () {
    const state = createState();
    state.setKeyBinding('i', 'toggleInventory');
    equal(state.getProjectState().keyBindings.i, 'toggleInventory');
    state.deleteKeyBinding('i');
    equal(Object.keys(state.getProjectState().keyBindings).length, 0);
  });

  test('scene highlighting state follows currentScene', function () {
    const state = createState({ first: [], second: [] }, 'first');
    state.loadSceneIntoWorkspace('second');
    equal(state.getProjectState().currentScene, 'second');
  });

  test('subscriptions fire once per operation without duplicate listeners', function () {
    const state = createState();
    let notifications = 0;
    function listener() { notifications += 1; }
    const unsubscribeFirst = state.subscribe(listener);
    const unsubscribeSecond = state.subscribe(listener);
    const created = state.createObject('@');
    state.updateObject(created._editorId, { left: 1 });
    equal(notifications, 2, 'each state operation should notify the listener once');
    unsubscribeFirst();
    unsubscribeSecond();
  });

  test('renderer creates object DOM from workspace state', function () {
    const state = createState({ room: [object({ ascii: 'DOM', left: 12, top: 14 })] }, 'room');
    const context = createEditorContext(state);
    const element = fixture.querySelector('.ascii-art');
    equal(element.textContent, 'DOM');
    equal(element.style.left, '12px');
    context.cleanup();
  });

  test('renderer keeps invisible content transparent', function () {
    const state = createState({ room: [object({ visible: false })] }, 'room');
    const context = createEditorContext(state);
    equal(fixture.querySelector('.ascii-art').style.opacity, '0');
    context.cleanup();
  });

  test('invisible selection uses the separate overlay', function () {
    const state = createState({ room: [object({ visible: false })] }, 'room');
    const context = createEditorContext(state);
    const id = state.getWorkspaceState().objects[0]._editorId;
    state.selectObject(id);
    equal(fixture.querySelector('.ascii-art').classList.contains('flashing-border'), false, 'invisible content should not flash');
    equal(document.getElementById('selection-overlay').style.display, 'block', 'selection overlay should be shown');
    context.cleanup();
  });

  test('Pointer Events drag updates workspace position', function () {
    const state = createState({ room: [object({ left: 10, top: 10 })] }, 'room');
    const context = createEditorContext(state);
    const element = fixture.querySelector('.ascii-art');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7, clientX: rect.left + 2, clientY: rect.top + 2 }));
    element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 7, clientX: rect.left + 22, clientY: rect.top + 17 }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7, clientX: rect.left + 22, clientY: rect.top + 17 }));
    const moved = state.getWorkspaceState().objects[0];
    equal(moved.left, 30);
    equal(moved.top, 25);
    context.cleanup();
  });

  test('regenerated list controls do not accumulate duplicate actions', function () {
    const state = createState({ first: [], second: [] }, 'first');
    let silentSaves = 0;
    const context = createEditorContext(state, { onSilentSave: function () { silentSaves += 1; } });
    document.querySelector('[data-scene-name="first"] button').click();
    state.saveWorkspaceAsScene('third');
    document.querySelector('[data-scene-name="second"] button').click();
    equal(silentSaves, 2, 'each delegated delete should invoke one action');
    equal(Object.keys(state.getProjectState().scenes).length, 1);
    context.cleanup();
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
    document.title = `${passed}/${tests.length} editor tests passed`;
    document.body.dataset.testStatus = passed === tests.length ? 'passed' : 'failed';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests, { once: true });
  } else {
    runTests();
  }
})();
