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
      if (!windowRef.confirm('Start a new project? This clears saved scenes and settings.')) return;
      try {
        namespace.projectStorage.clearProject();
        windowRef.location.reload();
      } catch (error) { windowRef.alert(error.message); }
    };

    if (!state || !renderer) throw new Error('createEditorController requires state and renderer.');

    const removers = [];
    const canvas = documentRef.getElementById('ascii-display');
    let activePointer = null;
    let suppressDragClick = false;

    function byId(id) {
      return documentRef.getElementById(id);
    }

    function listen(target, type, handler, eventOptions) {
      if (!target || !target.addEventListener) return;
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

    function addObject() {
      const input = byId('ascii-input');
      const ascii = input ? input.value : '';
      if (!ascii) {
        windowRef.alert('Please enter some ASCII art!');
        return false;
      }
      const created = state.createObject(ascii, {
        left: ((canvas ? canvas.clientWidth : 650) - 100) / 2,
        top: ((canvas ? canvas.clientHeight : 400) - 50) / 2
      });
      state.selectObject(created._editorId);
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
      if (!state.saveWorkspaceAsScene(name)) {
        windowRef.alert('Choose a nonempty scene name other than __proto__, prototype, or constructor.');
        return false;
      }
      if (onSilentSave() === false) return false;
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
      const load = event.target.closest('[data-action="load-scene"]');
      if (load) {
        state.loadSceneIntoWorkspace(load.dataset.sceneName);
        onSave();
        return;
      }
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

    function saveCurrencyChanges() {
      const inputs = Array.from(documentRef.querySelectorAll('input[data-currency-name]'));
      if (inputs.some(function (input) { return input.value.trim() === '' || !Number.isFinite(Number(input.value)); })) {
        windowRef.alert('Enter a valid amount for every currency before saving.');
        return;
      }
      updateSettings(function (settings) {
        inputs.forEach(function (input) {
          if (Object.prototype.hasOwnProperty.call(settings.currencies, input.dataset.currencyName)) {
            settings.currencies[input.dataset.currencyName] = Number(input.value);
          }
        });
      }, true);
    }

    function onObjectEffectsClick(event) {
      const button = event.target.closest('[data-action="delete-object-effect"]');
      if (!button) return;
      const name = button.dataset.objectName;
      updateSettings(function (settings) { delete settings.objectEffects[name]; }, true);
    }

    function onCanvasClick(event) {
      if (suppressDragClick) { suppressDragClick = false; return; }
      const element = event.target.closest('[data-object-id]');
      if (!element || !canvas.contains(element)) return;
      event.stopPropagation();
      const id = element.dataset.objectId;
      state.selectObject(id);
      const object = selectedObject();
      if (object && object.clickable && object.colors.click.enabled) {
        element.style.color = object.colors.click.color;
      }
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') renderer.showContextMenu(id);
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
      if (activePointer || event.button !== 0) return;
      const element = event.target.closest('[data-object-id]');
      if (!element || !canvas.contains(element)) return;
      event.preventDefault();
      const objectId = element.dataset.objectId;
      state.selectObject(objectId);
      renderer.hideContextMenu();
      suppressDragClick = false;
      const object = selectedObject();
      const objectElement = renderer.getObjectElement(objectId);
      const canvasRect = canvas.getBoundingClientRect();
      activePointer = {
        pointerId: event.pointerId,
        objectId: objectId,
        element: element,
        scale: canvasRect.width / canvas.offsetWidth || 1,
        startX: event.clientX,
        startY: event.clientY,
        left: object.left,
        top: object.top,
        maxLeft: Math.max(0, canvas.clientWidth - objectElement.offsetWidth),
        maxTop: Math.max(0, canvas.clientHeight - objectElement.offsetHeight),
        moved: false
      };
      try { element.setPointerCapture(event.pointerId); } catch (error) { /* Synthetic events may not be capturable. */ }
    }

    function onPointerMove(event) {
      if (!activePointer || event.pointerId !== activePointer.pointerId) return;
      event.preventDefault();
      const dx = event.clientX - activePointer.startX;
      const dy = event.clientY - activePointer.startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) activePointer.moved = true;
      state.updateObject(activePointer.objectId, {
        left: Math.max(0, Math.min(activePointer.maxLeft, activePointer.left + dx / activePointer.scale)),
        top: Math.max(0, Math.min(activePointer.maxTop, activePointer.top + dy / activePointer.scale))
      });
    }

    function finishPointer(event) {
      if (!activePointer || event.pointerId !== activePointer.pointerId) return;
      const pointer = activePointer;
      activePointer = null;
      suppressDragClick = pointer.moved || event.type === 'pointercancel';
      try { pointer.element.releasePointerCapture(event.pointerId); } catch (error) { /* Capture may already be released. */ }
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
    listen(byId('save-currency-changes'), 'click', saveCurrencyChanges);
    listen(byId('object-stat-effects-list'), 'click', onObjectEffectsClick);
    listen(canvas, 'click', onCanvasClick);
    listen(canvas, 'pointerover', onCanvasPointerOver);
    listen(canvas, 'pointerout', onCanvasPointerOut);
    listen(canvas, 'pointerdown', onPointerDown);
    listen(canvas, 'pointermove', onPointerMove);
    listen(canvas, 'pointerup', finishPointer);
    listen(canvas, 'pointercancel', finishPointer);
    listen(canvas, 'lostpointercapture', finishPointer);
    listen(canvas, 'contextmenu', function (event) {
      const element = event.target.closest('[data-object-id]');
      if (!element) return;
      event.preventDefault();
      state.selectObject(element.dataset.objectId);
      renderer.showContextMenu(element.dataset.objectId);
    });
    listen(byId('edit-selected-properties'), 'click', function (event) {
      event.stopPropagation();
      const object = selectedObject();
      if (object) renderer.showContextMenu(object._editorId);
    });
    listen(documentRef, 'keydown', function (event) {
      if (event.key === 'Escape') renderer.hideContextMenu();
      if ((event.key === 'Enter' || event.key === ' ') &&
          event.target.matches('[role="button"]')) {
        event.preventDefault();
        event.target.click();
      }
    });
    listen(windowRef, 'blur', function () {
      if (activePointer) finishPointer({ pointerId: activePointer.pointerId, type: 'pointercancel' });
    });

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
      if (!name || !namespace.ProjectModel.safeName(name) || Number.isNaN(value)) {
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
      if (!name || !namespace.ProjectModel.safeName(name)) {
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
      if (windowRef.matchMedia && windowRef.matchMedia('(max-width: 1100px)').matches) panel.classList.add('collapsed');
      content.style.display = panel.classList.contains('collapsed') ? 'none' : 'block';
      header.setAttribute('aria-expanded', String(!panel.classList.contains('collapsed')));
      listen(header, 'click', function () {
        panel.classList.toggle('collapsed');
        content.style.display = panel.classList.contains('collapsed') ? 'none' : 'block';
        header.setAttribute('aria-expanded', String(!panel.classList.contains('collapsed')));
      });
    });

    documentRef.querySelectorAll('[data-editor-target]').forEach(function (button) {
      listen(button, 'click', function () {
        const target = byId(button.dataset.editorTarget);
        if (!target) return;
        if (target.classList.contains('panel-box')) {
          target.classList.remove('collapsed');
          target.querySelector('.panel-content').style.display = 'block';
          target.querySelector('.panel-header').setAttribute('aria-expanded', 'true');
        }
        target.scrollIntoView({ block: 'start' });
      });
    });

    listen(byId('settings-button'), 'click', function () {
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
        if (activePointer) finishPointer({ pointerId: activePointer.pointerId, type: 'pointercancel' });
        removers.splice(0).forEach(function (remove) { remove(); });
        activePointer = null;
      }
    };
  }

  namespace.createEditorController = createEditorController;
})(window);
