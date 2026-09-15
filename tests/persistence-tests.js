(async function () {
  'use strict';
  const ns = window.AsciiGameGenerator;
  const api = ns.ProjectStorage;
  const keys = api.keys;
  const tests = [];
  function test(name, run) { tests.push({ name: name, run: run }); }
  function assert(value, message) { if (!value) throw new Error(message || 'Assertion failed'); }
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
    return value;
  }
  function equal(actual, expected) { assert(JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected)), JSON.stringify(actual) + ' != ' + JSON.stringify(expected)); }
  function rejects(run, code) { try { run(); } catch (error) { equal(error.code, code); return; } throw new Error('Expected ' + code); }
  function memory() {
    const data = new Map();
    return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
  }
  function fixture(name) {
    const project = api.emptyProject();
    project.sceneList[name || 'room'] = [ns.ProjectModel.createDefaultObject({ ascii: '@', mainCharacter: true })];
    project.saveCurrentScene = name || 'room';
    return project;
  }
  function store() { return api.create(memory()); }

  test('new local saves and project exports include the centralized schema version', function () {
    const raw = memory(); const storage = api.create(raw);
    storage.writeProject(fixture());
    equal(JSON.parse(raw.getItem(keys.project)).schemaVersion, ns.AppInfo.schemaVersion);
    equal(JSON.parse(storage.exportProject()).schemaVersion, ns.AppInfo.schemaVersion);
  });
  test('structurally current versionless browser data becomes explicit version 1', function () {
    const raw = memory(); const project = fixture(); delete project.schemaVersion;
    raw.setItem(keys.project, JSON.stringify(project));
    const storage = api.create(raw); const result = storage.readProject();
    equal(result.project.schemaVersion, ns.AppInfo.schemaVersion);
    storage.writeProject(result.project);
    equal(JSON.parse(raw.getItem(keys.project)).schemaVersion, ns.AppInfo.schemaVersion);
    assert(result.warnings.length > 0);
  });
  test('versionless imports and unsupported schema versions are rejected', function () {
    const project = fixture(); project.schemaVersion = 99;
    rejects(() => api.validateProject(project), 'unsupported-version');
    delete project.schemaVersion;
    rejects(() => api.validateProject(project), 'unsupported-version');
  });
  test('invalid JSON and completely invalid project shapes are rejected', function () {
    rejects(() => api.parseProject('{broken'), 'invalid-json');
    [null, [], 7, 'project'].forEach(value => rejects(() => api.validateProject(value), 'invalid-project'));
    [null, [], 'scenes'].forEach(value => rejects(() => api.validateProject(Object.assign(fixture(), { sceneList: value })), 'invalid-project'));
    rejects(() => api.validateProject(Object.assign(fixture(), { sceneList: { room: {} } })), 'invalid-project');
    [null, 3, [], {}].forEach(value => rejects(() => api.validateProject(Object.assign(fixture(), { sceneList: { room: [value] } })), 'invalid-project'));
  });
  test('failed imports preserve project, settings and the latest backup byte for byte', function () {
    const raw = memory(); const storage = api.create(raw);
    storage.writeProject(fixture('first')); storage.importProject(JSON.stringify(fixture('second')));
    const before = [keys.project, keys.settings, keys.backup].map(key => raw.getItem(key));
    rejects(() => storage.importProject('{bad'), 'invalid-json');
    rejects(() => storage.importProject(JSON.stringify({ schemaVersion: 1, sceneList: [] })), 'invalid-project');
    equal([keys.project, keys.settings, keys.backup].map(key => raw.getItem(key)), before);
  });
  test('successful import replaces all project fields and restores one pre-import backup', function () {
    const storage = store(); const first = fixture('first');
    first.editorSettings.position = 3;
    first.persistentSettings.inventory = ['key'];
    storage.writeProject(first);
    const second = fixture('second'); second.editorSettings.allowDrag = true;
    storage.importProject(JSON.stringify(second));
    equal(storage.readProject().project, second);
    assert(storage.hasBackup()); storage.restoreBackup();
    equal(storage.readProject().project, first);
    storage.importProject(JSON.stringify(second));
    storage.importProject(JSON.stringify(fixture('third')));
    storage.restoreBackup(); equal(storage.readProject().project, second);
  });
  test('a valid import can recover from corrupt existing browser data', function () {
    const raw = memory(); raw.setItem(keys.project, '{bad'); const storage = api.create(raw);
    storage.importProject(JSON.stringify(fixture()));
    equal(storage.readProject().project.saveCurrentScene, 'room');
    equal(JSON.parse(raw.getItem(keys.backup)).gameState, '{bad');
  });
  test('malformed nested settings normalize without crashing or leaking transient fields', function () {
    const project = fixture();
    project.persistentSettings = { currencies: { Gold: { toString: null } }, inventory: [null, {}, 'key'], objects: [null, 'Key'], objectEffects: { Key: null }, playerStats: { health: [] }, toolbar: { statsToDisplay: [null, 'health'] } };
    project.sceneList.room[0].left = { toString: null };
    project.sceneList.room[0].colors = null;
    project.sceneList.room[0].giveCurrency = [];
    project.saveCustomKeyBindings = ['bad']; project.editorSettings = [];
    const result = api.validateProject(project);
    equal(result.project.persistentSettings.inventory, ['key']);
    equal(result.project.persistentSettings.objects, ['Key']);
    equal(result.project.persistentSettings.currencies.Gold, 0);
    equal(result.project.persistentSettings.playerStats.health, 100);
    equal(result.project.sceneList.room[0].left, 0);
    equal(result.project.saveCustomKeyBindings, {});
    assert(result.warnings.length > 0);
  });
  test('reserved dictionary keys cannot alter object prototypes', function () {
    const project = fixture(); project.sceneList = JSON.parse('{"__proto__":[]}');
    rejects(() => api.validateProject(project), 'invalid-project');
    equal({}.polluted, undefined);
    const state = ns.createEditorState(); equal(state.saveWorkspaceAsScene('__proto__'), false);
  });
  test('no scenes resolve to null and an empty clean workspace', function () {
    const project = api.emptyProject(); project.saveCurrentScene = 'missing';
    equal(api.validateProject(project).project.saveCurrentScene, null);
    const state = ns.createEditorState(project);
    equal(state.getProjectState().currentScene, null);
    equal(state.getWorkspaceState().objects, []);
    equal(state.getWorkspaceState().dirty, false);
  });
  test('invalid current scene deterministically loads the first saved scene', function () {
    const project = fixture('first'); project.sceneList.second = []; project.saveCurrentScene = 'missing';
    equal(api.validateProject(project).project.saveCurrentScene, 'first');
    const state = ns.createEditorState(project);
    equal(state.getProjectState().currentScene, 'first'); equal(state.getWorkspaceState().objects[0].ascii, '@');
  });
  test('deleting current scene selects another scene and clears stale selection', function () {
    const state = ns.createEditorState({ scenes: { first: [{ ascii: '1' }], second: [{ ascii: '2' }] }, currentScene: 'first' });
    state.selectObject(state.getWorkspaceState().objects[0]._editorId);
    state.deleteScene('first');
    equal(state.getProjectState().currentScene, 'second'); equal(state.getWorkspaceState().objects[0].ascii, '2');
    equal(state.getWorkspaceState().selectedObjectId, null);
  });
  test('deleting the last scene leaves a clean empty project workspace', function () {
    const state = ns.createEditorState(fixture()); state.deleteScene('room');
    equal(state.getProjectState().currentScene, null); equal(state.getWorkspaceState().sourceSceneName, null);
    equal(state.getWorkspaceState().objects, []); equal(state.getWorkspaceState().dirty, false);
  });
  test('deleting a different scene preserves unsaved workspace edits', function () {
    const project = fixture('first'); project.sceneList.second = [];
    const state = ns.createEditorState(project); state.updateObject(state.getWorkspaceState().objects[0]._editorId, { ascii: 'unsaved' });
    state.deleteScene('second'); equal(state.getWorkspaceState().objects[0].ascii, 'unsaved'); assert(state.getWorkspaceState().dirty);
  });
  test('clear creates a versioned empty state and leaves unrelated browser data alone', function () {
    const raw = memory(); const storage = api.create(raw); raw.setItem('unrelated', 'keep');
    storage.writeProject(fixture()); storage.clearProject();
    equal(storage.readProject().project, api.emptyProject());
    equal(raw.getItem('unrelated'), 'keep'); equal(storage.helpDismissed(), false);
  });
  test('exports omit transient IDs and unsaved workspace changes', function () {
    const state = ns.createEditorState(fixture()); const id = state.getWorkspaceState().objects[0]._editorId;
    state.updateObject(id, { ascii: 'unsaved' });
    const snapshot = state.getProjectState();
    const project = Object.assign(api.emptyProject(), { sceneList: snapshot.scenes, saveCurrentScene: snapshot.currentScene, saveCustomKeyBindings: snapshot.keyBindings, persistentSettings: snapshot.persistentSettings });
    project.sceneList.room[0]._editorId = 'transient'; project.dirty = true; project.pointerId = 7;
    const text = store().exportProject(project);
    assert(!text.includes('unsaved') && !text.includes('_editorId') && !text.includes('dirty') && !text.includes('pointerId'));
    equal(JSON.parse(text).sceneList.room[0].ascii, '@');
  });
  test('storage read failures have a useful error and cannot overwrite data', function () {
    let writes = 0;
    const storage = api.create({ getItem: () => { throw new Error('denied'); }, setItem: () => { writes += 1; } });
    rejects(() => storage.readProject(), 'storage-unavailable');
    rejects(() => storage.writeProject(fixture()), 'storage-unavailable'); equal(writes, 0);
  });
  test('a partial import write failure rolls back project, settings and backup', function () {
    const raw = memory(); const storage = api.create(raw); storage.writeProject(fixture());
    const before = [keys.project, keys.settings, keys.backup].map(key => raw.getItem(key));
    const write = raw.setItem;
    raw.setItem = function (key, value) { if (key === keys.project) throw new Error('quota'); write(key, value); };
    rejects(() => storage.importProject(JSON.stringify(fixture('new'))), 'storage-write');
    equal([keys.project, keys.settings, keys.backup].map(key => raw.getItem(key)), before);
  });
  test('invalid stored project is never silently replaced by a read', function () {
    const raw = memory(); raw.setItem(keys.project, 'broken'); const storage = api.create(raw);
    rejects(() => storage.readProject(), 'invalid-json'); equal(raw.getItem(keys.project), 'broken');
  });
  test('Preview and Export block an empty project before opening or downloading', async function () {
    const storage = store();
    const originalAlert = window.alert; const originalOpen = window.open;
    const messages = []; let opens = 0;
    ns.prepareGameLaunch = function () { return storage.playableProject(); };
    window.alert = message => messages.push(message); window.open = () => { opens += 1; };
    try {
      launchGamePreview(); await exportGameAsZip();
      equal(opens, 0); equal(messages.length, 2);
      assert(messages.every(message => message.includes('Save and load a scene')));
    } finally { window.alert = originalAlert; window.open = originalOpen; }
  });
  test('help dismissal is independent of saved scenes', function () {
    const storage = store(); storage.writeProject(fixture());
    const before = storage.exportProject(); storage.dismissHelp();
    assert(storage.helpDismissed()); equal(storage.exportProject(), before);
  });

  test('Garden Trail example validates and exercises rewards, inventory and scene recovery', async function () {
    const response = await fetch('../Example%20Saves/Garden-Trail.json');
    assert(response.ok, 'example must be available');
    const project = api.parseProject(await response.text()).project;
    assert(Object.keys(project.sceneList).length >= 2);
    Object.values(project.sceneList).forEach(scene => assert(scene.filter(object => object.mainCharacter).length <= 1));
    const root = document.createElement('div'); document.body.appendChild(root);
    const runtime = ns.createAsciiGameRuntime({ root: root, initialGameState: project });
    try {
      runtime.play(); runtime.move(85, 0);
      equal(runtime.getSnapshot().currencies.Gold, 5);
      runtime.move(275, 40);
      assert(runtime.getSnapshot().inventory.includes('Brass key'));
      equal(runtime.switchScene('does not exist'), false);
      equal(runtime.getSnapshot().currentScene, 'Garden');
      runtime.switchScene('Cabin');
      Array.from(root.querySelectorAll('.asciiObject')).find(element => element.textContent.includes('CHEST')).click();
      assert(runtime.getSnapshot().inventory.includes('Garden keepsake'));
      equal(runtime.getSnapshot().currencies.Gold, 5);
    } finally { runtime.destroy(); root.remove(); }
  });

  let passed = 0;
  for (const entry of tests) {
    const item = document.createElement('li');
    try { await entry.run(); item.className = 'pass'; item.textContent = 'PASS — ' + entry.name; passed += 1; }
    catch (error) { item.className = 'fail'; item.textContent = 'FAIL — ' + entry.name + ': ' + error.message; }
    document.getElementById('results').appendChild(item);
  }
  document.getElementById('summary').textContent = passed + '/' + tests.length + ' tests passed';
  document.title = passed + '/' + tests.length + ' persistence tests passed';
  document.body.dataset.testStatus = passed === tests.length ? 'passed' : 'failed';
})();
