(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};

  function createEditorState(initialData) {
    const model = namespace.ProjectModel;
    if (!model) throw new Error('project-model.js must be loaded before editor-state.js.');

    const input = initialData || {};
    const inputScenes = input.scenes || input.sceneList || {};
    const listeners = new Set();
    let nextEditorId = 1;

    const projectState = {
      scenes: {},
      currentScene: input.currentScene !== undefined ? input.currentScene : (input.saveCurrentScene || ''),
      keyBindings: model.deepClone(input.keyBindings || input.saveCustomKeyBindings || {}),
      persistentSettings: model.normalizePersistentSettings(input.persistentSettings)
    };

    Object.keys(inputScenes).forEach(function (name) {
      projectState.scenes[name] = model.serializeScene(inputScenes[name]);
    });

    const workspaceState = {
      sourceSceneName: null,
      objects: [],
      selectedObjectId: null,
      dirty: false
    };

    function assignEditorIds(objects) {
      return objects.map(function (object) {
        const editableObject = model.normalizeObject(object);
        editableObject._editorId = 'editor-object-' + nextEditorId;
        nextEditorId += 1;
        return editableObject;
      });
    }

    function snapshot() {
      return {
        projectState: model.deepClone(projectState),
        workspaceState: model.deepClone(workspaceState)
      };
    }

    function notify(type, details) {
      const event = Object.assign({ type: type }, details || {});
      const currentSnapshot = snapshot();
      listeners.forEach(function (listener) {
        listener(event, currentSnapshot);
      });
    }

    function getProjectState() {
      return model.deepClone(projectState);
    }

    function getWorkspaceState() {
      return model.deepClone(workspaceState);
    }

    function subscribe(listener) {
      if (typeof listener !== 'function') throw new Error('subscribe requires a function.');
      listeners.add(listener);
      return function unsubscribe() {
        listeners.delete(listener);
      };
    }

    function generateUniqueName() {
      let counter = 1;
      const existingNames = workspaceState.objects.map(function (object) { return object.itemName; });
      while (existingNames.includes('Object ' + counter)) counter += 1;
      return 'Object ' + counter;
    }

    function createObject(ascii, overrides) {
      const object = model.createDefaultObject(Object.assign({
        ascii: ascii,
        itemName: generateUniqueName()
      }, overrides || {}));
      object._editorId = 'editor-object-' + nextEditorId;
      nextEditorId += 1;
      if (object.mainCharacter) {
        workspaceState.objects.forEach(function (existingObject) {
          existingObject.mainCharacter = false;
        });
      }
      workspaceState.objects.push(object);
      workspaceState.dirty = true;
      notify('object:create', { objectId: object._editorId });
      return model.deepClone(object);
    }

    function mergeObject(current, updates) {
      const next = Object.assign({}, current, model.deepClone(updates || {}));
      if (updates && updates.colors) {
        next.colors = Object.assign({}, current.colors, updates.colors);
        if (updates.colors.hover) next.colors.hover = Object.assign({}, current.colors.hover, updates.colors.hover);
        if (updates.colors.click) next.colors.click = Object.assign({}, current.colors.click, updates.colors.click);
      }
      ['switchScene', 'giveCurrency', 'giveObject'].forEach(function (key) {
        if (updates && updates[key]) next[key] = Object.assign({}, current[key], updates[key]);
      });
      const normalized = model.normalizeObject(next);
      normalized._editorId = current._editorId;
      return normalized;
    }

    function updateObject(id, updates) {
      const index = workspaceState.objects.findIndex(function (object) { return object._editorId === id; });
      if (index === -1) return false;

      if (updates && updates.mainCharacter === true) {
        workspaceState.objects.forEach(function (object, objectIndex) {
          if (objectIndex !== index) object.mainCharacter = false;
        });
      }
      workspaceState.objects[index] = mergeObject(workspaceState.objects[index], updates);
      workspaceState.dirty = true;
      notify('object:update', { objectId: id, updatedFields: Object.keys(updates || {}) });
      return true;
    }

    function deleteObject(id) {
      const index = workspaceState.objects.findIndex(function (object) { return object._editorId === id; });
      if (index === -1) return false;
      workspaceState.objects.splice(index, 1);
      if (workspaceState.selectedObjectId === id) workspaceState.selectedObjectId = null;
      workspaceState.dirty = true;
      notify('object:delete', { objectId: id });
      return true;
    }

    function clearWorkspace() {
      workspaceState.objects = [];
      workspaceState.selectedObjectId = null;
      workspaceState.dirty = true;
      notify('workspace:clear');
    }

    function selectObject(id) {
      if (!workspaceState.objects.some(function (object) { return object._editorId === id; })) return false;
      if (workspaceState.selectedObjectId === id) return true;
      workspaceState.selectedObjectId = id;
      notify('selection:change', { objectId: id });
      return true;
    }

    function clearSelection() {
      if (workspaceState.selectedObjectId === null) return;
      workspaceState.selectedObjectId = null;
      notify('selection:clear');
    }

    function loadSceneIntoWorkspace(name) {
      if (!Object.prototype.hasOwnProperty.call(projectState.scenes, name)) return false;
      workspaceState.objects = assignEditorIds(model.cloneScene(projectState.scenes[name]));
      workspaceState.sourceSceneName = name;
      workspaceState.selectedObjectId = null;
      workspaceState.dirty = false;
      projectState.currentScene = name;
      notify('scene:load', { sceneName: name });
      return true;
    }

    function saveWorkspaceAsScene(name) {
      if (!name) return false;
      projectState.scenes[name] = model.serializeScene(workspaceState.objects);
      projectState.currentScene = name;
      workspaceState.sourceSceneName = name;
      workspaceState.dirty = false;
      notify('scene:save', { sceneName: name });
      return true;
    }

    function deleteScene(name) {
      if (!Object.prototype.hasOwnProperty.call(projectState.scenes, name)) return false;
      delete projectState.scenes[name];
      notify('scene:delete', { sceneName: name });
      return true;
    }

    function setKeyBinding(key, action) {
      if (!key || !action) return false;
      projectState.keyBindings[key] = action;
      notify('keybinding:set', { key: key });
      return true;
    }

    function deleteKeyBinding(key) {
      if (!Object.prototype.hasOwnProperty.call(projectState.keyBindings, key)) return false;
      delete projectState.keyBindings[key];
      notify('keybinding:delete', { key: key });
      return true;
    }

    function setPersistentSettings(settings) {
      projectState.persistentSettings = model.normalizePersistentSettings(settings);
      notify('persistent:update');
    }

    if (Object.prototype.hasOwnProperty.call(projectState.scenes, projectState.currentScene)) {
      workspaceState.objects = assignEditorIds(model.cloneScene(projectState.scenes[projectState.currentScene]));
      workspaceState.sourceSceneName = projectState.currentScene;
    }

    return {
      getProjectState: getProjectState,
      getWorkspaceState: getWorkspaceState,
      subscribe: subscribe,
      createObject: createObject,
      updateObject: updateObject,
      deleteObject: deleteObject,
      clearWorkspace: clearWorkspace,
      selectObject: selectObject,
      clearSelection: clearSelection,
      loadSceneIntoWorkspace: loadSceneIntoWorkspace,
      saveWorkspaceAsScene: saveWorkspaceAsScene,
      deleteScene: deleteScene,
      setKeyBinding: setKeyBinding,
      deleteKeyBinding: deleteKeyBinding,
      setPersistentSettings: setPersistentSettings
    };
  }

  namespace.createEditorState = createEditorState;
})(window);
