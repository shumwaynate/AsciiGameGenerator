(function () {
  'use strict';
  window.AsciiGameGenerator = window.AsciiGameGenerator || {};
  window.AsciiGameGenerator.createAsciiGameRuntime = function createAsciiGameRuntime(options) {
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

    root.style.width = width + 'px';
    root.style.height = height + 'px';

    let gameArea = root.querySelector('[data-ascii-game-area]');
    if (!gameArea) {
      gameArea = documentRef.createElement('div');
      gameArea.dataset.asciiGameArea = '';
      gameArea.className = 'ascii-game-area';
      root.appendChild(gameArea);
    }

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
        root.appendChild(inventoryOverlay);
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
      const overlay = ensureInventoryOverlay();
      if (!overlay) return;
      const isShowing = overlay.style.display === 'block';
      overlay.style.display = isShowing ? 'none' : 'block';
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
            element.style.color = objData.colors.hover.color;
          });
          element.addEventListener('mouseleave', function () {
            element.style.color = (objData.colors && objData.colors.default) || '#000';
          });
        }

        if (objData.clickable) {
          element.addEventListener('click', function () {
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
      if (!mainPlayerObj || destroyed) return false;

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
      if (destroyed) return;
      const key = String(event.key || '').toLowerCase();
      keysPressed.add(key);
      const action = (gameState.saveCustomKeyBindings || {})[key];
      if (action === 'toggleInventory' && getPersistentSettings().inventoryEnabled) {
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
      if (keysPressed.has('w')) dy -= MOVEMENT_SPEED;
      if (keysPressed.has('s')) dy += MOVEMENT_SPEED;
      if (keysPressed.has('a')) dx -= MOVEMENT_SPEED;
      if (keysPressed.has('d')) dx += MOVEMENT_SPEED;
      if (dx || dy) moveMainPlayer(dx, dy);
      scheduleFrame();
    }

    function play() {
      if (destroyed || playing) return;
      playing = true;
      scheduleFrame();
    }

    function pause() {
      playing = false;
      keysPressed.clear();
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
      renderScene(gameState.saveCurrentScene);
    }

    function destroy() {
      if (destroyed) return;
      pause();
      destroyed = true;
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
        touchContactCount: touchMemory.size
      };
    }

    restoreInitialState();
    documentRef.addEventListener('keydown', onKeyDown);
    documentRef.addEventListener('keyup', onKeyUp);
    renderScene(gameState.saveCurrentScene);
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
  };

  function bootstrapAsciiGame() {
    var root = document.getElementById("asciiGameWrapper");
    if (!root) {
      root = document.createElement('div');
      root.id = "asciiGameWrapper";
      document.body.appendChild(root);
    }

    if (window["asciiGameRuntime"] && typeof window["asciiGameRuntime"].destroy === 'function') {
      window["asciiGameRuntime"].destroy();
    }

    var runtime = window.AsciiGameGenerator.createAsciiGameRuntime({
      root: root,
      initialGameState: {"sceneList":{"1":[{"ascii":"o\n/\\\n/\\","left":216,"top":53,"colors":{"default":"#000000","hover":{"enabled":false,"color":"#000000"},"click":{"enabled":false,"color":"#000000"}},"clickable":false,"visible":true,"mainCharacter":true,"collision":true,"giveCurrency":{"enabled":false,"trigger":"click","currency":null,"amount":0,"deleteAfter":true},"switchScene":{"enabled":false,"trigger":"click","target":null},"giveObject":{"enabled":false,"trigger":"click","object":null,"deleteAfter":true},"targetScene":null,"targetObjectName":null,"itemName":"Object 1"},{"ascii":"o\n/\\\n/\\","left":342,"top":72,"colors":{"default":"#000000","hover":{"enabled":false,"color":"#000000"},"click":{"enabled":false,"color":"#000000"}},"clickable":false,"visible":true,"mainCharacter":false,"collision":true,"giveCurrency":{"enabled":false,"trigger":"click","currency":null,"amount":0,"deleteAfter":true},"switchScene":{"enabled":false,"trigger":"click","target":null},"giveObject":{"enabled":false,"trigger":"click","object":null,"deleteAfter":true},"targetScene":null,"targetObjectName":null,"itemName":"Object 2"},{"ascii":"swap","left":420,"top":245,"colors":{"default":"#000000","hover":{"enabled":false,"color":"#000000"},"click":{"enabled":false,"color":"#000000"}},"clickable":true,"visible":true,"mainCharacter":false,"collision":true,"giveCurrency":{"enabled":false,"trigger":"click","currency":null,"amount":0,"deleteAfter":true},"switchScene":{"enabled":true,"trigger":"click","target":"2"},"giveObject":{"enabled":false,"trigger":"click","object":null,"deleteAfter":true},"targetScene":null,"targetObjectName":null,"itemName":"Object 3"}],"2":[{"ascii":"o\n/\\\n/\\","left":502,"top":223,"colors":{"default":"#000000","hover":{"enabled":false,"color":"#000000"},"click":{"enabled":false,"color":"#000000"}},"clickable":false,"visible":true,"mainCharacter":true,"collision":true,"giveCurrency":{"enabled":false,"trigger":"click","currency":null,"amount":0,"deleteAfter":true},"switchScene":{"enabled":false,"trigger":"click","target":null},"giveObject":{"enabled":false,"trigger":"click","object":null,"deleteAfter":true},"targetScene":null,"targetObjectName":null,"itemName":"Object 1"},{"ascii":"swap","left":113,"top":104,"colors":{"default":"#000000","hover":{"enabled":false,"color":"#000000"},"click":{"enabled":false,"color":"#000000"}},"clickable":true,"visible":true,"mainCharacter":false,"collision":true,"giveCurrency":{"enabled":false,"trigger":"click","currency":null,"amount":0,"deleteAfter":true},"switchScene":{"enabled":true,"trigger":"click","target":"1"},"giveObject":{"enabled":false,"trigger":"click","object":null,"deleteAfter":true},"targetScene":null,"targetObjectName":null,"itemName":"Object 2"}],"3":[{"ascii":"o\n/\\\n/\\","left":351,"top":46,"colors":{"default":"#000000","hover":{"enabled":false,"color":"#000000"},"click":{"enabled":false,"color":"#000000"}},"clickable":false,"visible":true,"mainCharacter":false,"collision":true,"giveCurrency":{"enabled":false,"trigger":"click","currency":null,"amount":0,"deleteAfter":true},"switchScene":{"enabled":false,"trigger":"click","target":null},"giveObject":{"enabled":false,"trigger":"click","object":null,"deleteAfter":true},"targetScene":null,"targetObjectName":null,"itemName":"Object 1"}]},"saveCurrentScene":"1","saveCustomKeyBindings":{},"persistentSettings":{"rpgEnabled":true,"inventory":[],"currencies":{},"objects":[],"objectEffects":{},"toolbar":{"enabled":false,"statsToDisplay":[]},"playerStats":{"health":100,"mana":50,"strength":10,"agility":8},"inventoryEnabled":false}},
      width: 650,
      height: 400,
      autoPlay: true
    });
    window["asciiGameRuntime"] = runtime;
    
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapAsciiGame, { once: true });
  } else {
    bootstrapAsciiGame();
  }
})();