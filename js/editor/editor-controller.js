(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};

  function createEditorController(options) {
    options = options || {};
    const state = options.state;
    const renderer = options.renderer;
    const documentRef = options.document || document;
    const windowRef = options.window || window;
    const onSave = options.onSave || function () {};
    const onSilentSave = options.onSilentSave || function () {};
    const onNavigateToSettings = options.onNavigateToSettings || function () {
      windowRef.setTimeout(function () { windowRef.location.href = 'settings.html'; }, 500);
    };
    const onClearStorage = options.onClearStorage || function () {
      windowRef.localStorage.clear();
      windowRef.alert('Local storage cleared!');
      windowRef.location.reload();
    };

    if (!state || !renderer) throw new Error('createEditorController requires state and renderer.');

    const removers = [];
    const delayedSettingsUpdates = new Map();
    const canvas = documentRef.getElementById('ascii-display');
    let activePointer = null;

    function byId(id) {
      return documentRef.getElementById(id);
    }

    function listen(target, type, handler, eventOptions) {
      if (!target) return;
      target.addEventListener(type, handler, eventOptions);
      removers.push(function () { target.removeEventListener(type, handler, eventOptions); });
    }

    function selectedObject() {
      const workspace = state.getWorkspaceState();
      return workspace.objects.find(function (object) {
        return object._editorId === workspace.selectedObjectId;
      }) || null;
    }

    function updateSelected(updates) {
      const object = selectedObject();
      if (!object) return false;
      return state.updateObject(object._editorId, updates);
    }

    function updateSettings(mutator, saveSilently) {
      const settings = state.getProjectState().persistentSettings;
      mutator(settings);
      state.setPersistentSettings(settings);
      if (saveSilently) onSilentSave();
    }

    function scheduleSettingsUpdate(key, callback) {
      if (delayedSettingsUpdates.has(key)) windowRef.clearTimeout(delayedSettingsUpdates.get(key));
      delayedSettingsUpdates.set(key, windowRef.setTimeout(function () {
        delayedSettingsUpdates.delete(key);
        callback();
      }, 500));
    }

    function addObject() {
      const input = byId('ascii-input');
      const ascii = input ? input.value : '';
      if (!ascii) {
        windowRef.alert('Please enter some ASCII art!');
        return false;
      }
      const rect = canvas ? canvas.getBoundingClientRect() : { width: 650, height: 400 };
      state.createObject(ascii, {
        left: (rect.width - 100) / 2,
        top: (rect.height - 50) / 2
      });
      if (input) input.value = '';
      return true;
    }

    function saveScene() {
      const input = byId('scene-name');
      const name = input ? input.value : '';
      if (!name) {
        windowRef.alert('Please enter a scene name!');
        return false;
      }
      state.saveWorkspaceAsScene(name);
      if (input) input.value = '';
      windowRef.alert("Scene '" + name + "' saved!");
      return true;
    }

    function loadScene() {
      const input = byId('scene-name');
      const name = input ? input.value : '';
      if (!name) {
        windowRef.alert('Please enter a scene name to load!');
        return false;
      }
      if (!state.loadSceneIntoWorkspace(name)) {
        windowRef.alert("Scene '" + name + "' does not exist!");
        return false;
      }
      if (input) input.value = '';
      onSave();
      return true;
    }

    function deleteSelected() {
      const workspace = state.getWorkspaceState();
      if (!workspace.selectedObjectId) {
        windowRef.alert('No ASCII art selected to delete!');
        return false;
      }
      state.deleteObject(workspace.selectedObjectId);
      renderer.hideContextMenu();
      return true;
    }

    function clearCanvas() {
      if (windowRef.confirm('Are you sure you want to clear all ASCII objects from the canvas?')) {
        state.clearWorkspace();
        renderer.hideContextMenu();
      }
    }

    function onObjectListClick(event) {
      const item = event.target.closest('[data-object-id]');
      if (item) state.selectObject(item.dataset.objectId);
    }

    function onSceneListClick(event) {
      const button = event.target.closest('[data-action="delete-scene"]');
      if (!button) return;
      const name = button.dataset.sceneName;
      if (windowRef.confirm('Are you sure you want to delete scene: "' + name + '"?')) {
        state.deleteScene(name);
        onSilentSave();
      }
    }

    function onKeybindingListClick(event) {
      const button = event.target.closest('[data-action="delete-keybinding"]');
      if (!button) return;
      const key = button.dataset.key;
      if (windowRef.confirm("Delete keybind for '" + key + "'?")) {
        state.deleteKeyBinding(key);
        onSilentSave();
      }
    }

    function onCurrencyListClick(event) {
      const button = event.target.closest('[data-action="delete-currency"]');
      if (!button) return;
      const name = button.dataset.currencyName;
      if (windowRef.confirm("Delete currency '" + name + "'?")) {
        updateSettings(function (settings) { delete settings.currencies[name]; }, true);
      }
    }

    function onCurrencyInput(event) {
      const input = event.target.closest('[data-currency-name]');
      if (!input) return;
      const name = input.dataset.currencyName;
      const value = parseInt(input.value, 10) || 0;
      scheduleSettingsUpdate('currency:' + name, function () {
        updateSettings(function (settings) { settings.currencies[name] = value; }, true);
      });
    }

    function onObjectEffectsClick(event) {
      const button = event.target.closest('[data-action="delete-object-effect"]');
      if (!button) return;
      const name = button.dataset.objectName;
      updateSettings(function (settings) { delete settings.objectEffects[name]; }, true);
    }

    function onObjectEffectsChange(event) {
      const select = event.target.closest('[data-object-effect-name]');
      if (!select) return;
      const name = select.dataset.objectEffectName;
      updateSettings(function (settings) {
        settings.objectEffects[name] = settings.objectEffects[name] || {};
        settings.objectEffects[name].stat = select.value;
      }, true);
    }

    function onObjectEffectsInput(event) {
      const input = event.target.closest('[data-object-effect-amount]');
      if (!input) return;
      const name = input.dataset.objectEffectAmount;
      const value = parseInt(input.value, 10) || 0;
      scheduleSettingsUpdate('effect:' + name, function () {
        updateSettings(function (settings) {
          settings.objectEffects[name] = settings.objectEffects[name] || {};
          settings.objectEffects[name].amount = value;
        }, true);
      });
    }

    function onCanvasClick(event) {
      const element = event.target.closest('.ascii-art[data-object-id]');
      if (!element || !canvas.contains(element)) return;
      event.stopPropagation();
      const id = element.dataset.objectId;
      state.selectObject(id);
      const object = selectedObject();
      if (object && object.clickable && object.colors.click.enabled) {
        element.style.color = object.colors.click.color;
      }
      renderer.showContextMenu(id);
    }

    function onCanvasPointerOver(event) {
      const element = event.target.closest('.ascii-art[data-object-id]');
      if (!element || element.contains(event.relatedTarget)) return;
      const workspace = state.getWorkspaceState();
      const object = workspace.objects.find(function (item) { return item._editorId === element.dataset.objectId; });
      if (object && object.colors.hover.enabled) element.style.color = object.colors.hover.color;
    }

    function onCanvasPointerOut(event) {
      const element = event.target.closest('.ascii-art[data-object-id]');
      if (!element || element.contains(event.relatedTarget)) return;
      const workspace = state.getWorkspaceState();
      const object = workspace.objects.find(function (item) { return item._editorId === element.dataset.objectId; });
      if (object) element.style.color = object.colors.default;
    }

    function onPointerDown(event) {
      const element = event.target.closest('.ascii-art[data-object-id]');
      if (!element || !canvas.contains(element)) return;
      event.preventDefault();
      const objectId = element.dataset.objectId;
      state.selectObject(objectId);
      const elementRect = element.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      activePointer = {
        pointerId: event.pointerId,
        objectId: objectId,
        element: element,
        canvasRect: canvasRect,
        offsetX: event.clientX - elementRect.left,
        offsetY: event.clientY - elementRect.top
      };
      try { element.setPointerCapture(event.pointerId); } catch (error) { /* Synthetic events may not be capturable. */ }
    }

    function onPointerMove(event) {
      if (!activePointer || event.pointerId !== activePointer.pointerId) return;
      event.preventDefault();
      state.updateObject(activePointer.objectId, {
        left: event.clientX - activePointer.canvasRect.left - activePointer.offsetX,
        top: event.clientY - activePointer.canvasRect.top - activePointer.offsetY
      });
    }

    function finishPointer(event) {
      if (!activePointer || event.pointerId !== activePointer.pointerId) return;
      try { activePointer.element.releasePointerCapture(event.pointerId); } catch (error) { /* Capture may already be released. */ }
      activePointer = null;
    }

    function bindSelectedControl(id, eventName, createUpdates) {
      listen(byId(id), eventName, function (event) {
        const object = selectedObject();
        if (!object) return;
        updateSelected(createUpdates(event.target, object));
      });
    }

    function bindPropertyControls() {
      bindSelectedControl('item-name', 'input', function (input) { return { itemName: input.value }; });
      bindSelectedControl('default-color', 'input', function (input, object) {
        return { colors: { default: input.value, hover: object.colors.hover, click: object.colors.click } };
      });
      bindSelectedControl('hover-color', 'input', function (input, object) {
        return { colors: { default: object.colors.default, hover: Object.assign({}, object.colors.hover, { color: input.value }), click: object.colors.click } };
      });
      bindSelectedControl('click-color', 'input', function (input, object) {
        return { colors: { default: object.colors.default, hover: object.colors.hover, click: Object.assign({}, object.colors.click, { color: input.value }) } };
      });
      bindSelectedControl('enable-hover-color', 'change', function (input, object) {
        return { colors: { default: object.colors.default, hover: Object.assign({}, object.colors.hover, { enabled: input.checked }), click: object.colors.click } };
      });
      bindSelectedControl('enable-click-color', 'change', function (input, object) {
        return { colors: { default: object.colors.default, hover: object.colors.hover, click: Object.assign({}, object.colors.click, { enabled: input.checked }) } };
      });
      bindSelectedControl('prop-clickable', 'change', function (input) { return { clickable: input.checked }; });
      bindSelectedControl('prop-invisible', 'change', function (input) { return { visible: !input.checked }; });
      bindSelectedControl('prop-main-player', 'change', function (input) { return { mainCharacter: input.checked }; });
      bindSelectedControl('prop-collision', 'change', function (input) { return { collision: input.checked }; });
      bindSelectedControl('prop-switch-scene-enabled', 'change', function (input) { return { switchScene: { enabled: input.checked } }; });
      bindSelectedControl('switch-scene-trigger', 'change', function (input) { return { switchScene: { trigger: input.value } }; });
      bindSelectedControl('switch-scene-list', 'change', function (input) { return { switchScene: { target: input.value } }; });
      bindSelectedControl('prop-give-currency-enabled', 'change', function (input) { return { giveCurrency: { enabled: input.checked } }; });
      bindSelectedControl('give-currency-trigger', 'change', function (input) { return { giveCurrency: { trigger: input.value } }; });
      bindSelectedControl('give-currency-list', 'change', function (input) { return { giveCurrency: { currency: input.value } }; });
      bindSelectedControl('give-currency-amount', 'input', function (input) { return { giveCurrency: { amount: parseInt(input.value, 10) || 0 } }; });
      bindSelectedControl('give-currency-delete-after', 'change', function (input) { return { giveCurrency: { deleteAfter: input.checked } }; });
      bindSelectedControl('prop-give-object-enabled', 'change', function (input) { return { giveObject: { enabled: input.checked } }; });
      bindSelectedControl('give-object-trigger', 'change', function (input) { return { giveObject: { trigger: input.value } }; });
      bindSelectedControl('give-object-list', 'change', function (input) { return { giveObject: { object: input.value } }; });
      bindSelectedControl('give-object-delete-after', 'change', function (input) { return { giveObject: { deleteAfter: input.checked } }; });
    }

    function saveProperties() {
      const object = selectedObject();
      if (!object) return;
      updateSelected({
        itemName: byId('item-name').value,
        colors: {
          default: byId('default-color').value,
          hover: { enabled: byId('enable-hover-color').checked, color: byId('hover-color').value },
          click: { enabled: byId('enable-click-color').checked, color: byId('click-color').value }
        },
        clickable: byId('prop-clickable').checked,
        visible: !byId('prop-invisible').checked,
        mainCharacter: byId('prop-main-player').checked,
        collision: byId('prop-collision').checked,
        switchScene: {
          enabled: byId('prop-switch-scene-enabled').checked,
          trigger: byId('switch-scene-trigger').value,
          target: byId('switch-scene-list').value
        },
        giveCurrency: {
          enabled: byId('prop-give-currency-enabled').checked,
          trigger: byId('give-currency-trigger').value,
          currency: byId('give-currency-list').value,
          amount: parseInt(byId('give-currency-amount').value, 10) || 0,
          deleteAfter: byId('give-currency-delete-after').checked
        },
        giveObject: {
          enabled: byId('prop-give-object-enabled').checked,
          trigger: byId('give-object-trigger').value,
          object: byId('give-object-list').value,
          deleteAfter: byId('give-object-delete-after').checked
        }
      });
    }

    listen(byId('add-ascii-art'), 'click', addObject);
    listen(byId('save-scene'), 'click', saveScene);
    listen(byId('load-scene'), 'click', loadScene);
    listen(byId('clear-canvas'), 'click', clearCanvas);
    listen(byId('delete-selected-item'), 'click', deleteSelected);
    listen(byId('delete-item'), 'click', deleteSelected);
    listen(byId('save-properties'), 'click', saveProperties);
    listen(byId('close-context-menu'), 'click', renderer.hideContextMenu);
    listen(byId('object-list'), 'click', onObjectListClick);
    listen(byId('scene-list'), 'click', onSceneListClick);
    listen(byId('keybindings-ul'), 'click', onKeybindingListClick);
    listen(byId('editor-currency-list'), 'click', onCurrencyListClick);
    listen(byId('editor-currency-list'), 'input', onCurrencyInput);
    listen(byId('object-stat-effects-list'), 'click', onObjectEffectsClick);
    listen(byId('object-stat-effects-list'), 'change', onObjectEffectsChange);
    listen(byId('object-stat-effects-list'), 'input', onObjectEffectsInput);
    listen(canvas, 'click', onCanvasClick);
    listen(canvas, 'pointerover', onCanvasPointerOver);
    listen(canvas, 'pointerout', onCanvasPointerOut);
    listen(canvas, 'pointerdown', onPointerDown);
    listen(canvas, 'pointermove', onPointerMove);
    listen(canvas, 'pointerup', finishPointer);
    listen(canvas, 'pointercancel', finishPointer);

    bindPropertyControls();

    listen(documentRef, 'click', function (event) {
      const menu = byId('context-menu');
      if (menu && menu.style.display === 'block' && !menu.contains(event.target)) renderer.hideContextMenu();
    });

    listen(byId('add-global-keybinding'), 'click', function () {
      const keyInput = byId('global-key-input');
      const actionInput = byId('global-action-select');
      if (keyInput.value && actionInput.value) {
        state.setKeyBinding(keyInput.value, actionInput.value);
        keyInput.value = '';
        onSilentSave();
      } else {
        windowRef.alert('Please enter a key and select an action.');
      }
    });

    listen(byId('add-currency'), 'click', function () {
      const nameInput = byId('new-currency-name');
      const valueInput = byId('new-currency-value');
      const name = nameInput.value.trim();
      const value = parseInt(valueInput.value, 10);
      if (!name || Number.isNaN(value)) {
        windowRef.alert('Enter a valid currency name and value.');
        return;
      }
      updateSettings(function (settings) { settings.currencies[name] = value; }, true);
      nameInput.value = '';
      valueInput.value = '';
    });

    listen(byId('add-object-button'), 'click', function () {
      const input = byId('new-object-name');
      const name = input.value.trim();
      if (!name) {
        windowRef.alert('Please enter a valid object name.');
        return;
      }
      const settings = state.getProjectState().persistentSettings;
      if (!settings.objects.includes(name)) {
        settings.objects.push(name);
        state.setPersistentSettings(settings);
        onSilentSave();
      }
      input.value = '';
    });

    listen(byId('enable-inventory'), 'change', function (event) {
      updateSettings(function (settings) { settings.inventoryEnabled = event.target.checked; }, true);
    });
    listen(byId('enable-toolbar'), 'change', function (event) {
      updateSettings(function (settings) { settings.toolbar.enabled = event.target.checked; }, false);
    });
    listen(byId('enable-rpg-mechanics'), 'change', function (event) {
      updateSettings(function (settings) { settings.rpgEnabled = event.target.checked; }, false);
    });

    documentRef.querySelectorAll('.panel-box').forEach(function (panel) {
      const header = panel.querySelector('.panel-header');
      const content = panel.querySelector('.panel-content');
      if (!header || !content) return;
      content.style.display = panel.classList.contains('collapsed') ? 'none' : 'block';
      listen(header, 'click', function () {
        panel.classList.toggle('collapsed');
        content.style.display = panel.classList.contains('collapsed') ? 'none' : 'block';
      });
    });

    listen(byId('settings-button'), 'click', function () {
      onSave();
      onNavigateToSettings();
    });
    listen(byId('clear-storage'), 'click', onClearStorage);

    return {
      addObject: addObject,
      saveScene: saveScene,
      loadScene: loadScene,
      deleteSelected: deleteSelected,
      clearCanvas: clearCanvas,
      destroy: function () {
        removers.splice(0).forEach(function (remove) { remove(); });
        delayedSettingsUpdates.forEach(function (timer) { windowRef.clearTimeout(timer); });
        delayedSettingsUpdates.clear();
        activePointer = null;
      }
    };
  }

  namespace.createEditorController = createEditorController;
})(window);
