(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};
  function createAsciiGameRuntime(options) {
    const BASE_WIDTH = 650;
    const BASE_HEIGHT = 400;
    const MOVEMENT_SPEED = 3;
    const TOUCH_COOLDOWN_MS = 1000;

    function deepClone(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function asFiniteNumber(value, fallback) {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }

    options = options || {};

    const root = options.root;
    if (!root || !root.ownerDocument) {
      throw new Error('createAsciiGameRuntime requires a root DOM element.');
    }

    const documentRef = root.ownerDocument;
    const windowRef = documentRef.defaultView || window;
    const requestFrame = options.requestAnimationFrame || windowRef.requestAnimationFrame.bind(windowRef);
    const cancelFrame = options.cancelAnimationFrame || windowRef.cancelAnimationFrame.bind(windowRef);
    const now = options.now || function () { return windowRef.performance.now(); };
    const width = Math.max(1, asFiniteNumber(options.width, BASE_WIDTH));
    const height = Math.max(1, asFiniteNumber(options.height, BASE_HEIGHT));
    const scaleX = width / BASE_WIDTH;
    const scaleY = height / BASE_HEIGHT;
    const scaleFont = (scaleX + scaleY) / 2;
    const originalGameState = deepClone(options.initialGameState || {});
    const originalScene = originalGameState.saveCurrentScene;

    let gameState;
    let inventory;
    let currencies;
    let playing = false;
    let destroyed = false;
    let animationFrameId = null;
    let mainPlayerObj = null;
    let sceneObjects = [];
    let touchMemory = new Map();
    const keysPressed = new Set();
    const touchPointers = new Map();
    const removers = [];
    let widgetDrag = null;
    let draggedPosition = null;

    function listen(target, type, callback) {
      target.addEventListener(type, callback);
      removers.push(function () { target.removeEventListener(type, callback); });
    }

    root.style.width = width + 'px';
    root.style.height = height + 'px';
    root.classList.add('ascii-runtime');

    // Presentation and touch controls travel with the factory into both adapters.
    const runtimeStyle = documentRef.createElement('style');
    runtimeStyle.textContent = `
      .ascii-runtime { box-sizing: content-box; max-width: calc(100vw - 24px); font-family: monospace;
        --safe-left: env(safe-area-inset-left, 0px); --safe-right: env(safe-area-inset-right, 0px);
        --safe-top: env(safe-area-inset-top, 0px); --safe-bottom: env(safe-area-inset-bottom, 0px); }
      .ascii-runtime .ascii-game-viewport { position: relative; overflow: hidden; margin-inline: auto; }
      .ascii-runtime .ascii-game-area { position: absolute; top: 0; left: 0; transform-origin: top left; overflow: hidden; }
      .ascii-runtime .asciiObject { position: absolute; white-space: pre; user-select: none; -webkit-user-select: none; }
      .ascii-runtime .ascii-touch-controls { display: none; align-items: center; justify-content: space-around; gap: 8px; padding: 8px; box-sizing: border-box; background: #eee; color: #111; }
      .ascii-runtime .ascii-direction-pad { display: grid; grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(2, 44px); gap: 4px; }
      .ascii-runtime button { font: 16px system-ui, sans-serif; min-width: 44px; min-height: 44px; margin: 0; padding: 8px; color: #111; background: #fff; border: 1px solid #999; border-radius: 6px; cursor: pointer; }
      .ascii-runtime [data-direction] { touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
      .ascii-runtime [data-direction="w"] { grid-column: 2; }
      .ascii-runtime [data-direction="a"] { grid-column: 1; grid-row: 2; }
      .ascii-runtime [data-direction="s"] { grid-column: 2; grid-row: 2; }
      .ascii-runtime [data-direction="d"] { grid-column: 3; grid-row: 2; }
      .ascii-runtime [data-direction][aria-pressed="true"] { background: #cce1ff; }
      .ascii-runtime button:disabled { opacity: .5; cursor: default; }
      .ascii-runtime .ascii-widget-handle { display: block; width: 100%; touch-action: none; user-select: none; -webkit-user-select: none; }
      .ascii-runtime [data-ascii-inventory-overlay] { position: absolute; inset: 0; box-sizing: border-box; padding: 12px; font: 16px system-ui, sans-serif; background: rgba(255,255,255,.95); color: #111; overflow: auto; z-index: 100; }
      @media (any-pointer: coarse) { .ascii-runtime .ascii-touch-controls { display: flex; } }
    `;
    root.appendChild(runtimeStyle);
    const gameViewport = documentRef.createElement('div');
    gameViewport.className = 'ascii-game-viewport';
    root.appendChild(gameViewport);

    let gameArea = root.querySelector('[data-ascii-game-area]');
    if (!gameArea) {
      gameArea = documentRef.createElement('div');
      gameArea.dataset.asciiGameArea = '';
      gameArea.className = 'ascii-game-area';
      gameViewport.appendChild(gameArea);
    }
    gameViewport.appendChild(gameArea);
    gameArea.style.width = width + 'px';
    gameArea.style.height = height + 'px';
    gameArea.style.fontSize = 15 * scaleFont + 'px';

    const touchControls = documentRef.createElement('div');
    touchControls.className = 'ascii-touch-controls';
    touchControls.setAttribute('aria-label', 'Touch game controls');
    const directionPad = documentRef.createElement('div');
    directionPad.className = 'ascii-direction-pad';
    [['w', '▲', 'Move up'], ['a', '◀', 'Move left'], ['s', '▼', 'Move down'], ['d', '▶', 'Move right']].forEach(function (direction) {
      const button = documentRef.createElement('button');
      button.type = 'button';
      button.dataset.direction = direction[0];
      button.textContent = direction[1];
      button.setAttribute('aria-label', direction[2]);
      button.setAttribute('aria-pressed', 'false');
      directionPad.appendChild(button);
    });
    touchControls.appendChild(directionPad);
    const inventoryButton = documentRef.createElement('button');
    inventoryButton.type = 'button';
    inventoryButton.textContent = 'Inventory';
    inventoryButton.dataset.action = 'inventory';
    inventoryButton.setAttribute('aria-expanded', 'false');
    touchControls.appendChild(inventoryButton);
    root.appendChild(touchControls);

    function syncTouchControls() {
      directionPad.querySelectorAll('button').forEach(function (button) {
        button.disabled = !playing || destroyed;
        button.setAttribute('aria-pressed', String(Array.from(touchPointers.values()).some(function (pointer) {
          return pointer.key === button.dataset.direction;
        })));
      });
      inventoryButton.hidden = !getPersistentSettings().inventoryEnabled;
      inventoryButton.disabled = !playing || destroyed;
    }

    function releaseTouch(event) {
      const pointer = touchPointers.get(event.pointerId);
      if (!pointer) return;
      touchPointers.delete(event.pointerId);
      try { pointer.button.releasePointerCapture(event.pointerId); } catch (error) { /* Already released or synthetic. */ }
      syncTouchControls();
    }

    function clearInputs() {
      keysPressed.clear();
      Array.from(touchPointers.keys()).forEach(function (id) { releaseTouch({ pointerId: id }); });
      if (widgetDrag && dragHandle) {
        const id = widgetDrag.id;
        widgetDrag = null;
        try { dragHandle.releasePointerCapture(id); } catch (error) { /* Already released. */ }
      }
    }

    listen(directionPad, 'pointerdown', function (event) {
      const button = event.target.closest('[data-direction]');
      if (!button || !playing || destroyed || event.button !== 0) return;
      event.preventDefault();
      touchPointers.set(event.pointerId, { key: button.dataset.direction, button: button });
      try { button.setPointerCapture(event.pointerId); } catch (error) { /* Synthetic events may not be capturable. */ }
      syncTouchControls();
    });
    listen(documentRef, 'pointerup', releaseTouch);
    listen(documentRef, 'pointercancel', releaseTouch);
    listen(directionPad, 'lostpointercapture', releaseTouch);
    listen(directionPad, 'contextmenu', function (event) { event.preventDefault(); });
    listen(inventoryButton, 'click', toggleInventory);
    listen(windowRef, 'blur', clearInputs);
    listen(documentRef, 'visibilitychange', function () { if (documentRef.hidden) clearInputs(); });

    // Widget placement is a presentation option, never part of saved gameplay state.
    const placement = options.position == null ? null : Math.max(1, Math.min(9, Number(options.position) || 9));
    let dragHandle = null;
    if (placement !== null) {
      root.style.position = 'fixed';
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      if (options.allowDrag) {
        dragHandle = documentRef.createElement('button');
        dragHandle.type = 'button';
        dragHandle.className = 'ascii-widget-handle';
        dragHandle.textContent = 'Move game';
        dragHandle.setAttribute('aria-label', 'Move game: drag or use arrow keys');
        root.insertBefore(dragHandle, gameViewport);
        listen(dragHandle, 'pointerdown', function (event) {
          if (widgetDrag || event.button !== 0) return;
          event.preventDefault();
          const rect = root.getBoundingClientRect();
          widgetDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
          try { dragHandle.setPointerCapture(event.pointerId); } catch (error) { /* Synthetic event. */ }
        });
        listen(dragHandle, 'pointermove', function (event) {
          if (!widgetDrag || widgetDrag.id !== event.pointerId) return;
          event.preventDefault();
          draggedPosition = { left: widgetDrag.left + event.clientX - widgetDrag.x, top: widgetDrag.top + event.clientY - widgetDrag.y };
          fitGame();
        });
        function endWidgetDrag(event) {
          if (!widgetDrag || widgetDrag.id !== event.pointerId) return;
          widgetDrag = null;
          try { dragHandle.releasePointerCapture(event.pointerId); } catch (error) { /* Already released. */ }
        }
        listen(dragHandle, 'pointerup', endWidgetDrag);
        listen(dragHandle, 'pointercancel', endWidgetDrag);
        listen(dragHandle, 'lostpointercapture', endWidgetDrag);
        listen(dragHandle, 'keydown', function (event) {
          const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
          if (!delta) return;
          event.preventDefault();
          const rect = root.getBoundingClientRect();
          draggedPosition = { left: rect.left + delta[0], top: rect.top + delta[1] };
          fitGame();
        });
      }
    }

    function fitGame() {
      if (destroyed) return;
      const view = windowRef.visualViewport;
      const viewWidth = view ? view.width : windowRef.innerWidth;
      const viewHeight = view ? view.height : windowRef.innerHeight;
      const style = windowRef.getComputedStyle(root);
      const safeLeft = parseFloat(style.getPropertyValue('--safe-left')) || 0;
      const safeRight = parseFloat(style.getPropertyValue('--safe-right')) || 0;
      const safeTop = parseFloat(style.getPropertyValue('--safe-top')) || 0;
      const safeBottom = parseFloat(style.getPropertyValue('--safe-bottom')) || 0;
      const parentWidth = root.parentElement ? root.parentElement.clientWidth : viewWidth;
      const controlsHeight = touchControls.offsetHeight + (dragHandle ? dragHandle.offsetHeight : 0);
      const availableHeight = Math.max(40, viewHeight - safeTop - safeBottom - controlsHeight - (placement === null ? 100 : 32));
      const scale = Math.min(1, Math.max(1, Math.min(parentWidth || viewWidth, viewWidth - safeLeft - safeRight - 32)) / width, availableHeight / height);
      const controlWidth = touchControls.offsetHeight ? Math.min(280, viewWidth - safeLeft - safeRight - 32, parentWidth || viewWidth) : 0;
      root.style.width = Math.max(width * scale, controlWidth) + 'px';
      root.style.height = 'auto';
      gameViewport.style.width = width * scale + 'px';
      gameViewport.style.height = height * scale + 'px';
      gameArea.style.transform = 'scale(' + scale + ')';
      if (placement !== null) {
        const originX = (view ? view.offsetLeft : 0) + safeLeft + 16;
        const originY = (view ? view.offsetTop : 0) + safeTop + 16;
        const maxX = Math.max(originX, (view ? view.offsetLeft : 0) + viewWidth - safeRight - 16 - root.offsetWidth);
        const maxY = Math.max(originY, (view ? view.offsetTop : 0) + viewHeight - safeBottom - 16 - root.offsetHeight);
        root.style.left = Math.max(originX, Math.min(maxX, draggedPosition ? draggedPosition.left : originX + (maxX - originX) * ((placement - 1) % 3) / 2)) + 'px';
        root.style.top = Math.max(originY, Math.min(maxY, draggedPosition ? draggedPosition.top : originY + (maxY - originY) * Math.floor((placement - 1) / 3) / 2)) + 'px';
      }
    }
    listen(windowRef, 'resize', fitGame);
    if (windowRef.visualViewport) listen(windowRef.visualViewport, 'resize', fitGame);

    let inventoryOverlay = root.querySelector('[data-ascii-inventory-overlay]');

    function getPersistentSettings() {
      return gameState.persistentSettings || {};
    }

    function ensureInventoryOverlay() {
      if (!getPersistentSettings().inventoryEnabled) {
        if (inventoryOverlay) inventoryOverlay.style.display = 'none';
        return null;
      }

      if (!inventoryOverlay) {
        inventoryOverlay = documentRef.createElement('div');
        inventoryOverlay.dataset.asciiInventoryOverlay = '';
        inventoryOverlay.id = 'inventoryOverlay';
        inventoryOverlay.style.display = 'none';
        gameViewport.appendChild(inventoryOverlay);
      }
      return inventoryOverlay;
    }

    function appendList(container, heading, entries) {
      const title = documentRef.createElement('strong');
      title.textContent = heading;
      container.appendChild(title);
      const list = documentRef.createElement('ul');
      entries.forEach(function (entry) {
        const item = documentRef.createElement('li');
        item.textContent = entry;
        list.appendChild(item);
      });
      container.appendChild(list);
    }

    function renderInventoryOverlay() {
      const overlay = ensureInventoryOverlay();
      if (!overlay) return;

      overlay.replaceChildren();
      const currencyEntries = Object.entries(currencies).map(function (entry) {
        return entry[0] + ': ' + entry[1];
      });

      if (!currencyEntries.length && !inventory.length) {
        const emptyMessage = documentRef.createElement('p');
        emptyMessage.textContent = 'No inventory yet.';
        overlay.appendChild(emptyMessage);
        return;
      }

      const heading = documentRef.createElement('h2');
      heading.textContent = 'Inventory';
      overlay.appendChild(heading);
      if (currencyEntries.length) appendList(overlay, 'Currencies:', currencyEntries);
      if (inventory.length) appendList(overlay, 'Items:', inventory);
    }

    function toggleInventory() {
      if (!playing || destroyed) return;
      const overlay = ensureInventoryOverlay();
      if (!overlay) return;
      const isShowing = overlay.style.display === 'block';
      overlay.style.display = isShowing ? 'none' : 'block';
      inventoryButton.setAttribute('aria-expanded', String(!isShowing));
      if (!isShowing) renderInventoryOverlay();
    }

    function getCurrentSceneObjects() {
      const sceneList = gameState.sceneList || {};
      return sceneList[gameState.saveCurrentScene] || [];
    }

    function measureObject(element, ascii) {
      const rect = element.getBoundingClientRect();
      const lines = String(ascii || '').split('\n');
      const longestLine = lines.reduce(function (longest, line) {
        return Math.max(longest, line.length);
      }, 1);
      return {
        width: element.offsetWidth || rect.width || longestLine * 9 * scaleFont,
        height: element.offsetHeight || rect.height || Math.max(1, lines.length) * 18 * scaleFont
      };
    }

    function updateMainPlayerPosition() {
      if (!mainPlayerObj) return;
      mainPlayerObj.objData.left = Math.round(mainPlayerObj.x / scaleX);
      mainPlayerObj.objData.top = Math.round(mainPlayerObj.y / scaleY);
    }

    function removeSceneObject(objData) {
      const objects = getCurrentSceneObjects();
      const index = objects.indexOf(objData);
      if (index === -1) return false;
      objects.splice(index, 1);
      renderScene(gameState.saveCurrentScene);
      return true;
    }

    function switchScene(sceneId) {
      updateMainPlayerPosition();
      gameState.saveCurrentScene = sceneId;
      renderScene(sceneId);
    }

    function applyActions(objData, trigger) {
      if (!playing || destroyed) return false;
      if (objData.giveCurrency && objData.giveCurrency.enabled &&
          objData.giveCurrency.trigger === trigger && objData.giveCurrency.currency) {
        const currency = objData.giveCurrency.currency;
        currencies[currency] = (currencies[currency] || 0) + asFiniteNumber(objData.giveCurrency.amount, 0);
        if (objData.giveCurrency.deleteAfter && removeSceneObject(objData)) return true;
      }

      if (objData.giveObject && objData.giveObject.enabled &&
          objData.giveObject.trigger === trigger && objData.giveObject.object) {
        inventory.push(objData.giveObject.object);
        if (objData.giveObject.deleteAfter && removeSceneObject(objData)) return true;
      }

      if (objData.switchScene && objData.switchScene.enabled &&
          objData.switchScene.trigger === trigger && objData.switchScene.target) {
        switchScene(objData.switchScene.target);
        return true;
      }

      return false;
    }

    function renderScene(sceneId) {
      gameState.saveCurrentScene = sceneId;
      gameArea.replaceChildren();
      sceneObjects = [];
      mainPlayerObj = null;
      touchMemory.clear();

      const objects = (gameState.sceneList || {})[sceneId] || [];
      objects.forEach(function (objData) {
        const element = documentRef.createElement('div');
        element.className = 'asciiObject';
        element.textContent = objData.ascii || '';
        element.style.left = asFiniteNumber(objData.left, 0) * scaleX + 'px';
        element.style.top = asFiniteNumber(objData.top, 0) * scaleY + 'px';
        element.style.color = (objData.colors && objData.colors.default) || '#000';
        element.style.opacity = objData.visible === false ? '0' : '1';

        if (objData.colors && objData.colors.hover && objData.colors.hover.enabled) {
          element.addEventListener('mouseenter', function () {
            if (!playing || destroyed) return;
            element.style.color = objData.colors.hover.color;
          });
          element.addEventListener('mouseleave', function () {
            if (!playing || destroyed) return;
            element.style.color = (objData.colors && objData.colors.default) || '#000';
          });
        }

        if (objData.clickable) {
          element.addEventListener('click', function () {
            if (!playing || destroyed) return;
            if (objData.colors && objData.colors.click && objData.colors.click.enabled) {
              element.style.color = objData.colors.click.color;
            }
            applyActions(objData, 'click');
          });
        }

        gameArea.appendChild(element);
        const size = measureObject(element, objData.ascii);
        const renderedObject = {
          objData: objData,
          element: element,
          left: asFiniteNumber(objData.left, 0) * scaleX,
          top: asFiniteNumber(objData.top, 0) * scaleY,
          width: size.width,
          height: size.height
        };
        sceneObjects.push(renderedObject);

        if (objData.mainCharacter && !mainPlayerObj) {
          mainPlayerObj = {
            objData: objData,
            element: element,
            x: renderedObject.left,
            y: renderedObject.top,
            width: renderedObject.width,
            height: renderedObject.height
          };
        }
      });

      ensureInventoryOverlay();
    }

    function isColliding(player, object) {
      return !(
        player.x + player.width < object.left ||
        player.x > object.left + object.width ||
        player.y + player.height < object.top ||
        player.y > object.top + object.height
      );
    }

    function canTriggerTouch(renderedObject) {
      const objData = renderedObject.objData;
      const state = touchMemory.get(objData) || { inContact: false, lastTriggered: -Infinity };
      const allowed = !state.inContact && now() - state.lastTriggered >= TOUCH_COOLDOWN_MS;
      state.inContact = true;
      if (allowed) state.lastTriggered = now();
      touchMemory.set(objData, state);
      return allowed;
    }

    function endContact(renderedObject) {
      const state = touchMemory.get(renderedObject.objData);
      if (state) state.inContact = false;
    }

    function moveMainPlayer(dx, dy) {
      if (!mainPlayerObj || !playing || destroyed) return false;

      const proposedX = mainPlayerObj.x + dx;
      const proposedY = mainPlayerObj.y + dy;
      const virtualPlayer = {
        x: proposedX,
        y: proposedY,
        width: mainPlayerObj.width,
        height: mainPlayerObj.height
      };
      let blocked = false;

      for (let index = 0; index < sceneObjects.length; index += 1) {
        const renderedObject = sceneObjects[index];
        if (renderedObject.element === mainPlayerObj.element) continue;

        if (isColliding(virtualPlayer, renderedObject)) {
          if (canTriggerTouch(renderedObject) && applyActions(renderedObject.objData, 'touch')) {
            return false;
          }
          if (renderedObject.objData.collision !== false) blocked = true;
        } else {
          endContact(renderedObject);
        }
      }

      if (blocked) return false;

      mainPlayerObj.x = Math.max(0, Math.min(proposedX, width - mainPlayerObj.width));
      mainPlayerObj.y = Math.max(0, Math.min(proposedY, height - mainPlayerObj.height));
      mainPlayerObj.element.style.left = mainPlayerObj.x + 'px';
      mainPlayerObj.element.style.top = mainPlayerObj.y + 'px';
      updateMainPlayerPosition();
      return true;
    }

    function onKeyDown(event) {
      if (!playing || destroyed) return;
      const key = String(event.key || '').toLowerCase();
      keysPressed.add(key);
      const action = (gameState.saveCustomKeyBindings || {})[key];
      if (action === 'toggleInventory' && !event.repeat && getPersistentSettings().inventoryEnabled) {
        toggleInventory();
      }
    }

    function onKeyUp(event) {
      keysPressed.delete(String(event.key || '').toLowerCase());
    }

    function scheduleFrame() {
      if (playing && !destroyed && animationFrameId === null) {
        animationFrameId = requestFrame(gameLoop);
      }
    }

    function gameLoop() {
      animationFrameId = null;
      if (!playing || destroyed) return;

      let dx = 0;
      let dy = 0;
      const activeKeys = new Set(keysPressed);
      touchPointers.forEach(function (pointer) { activeKeys.add(pointer.key); });
      if (activeKeys.has('w')) dy -= MOVEMENT_SPEED;
      if (activeKeys.has('s')) dy += MOVEMENT_SPEED;
      if (activeKeys.has('a')) dx -= MOVEMENT_SPEED;
      if (activeKeys.has('d')) dx += MOVEMENT_SPEED;
      if (dx || dy) moveMainPlayer(dx, dy);
      scheduleFrame();
    }

    function play() {
      if (destroyed || playing) return;
      playing = true;
      syncTouchControls();
      scheduleFrame();
    }

    function pause() {
      playing = false;
      clearInputs();
      syncTouchControls();
      if (animationFrameId !== null) {
        cancelFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    function restoreInitialState() {
      gameState = deepClone(originalGameState);
      gameState.saveCurrentScene = originalScene;
      const persistentSettings = gameState.persistentSettings || {};
      inventory = Array.isArray(persistentSettings.inventory) ? persistentSettings.inventory.slice() : [];
      currencies = persistentSettings.currencies && typeof persistentSettings.currencies === 'object'
        ? Object.assign({}, persistentSettings.currencies)
        : {};
    }

    function reset() {
      if (destroyed) return;
      pause();
      touchMemory = new Map();
      mainPlayerObj = null;
      sceneObjects = [];
      restoreInitialState();
      if (inventoryOverlay) inventoryOverlay.style.display = 'none';
      inventoryButton.setAttribute('aria-expanded', 'false');
      renderScene(gameState.saveCurrentScene);
    }

    function destroy() {
      if (destroyed) return;
      pause();
      destroyed = true;
      widgetDrag = null;
      removers.splice(0).forEach(function (remove) { remove(); });
      touchControls.remove();
      if (dragHandle) dragHandle.remove();
      gameViewport.remove();
      runtimeStyle.remove();
      documentRef.removeEventListener('keydown', onKeyDown);
      documentRef.removeEventListener('keyup', onKeyUp);
      keysPressed.clear();
      touchMemory.clear();
      mainPlayerObj = null;
      sceneObjects = [];
    }

    function getSnapshot() {
      return {
        playing: playing,
        destroyed: destroyed,
        currentScene: gameState.saveCurrentScene,
        activePlayer: mainPlayerObj ? {
          itemName: mainPlayerObj.objData.itemName,
          ascii: mainPlayerObj.objData.ascii,
          x: mainPlayerObj.x,
          y: mainPlayerObj.y
        } : null,
        inventory: inventory.slice(),
        currencies: Object.assign({}, currencies),
        gameState: deepClone(gameState),
        pressedKeys: Array.from(keysPressed),
        touchPointerCount: touchPointers.size,
        touchContactCount: touchMemory.size
      };
    }

    restoreInitialState();
    documentRef.addEventListener('keydown', onKeyDown);
    documentRef.addEventListener('keyup', onKeyUp);
    renderScene(gameState.saveCurrentScene);
    syncTouchControls();
    fitGame();
    if (options.autoPlay) play();

    return {
      play: play,
      pause: pause,
      reset: reset,
      destroy: destroy,
      renderScene: renderScene,
      switchScene: switchScene,
      move: moveMainPlayer,
      getSnapshot: getSnapshot
    };
  }

  namespace.createAsciiGameRuntime = createAsciiGameRuntime;
})(window);
