(function (global) {
  'use strict';
  const namespace = global.AsciiGameGenerator;
  const storage = namespace.projectStorage;
  let editorState;
  let storageBlocked = false;

  function report(message) {
    const status = document.getElementById('status-message');
    status.textContent = message;
    status.hidden = false;
    if (storageBlocked) {
      const link = document.createElement('a');
      link.href = 'settings.html';
      link.textContent = ' Open Settings';
      status.appendChild(link);
    }
  }

  function loadGameState() {
    try {
      const result = storage.readProject();
      if (result.warnings.length) report(result.warnings.join(' '));
      try { storage.writeProject(result.project); }
      catch (error) { report(error.message); }
      return result.project;
    } catch (error) {
      storageBlocked = true;
      report(error.message + ' Start a New Project or import a valid file in Settings to recover. Stored data is untouched.');
      return namespace.ProjectStorage.emptyProject();
    }
  }

  function currentGameState() {
    const project = editorState.getProjectState();
    return {
      schemaVersion: namespace.AppInfo.schemaVersion,
      sceneList: project.scenes,
      saveCurrentScene: project.currentScene,
      saveCustomKeyBindings: project.keyBindings,
      persistentSettings: project.persistentSettings,
      editorSettings: storage.readProject().project.editorSettings
    };
  }

  function silentSaveGameState() {
    if (storageBlocked) {
      report('The unreadable saved project is protected. Start a New Project or import a valid file in Settings first.');
      return false;
    }
    try {
      storage.writeProject(currentGameState());
      report('Saved project to this browser. Workspace edits require Save Scene.');
      return true;
    } catch (error) { report(error.message); return false; }
  }

  function saveGameState() { return silentSaveGameState(); }

  function bootstrapEditor() {
    const gameState = loadGameState();
    editorState = namespace.createEditorState({
      scenes: gameState.sceneList, currentScene: gameState.saveCurrentScene,
      keyBindings: gameState.saveCustomKeyBindings, persistentSettings: gameState.persistentSettings
    });
    const renderer = namespace.createEditorRenderer({ state: editorState, document: document });
    const controller = namespace.createEditorController({
      state: editorState, renderer: renderer, document: document, window: global,
      onSave: saveGameState, onSilentSave: silentSaveGameState,
      onNavigateToSettings: function () { global.location.href = 'settings.html'; }
    });
    global.editorState = editorState;
    global.editorRenderer = renderer;
    global.editorController = controller;
    const help = document.getElementById('editor-help');
    try { help.hidden = storage.helpDismissed(); } catch (error) { help.hidden = false; }
    document.getElementById('show-help').addEventListener('click', function () { help.hidden = false; help.scrollIntoView({ block: 'nearest' }); });
    document.getElementById('dismiss-help').addEventListener('click', function () {
      help.hidden = true;
      try { storage.dismissHelp(); } catch (error) { report(error.message); }
    });
    document.querySelectorAll('[data-app-version]').forEach(function (element) { element.textContent = namespace.AppInfo.version; });
  }

  global.loadGameState = loadGameState;
  global.saveGameState = saveGameState;
  global.silentSaveGameState = silentSaveGameState;
  global.createDefaultPersistentSettings = namespace.ProjectModel.createDefaultPersistentSettings;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrapEditor, { once: true });
  else bootstrapEditor();
})(window);
