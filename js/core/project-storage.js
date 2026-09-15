(function (global) {
  'use strict';
  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};
  const model = namespace.ProjectModel;
  const SCHEMA_VERSION = namespace.AppInfo.schemaVersion;
  const KEYS = Object.freeze({ project: 'gameState', settings: 'editorSettings', backup: 'asciiGameGenerator.preImportBackup', help: 'asciiGameGenerator.helpDismissed' });

  function failure(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function normalizeEditorSettings(input) {
    const source = model.isRecord(input) ? input : {};
    function dimension(value, fallback) {
      const number = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
      return Number.isInteger(number) && number > 0 && number <= 10000 ? number : fallback;
    }
    return {
      screenWidth: dimension(source.screenWidth, 650),
      screenHeight: dimension(source.screenHeight, 400),
      position: Number.isInteger(source.position) && source.position >= 1 && source.position <= 9 ? source.position : 9,
      allowDrag: source.allowDrag === true
    };
  }

  function emptyProject() {
    return { schemaVersion: SCHEMA_VERSION, sceneList: {}, saveCurrentScene: null, saveCustomKeyBindings: {},
      persistentSettings: model.createDefaultPersistentSettings(), editorSettings: normalizeEditorSettings() };
  }

  // Validation is pure: it never changes storage or the supplied project.
  function validateProject(input, options) {
    options = options || {};
    if (!model.isRecord(input)) throw failure('invalid-project', 'This file is not a project object.');
    const versionless = input.schemaVersion === undefined;
    if (versionless && !options.allowVersionless) {
      throw failure('unsupported-version', 'This project has no schemaVersion. Import a version 1 project; legacy files are not supported.');
    }
    if (!versionless && input.schemaVersion !== SCHEMA_VERSION) {
      throw failure('unsupported-version', 'This project uses an unsupported schema version. This beta supports version ' + SCHEMA_VERSION + '.');
    }
    if (!model.isRecord(input.sceneList)) throw failure('invalid-project', 'Project sceneList must be an object of saved scenes.');
    if (versionless && (!model.isRecord(input.saveCustomKeyBindings) || !model.isRecord(input.persistentSettings) ||
        !(typeof input.saveCurrentScene === 'string' || input.saveCurrentScene === null))) {
      throw failure('invalid-project', 'The stored versionless data does not match the current project structure. It has been left untouched.');
    }
    const scenes = {};
    Object.entries(input.sceneList).forEach(function (entry) {
      const name = entry[0];
      if (!name.trim() || !model.safeName(name)) throw failure('invalid-project', 'A saved scene has an invalid name.');
      if (!Array.isArray(entry[1])) throw failure('invalid-project', 'Scene "' + name + '" must contain an array of objects.');
      entry[1].forEach(function (object, index) {
        if (!model.isRecord(object) || typeof object.ascii !== 'string') {
          throw failure('invalid-project', 'Object ' + (index + 1) + ' in scene "' + name + '" must be an object with ASCII text.');
        }
      });
      scenes[name] = model.serializeScene(entry[1]);
    });
    const keyBindings = {};
    Object.entries(model.isRecord(input.saveCustomKeyBindings) ? input.saveCustomKeyBindings : {}).forEach(function (entry) {
      const key = entry[0].toLowerCase();
      if (key && model.safeName(key) && typeof entry[1] === 'string') keyBindings[key] = entry[1];
    });
    const project = {
      schemaVersion: SCHEMA_VERSION,
      sceneList: scenes,
      saveCurrentScene: model.resolveSceneName(scenes, input.saveCurrentScene),
      saveCustomKeyBindings: keyBindings,
      persistentSettings: model.normalizePersistentSettings(input.persistentSettings),
      editorSettings: normalizeEditorSettings(input.editorSettings)
    };
    const warnings = [];
    if (versionless) warnings.push('Current browser data was updated to schema version ' + SCHEMA_VERSION + '.');
    if (input.saveCurrentScene !== project.saveCurrentScene) warnings.push(project.saveCurrentScene === null
      ? 'There are no saved scenes yet.' : 'The missing active scene was replaced with the first saved scene.');
    if (['sceneList', 'saveCustomKeyBindings', 'persistentSettings', 'editorSettings'].some(function (key) {
      return JSON.stringify(input[key]) !== JSON.stringify(project[key]);
    })) warnings.push('Missing or malformed values were normalized to supported defaults.');
    return { project: project, warnings: warnings };
  }

  function parseProject(text, options) {
    let data;
    try { data = JSON.parse(text); }
    catch (error) { throw failure('invalid-json', 'This file is not valid JSON. The current project has not been replaced.'); }
    return validateProject(data, options);
  }

  function createProjectStorage(storageOverride) {
    // Resolve lazily because even accessing window.localStorage can be denied.
    function storage() {
      try { return storageOverride || global.localStorage; }
      catch (error) { throw failure('storage-unavailable', 'Browser storage is unavailable. Allow site storage to save your project.'); }
    }
    function read(key) {
      try { return storage().getItem(key); }
      catch (error) { throw failure('storage-unavailable', 'Browser storage could not be read. Existing data has not been changed.'); }
    }
    function writeRecords(records) {
      const target = storage();
      const previous = records.map(function (record) { return [record[0], read(record[0])]; });
      let written = 0;
      try {
        records.forEach(function (record) { target.setItem(record[0], record[1]); written += 1; });
      } catch (error) {
        let restored = true;
        for (let index = written - 1; index >= 0; index -= 1) {
          try {
            if (previous[index][1] === null) target.removeItem(previous[index][0]);
            else target.setItem(previous[index][0], previous[index][1]);
          } catch (restoreError) { restored = false; }
        }
        throw failure('storage-write', restored
          ? 'Could not save to browser storage (it may be full or blocked). The previous saved project was kept.'
          : 'Browser storage failed while saving and restoring. Keep this page open and export your project before continuing.');
      }
    }
    function recordsFor(project) {
      const gameState = Object.assign({}, project);
      delete gameState.editorSettings;
      return [[KEYS.settings, JSON.stringify(project.editorSettings)], [KEYS.project, JSON.stringify(gameState)]];
    }
    function writeProject(input) {
      const normalized = validateProject(input);
      writeRecords(recordsFor(normalized.project));
      return normalized;
    }
    function readProject() {
      const raw = read(KEYS.project);
      let settings;
      const warnings = [];
      try { settings = JSON.parse(read(KEYS.settings) || 'null'); }
      catch (error) {
        if (error.code) throw error;
        warnings.push('Invalid screen settings were reset to defaults.');
      }
      if (raw === null) {
        const project = emptyProject();
        project.editorSettings = normalizeEditorSettings(settings);
        return { project: project, warnings: warnings, fresh: true };
      }
      let input;
      try { input = JSON.parse(raw); }
      catch (error) { throw failure('invalid-json', 'The stored project is not valid JSON. Existing data has been left untouched.'); }
      if (model.isRecord(input)) input.editorSettings = settings || input.editorSettings;
      const result = validateProject(input, { allowVersionless: true });
      result.warnings = warnings.concat(result.warnings);
      result.fresh = false;
      return result;
    }
    function importProject(text) {
      const imported = parseProject(text); // Complete validation before even reading backup data.
      const previous = { gameState: read(KEYS.project), editorSettings: read(KEYS.settings) };
      const records = recordsFor(imported.project);
      if (previous.gameState !== null) records.unshift([KEYS.backup, JSON.stringify(previous)]);
      writeRecords(records);
      return imported;
    }
    function restoreBackup() {
      const raw = read(KEYS.backup);
      if (!raw) throw failure('no-backup', 'There is no pre-import backup to restore.');
      let backup;
      try { backup = JSON.parse(raw); }
      catch (error) { throw failure('invalid-backup', 'The pre-import backup could not be read. Current data has not changed.'); }
      const result = parseProject(backup.gameState, { allowVersionless: true });
      try { result.project.editorSettings = normalizeEditorSettings(JSON.parse(backup.editorSettings || 'null')); }
      catch (error) { result.project.editorSettings = normalizeEditorSettings(); }
      return writeProject(result.project);
    }
    function updateEditorSettings(input) {
      const current = readProject().project;
      current.editorSettings = normalizeEditorSettings(input);
      return writeProject(current);
    }
    function playableProject() {
      const result = readProject();
      if (!result.project.saveCurrentScene) throw failure('no-scene', 'Save and load a scene before previewing or exporting your game.');
      return result.project;
    }
    function clearProject() {
      const project = emptyProject();
      writeRecords(recordsFor(project).concat([[KEYS.help, 'false']]));
      return project;
    }
    return {
      schemaVersion: SCHEMA_VERSION, readProject: readProject, writeProject: writeProject,
      importProject: importProject, restoreBackup: restoreBackup,
      hasBackup: function () { return Boolean(read(KEYS.backup)); },
      exportProject: function (project) { return JSON.stringify(validateProject(project || readProject().project).project, null, 2); },
      updateEditorSettings: updateEditorSettings, playableProject: playableProject, clearProject: clearProject,
      helpDismissed: function () { return read(KEYS.help) === 'true'; },
      dismissHelp: function () { writeRecords([[KEYS.help, 'true']]); }
    };
  }
  namespace.ProjectStorage = { schemaVersion: SCHEMA_VERSION, keys: KEYS, emptyProject: emptyProject,
    validateProject: validateProject, parseProject: parseProject, normalizeEditorSettings: normalizeEditorSettings, create: createProjectStorage };
  namespace.projectStorage = createProjectStorage();
})(window);
