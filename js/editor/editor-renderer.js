(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};

  function createEditorRenderer(options) {
    options = options || {};
    const state = options.state;
    const documentRef = options.document || document;
    if (!state) throw new Error('createEditorRenderer requires editor state.');

    const objectElements = new Map();
    const canvas = documentRef.getElementById('ascii-display');
    let selectionOverlay = null;

    function byId(id) {
      return documentRef.getElementById(id);
    }

    function selectedObject(workspace) {
      return workspace.objects.find(function (object) {
        return object._editorId === workspace.selectedObjectId;
      }) || null;
    }

    function setValue(id, value) {
      const element = byId(id);
      if (element) element.value = value === null || value === undefined ? '' : value;
    }

    function setChecked(id, checked) {
      const element = byId(id);
      if (element) element.checked = Boolean(checked);
    }

    function getSelectionOverlay() {
      if (!canvas) return null;
      if (!selectionOverlay || !selectionOverlay.isConnected) {
        selectionOverlay = documentRef.createElement('div');
        selectionOverlay.id = 'selection-overlay';
        selectionOverlay.className = 'flashing-border';
        canvas.appendChild(selectionOverlay);
      }
      return selectionOverlay;
    }

    function hideSelectionOverlay() {
      if (selectionOverlay) selectionOverlay.style.display = 'none';
    }

    function updateSelectionOverlay(object) {
      const element = object ? objectElements.get(object._editorId) : null;
      if (!object || object.visible !== false || !element || !element.isConnected) {
        hideSelectionOverlay();
        return;
      }
      const overlay = getSelectionOverlay();
      if (!overlay) return;
      overlay.style.left = element.offsetLeft + 'px';
      overlay.style.top = element.offsetTop + 'px';
      overlay.style.width = element.offsetWidth + 'px';
      overlay.style.height = element.offsetHeight + 'px';
      overlay.style.display = 'block';
    }

    function createObjectElement(object) {
      const element = documentRef.createElement('div');
      element.className = 'ascii-art';
      element.dataset.objectId = object._editorId;
      if (canvas) canvas.appendChild(element);
      objectElements.set(object._editorId, element);
      return element;
    }

    function syncObject(object) {
      const element = objectElements.get(object._editorId) || createObjectElement(object);
      element.textContent = object.ascii;
      element.style.left = object.left + 'px';
      element.style.top = object.top + 'px';
      element.style.color = object.colors.default;
      element.style.opacity = object.visible === false ? '0' : '1';
      return element;
    }

    function renderWorkspace() {
      if (!canvas) return;
      canvas.replaceChildren();
      objectElements.clear();
      selectionOverlay = null;
      const workspace = state.getWorkspaceState();
      workspace.objects.forEach(syncObject);
      renderSelection(workspace);
      renderObjectList(workspace);
    }

    function renderSelection(workspaceInput) {
      const workspace = workspaceInput || state.getWorkspaceState();
      const object = selectedObject(workspace);
      objectElements.forEach(function (element, id) {
        const isVisibleSelection = object && id === object._editorId && object.visible !== false;
        element.classList.toggle('flashing-border', Boolean(isVisibleSelection));
      });
      updateSelectionOverlay(object);
      renderPropertyFields(object);
      const contextMenu = byId('context-menu');
      if (!object && contextMenu) contextMenu.style.display = 'none';
    }

    function renderPropertyFields(object) {
      if (!object) {
        setValue('item-name', '');
        setValue('default-color', '#000000');
        setValue('hover-color', '#000000');
        setValue('click-color', '#000000');
        setChecked('enable-default-color', false);
        setChecked('enable-hover-color', false);
        setChecked('enable-click-color', false);
        setChecked('prop-clickable', false);
        setChecked('prop-invisible', false);
        setChecked('prop-main-player', false);
        setChecked('prop-collision', false);
        setChecked('prop-switch-scene-enabled', false);
        setValue('switch-scene-trigger', 'click');
        setValue('switch-scene-list', '');
        setChecked('prop-give-currency-enabled', false);
        setValue('give-currency-trigger', 'click');
        setValue('give-currency-list', '');
        setValue('give-currency-amount', 0);
        setChecked('give-currency-delete-after', true);
        setChecked('prop-give-object-enabled', false);
        setValue('give-object-trigger', 'click');
        setValue('give-object-list', '');
        setChecked('give-object-delete-after', true);
        return;
      }
      setValue('item-name', object.itemName);
      setValue('default-color', object.colors.default);
      setValue('hover-color', object.colors.hover.color);
      setValue('click-color', object.colors.click.color);
      setChecked('enable-default-color', true);
      setChecked('enable-hover-color', object.colors.hover.enabled);
      setChecked('enable-click-color', object.colors.click.enabled);
      setChecked('prop-clickable', object.clickable);
      setChecked('prop-invisible', object.visible === false);
      setChecked('prop-main-player', object.mainCharacter);
      setChecked('prop-collision', object.collision);
      setChecked('prop-switch-scene-enabled', object.switchScene.enabled);
      setValue('switch-scene-trigger', object.switchScene.trigger);
      setValue('switch-scene-list', object.switchScene.target);
      setChecked('prop-give-currency-enabled', object.giveCurrency.enabled);
      setValue('give-currency-trigger', object.giveCurrency.trigger);
      setValue('give-currency-list', object.giveCurrency.currency);
      setValue('give-currency-amount', object.giveCurrency.amount);
      setChecked('give-currency-delete-after', object.giveCurrency.deleteAfter);
      setChecked('prop-give-object-enabled', object.giveObject.enabled);
      setValue('give-object-trigger', object.giveObject.trigger);
      setValue('give-object-list', object.giveObject.object);
      setChecked('give-object-delete-after', object.giveObject.deleteAfter);
    }

    function renderObjectList(workspaceInput) {
      const list = byId('object-list');
      if (!list) return;
      const workspace = workspaceInput || state.getWorkspaceState();
      list.replaceChildren();
      workspace.objects.forEach(function (object, index) {
        const item = documentRef.createElement('li');
        item.textContent = object.itemName || 'Object ' + (index + 1);
        item.dataset.objectId = object._editorId;
        item.className = 'scene-item';
        if (object._editorId === workspace.selectedObjectId) item.classList.add('selected-panel-item');
        list.appendChild(item);
      });
    }

    function renderSceneList(projectInput) {
      const list = byId('scene-list');
      const total = byId('scene-total');
      if (!list) return;
      const project = projectInput || state.getProjectState();
      const sceneNames = Object.keys(project.scenes);
      list.replaceChildren();
      if (total) total.textContent = sceneNames.length;
      sceneNames.forEach(function (sceneName) {
        const item = documentRef.createElement('li');
        item.dataset.sceneName = sceneName;
        if (sceneName === project.currentScene) item.classList.add('highlight');
        const label = documentRef.createElement('span');
        label.textContent = sceneName;
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.textContent = '×';
        button.className = 'delete-x';
        button.dataset.action = 'delete-scene';
        button.dataset.sceneName = sceneName;
        button.setAttribute('aria-label', "Delete scene '" + sceneName + "'");
        item.append(label, button);
        list.appendChild(item);
      });
    }

    function renderKeybindings(projectInput) {
      const list = byId('keybindings-ul');
      if (!list) return;
      const project = projectInput || state.getProjectState();
      list.replaceChildren();
      Object.keys(project.keyBindings).forEach(function (key) {
        const item = documentRef.createElement('li');
        const label = documentRef.createElement('span');
        label.textContent = key + ': ' + project.keyBindings[key];
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.textContent = '×';
        button.className = 'delete-x';
        button.dataset.action = 'delete-keybinding';
        button.dataset.key = key;
        button.setAttribute('aria-label', "Delete keybinding for '" + key + "'");
        item.append(label, button);
        list.appendChild(item);
      });
    }

    function renderCurrencies(projectInput) {
      const list = byId('editor-currency-list');
      if (!list) return;
      const project = projectInput || state.getProjectState();
      list.replaceChildren();
      Object.keys(project.persistentSettings.currencies).forEach(function (name) {
        const item = documentRef.createElement('li');
        const label = documentRef.createElement('label');
        label.textContent = name + ': ';
        const input = documentRef.createElement('input');
        input.type = 'number';
        input.value = project.persistentSettings.currencies[name];
        input.dataset.currencyName = name;
        input.style.width = '50px';
        label.appendChild(input);
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.textContent = '×';
        button.className = 'delete-x';
        button.dataset.action = 'delete-currency';
        button.dataset.currencyName = name;
        button.setAttribute('aria-label', "Delete currency '" + name + "'");
        item.append(label, button);
        list.appendChild(item);
      });
    }

    function renderObjectLibrary(projectInput) {
      const project = projectInput || state.getProjectState();
      const settings = project.persistentSettings;
      const libraryList = byId('object-library-list');
      if (libraryList) {
        libraryList.replaceChildren();
        settings.objects.forEach(function (name) {
          const item = documentRef.createElement('li');
          item.textContent = name;
          libraryList.appendChild(item);
        });
      }

      const effectsList = byId('object-stat-effects-list');
      if (!effectsList) return;
      effectsList.replaceChildren();
      const stats = Object.keys(settings.playerStats);
      settings.objects.forEach(function (name) {
        const effect = settings.objectEffects[name] || {};
        const item = documentRef.createElement('li');
        const label = documentRef.createElement('label');
        label.textContent = name;
        const select = documentRef.createElement('select');
        select.dataset.objectEffectName = name;
        stats.forEach(function (stat) {
          const option = documentRef.createElement('option');
          option.value = stat;
          option.textContent = stat;
          select.appendChild(option);
        });
        if (effect.stat && stats.includes(effect.stat)) select.value = effect.stat;
        const amount = documentRef.createElement('input');
        amount.type = 'number';
        amount.placeholder = '+/-';
        amount.style.width = '50px';
        amount.disabled = true;
        amount.dataset.objectEffectAmount = name;
        if (typeof effect.amount === 'number') amount.value = effect.amount;
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.textContent = '×';
        button.className = 'delete-x';
        button.dataset.action = 'delete-object-effect';
        button.dataset.objectName = name;
        item.append(label, select, amount, button);
        effectsList.appendChild(item);
      });
    }

    function replaceOptions(select, values, placeholder) {
      if (!select) return;
      const previousValue = select.value;
      select.replaceChildren();
      if (placeholder !== null) {
        const option = documentRef.createElement('option');
        option.value = '';
        option.textContent = placeholder;
        select.appendChild(option);
      }
      values.forEach(function (value) {
        const option = documentRef.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
      select.value = previousValue;
    }

    function populateDropdowns(projectInput) {
      const project = projectInput || state.getProjectState();
      replaceOptions(byId('switch-scene-list'), Object.keys(project.scenes), '-- Select Scene --');
      replaceOptions(byId('give-currency-list'), Object.keys(project.persistentSettings.currencies), null);
      replaceOptions(byId('give-object-list'), project.persistentSettings.objects, null);
      renderPropertyFields(selectedObject(state.getWorkspaceState()));
    }

    function renderPersistentControls(projectInput) {
      const project = projectInput || state.getProjectState();
      setChecked('enable-rpg-mechanics', project.persistentSettings.rpgEnabled);
      setChecked('enable-toolbar', project.persistentSettings.toolbar.enabled);
      setChecked('enable-inventory', project.persistentSettings.inventoryEnabled);
      const rpgConfig = byId('rpg-stats-config');
      if (rpgConfig) rpgConfig.style.display = project.persistentSettings.rpgEnabled ? 'block' : 'none';
    }

    function showContextMenu(objectId) {
      const element = objectElements.get(objectId);
      const menu = byId('context-menu');
      if (!element || !menu) return;
      const rect = element.getBoundingClientRect();
      menu.style.left = rect.left + 10 + 'px';
      menu.style.top = rect.top + 10 + 'px';
      menu.style.display = 'block';
      renderPropertyFields(selectedObject(state.getWorkspaceState()));
    }

    function hideContextMenu() {
      const menu = byId('context-menu');
      if (menu) menu.style.display = 'none';
    }

    function renderAll() {
      const project = state.getProjectState();
      renderWorkspace();
      renderSceneList(project);
      renderKeybindings(project);
      renderCurrencies(project);
      renderObjectLibrary(project);
      populateDropdowns(project);
      renderPersistentControls(project);
    }

    function onStateChange(event) {
      const project = state.getProjectState();
      if (event.type === 'object:create') {
        const workspace = state.getWorkspaceState();
        const object = workspace.objects.find(function (item) { return item._editorId === event.objectId; });
        if (object) syncObject(object);
        renderObjectList(workspace);
      } else if (event.type === 'object:update') {
        const workspace = state.getWorkspaceState();
        const object = workspace.objects.find(function (item) { return item._editorId === event.objectId; });
        if (object) syncObject(object);
        const positionOnly = event.updatedFields && event.updatedFields.every(function (field) {
          return field === 'left' || field === 'top';
        });
        if (positionOnly) {
          if (object && object._editorId === workspace.selectedObjectId) updateSelectionOverlay(object);
        } else {
          renderObjectList(workspace);
          renderSelection(workspace);
        }
      } else if (event.type === 'object:delete') {
        const element = objectElements.get(event.objectId);
        if (element) element.remove();
        objectElements.delete(event.objectId);
        renderObjectList();
        renderSelection();
      } else if (event.type === 'workspace:clear' || event.type === 'scene:load') {
        hideContextMenu();
        renderWorkspace();
        renderSceneList(project);
      } else if (event.type.indexOf('selection:') === 0) {
        renderSelection();
        renderObjectList();
      } else if (event.type.indexOf('scene:') === 0) {
        renderSceneList(project);
        populateDropdowns(project);
      } else if (event.type.indexOf('keybinding:') === 0) {
        renderKeybindings(project);
      } else if (event.type === 'persistent:update') {
        renderCurrencies(project);
        renderObjectLibrary(project);
        populateDropdowns(project);
        renderPersistentControls(project);
      }
    }

    const unsubscribe = state.subscribe(onStateChange);
    renderAll();

    return {
      renderAll: renderAll,
      renderWorkspace: renderWorkspace,
      renderSelection: renderSelection,
      renderSceneList: renderSceneList,
      renderKeybindings: renderKeybindings,
      renderCurrencies: renderCurrencies,
      renderObjectLibrary: renderObjectLibrary,
      populateDropdowns: populateDropdowns,
      showContextMenu: showContextMenu,
      hideContextMenu: hideContextMenu,
      updateSelectionOverlay: updateSelectionOverlay,
      getObjectElement: function (id) { return objectElements.get(id) || null; },
      destroy: function () {
        unsubscribe();
        objectElements.clear();
      }
    };
  }

  namespace.createEditorRenderer = createEditorRenderer;
})(window);
