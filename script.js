(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};
  let editorState = null;
  let editorRenderer = null;
  let editorController = null;

  function createDefaultPersistentSettings() {
    return namespace.ProjectModel.createDefaultPersistentSettings();
  }

  function loadGameState() {
    const savedGameState = global.localStorage.getItem('gameState');
    if (!savedGameState) {
      global.alert('No saved game state found.');
      return {
        sceneList: {},
        saveCurrentScene: '',
        saveCustomKeyBindings: {},
        persistentSettings: createDefaultPersistentSettings()
      };
    }

    try {
      const gameState = JSON.parse(savedGameState);
      gameState.sceneList = gameState.sceneList || {};
      gameState.saveCurrentScene = gameState.saveCurrentScene || '';
      gameState.saveCustomKeyBindings = gameState.saveCustomKeyBindings || {};
      gameState.persistentSettings = namespace.ProjectModel.normalizePersistentSettings(gameState.persistentSettings);
      return gameState;
    } catch (error) {
      console.error('Unable to parse saved game state:', error);
      global.alert('The saved game state could not be loaded.');
      return {
        sceneList: {},
        saveCurrentScene: '',
        saveCustomKeyBindings: {},
        persistentSettings: createDefaultPersistentSettings()
      };
    }
  }

  function currentGameState() {
    if (!editorState) return null;
    const project = editorState.getProjectState();
    return {
      sceneList: project.scenes,
      saveCurrentScene: project.currentScene,
      saveCustomKeyBindings: project.keyBindings,
      persistentSettings: project.persistentSettings
    };
  }

  function saveGameState() {
    const gameState = currentGameState();
    if (!gameState) return false;
    global.localStorage.setItem('gameState', JSON.stringify(gameState));
    global.alert('Saved ' + Object.keys(gameState.sceneList).length + ' scenes to local storage!');
    return true;
  }

  function silentSaveGameState() {
    const gameState = currentGameState();
    if (!gameState) return false;
    global.localStorage.setItem('gameState', JSON.stringify(gameState));
    return true;
  }

  function bootstrapEditor() {
    const gameState = loadGameState();
    editorState = namespace.createEditorState({
      scenes: gameState.sceneList,
      currentScene: gameState.saveCurrentScene,
      keyBindings: gameState.saveCustomKeyBindings,
      persistentSettings: gameState.persistentSettings
    });

    global.persistentSettings = editorState.getProjectState().persistentSettings;
    editorState.subscribe(function (event) {
      if (event.type === 'persistent:update') {
        global.persistentSettings = editorState.getProjectState().persistentSettings;
      }
    });

    editorRenderer = namespace.createEditorRenderer({
      state: editorState,
      document: document
    });

    editorController = namespace.createEditorController({
      state: editorState,
      renderer: editorRenderer,
      document: document,
      window: global,
      onSave: saveGameState,
      onSilentSave: silentSaveGameState,
      onNavigateToSettings: function () {
        const savedState = global.localStorage.getItem('gameState');
        console.log('Saved State Before Navigation:', savedState ? JSON.parse(savedState) : null);
        global.setTimeout(function () {
          global.location.href = 'settings.html';
        }, 500);
      }
    });

    if (gameState.saveCurrentScene &&
        !Object.prototype.hasOwnProperty.call(gameState.sceneList, gameState.saveCurrentScene)) {
      global.alert("Scene '" + gameState.saveCurrentScene + "' does not exist!");
    }

    global.editorState = editorState;
    global.editorRenderer = editorRenderer;
    global.editorController = editorController;
    console.log('Editor initialized. Current scene:', editorState.getProjectState().currentScene);
  }

  global.createDefaultPersistentSettings = createDefaultPersistentSettings;
  global.loadGameState = loadGameState;
  global.saveGameState = saveGameState;
  global.silentSaveGameState = silentSaveGameState;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapEditor, { once: true });
  } else {
    bootstrapEditor();
  }
})(window);
