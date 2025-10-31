// This file generates the exportable game files as a zip using JSZip
// file: generate_export_files.js

document.getElementById('saveGameExport')?.addEventListener('click', exportGameAsZip);

async function exportGameAsZip() {
  const gameState = JSON.parse(localStorage.getItem('gameState'));
  if (!gameState) {
    alert("No game state found in localStorage.");
    return;
  }

  const screenWidth = parseInt(localStorage.getItem('userWidth') || '650');
  const screenHeight = parseInt(localStorage.getItem('userHeight') || '400');
  const scaleX = screenWidth / 650;
  const scaleY = screenHeight / 400;
  const scaleFont = (scaleX + scaleY) / 2;
  const fontSize = 15 * scaleFont;

  const zip = new JSZip();
  const folder = zip.folder("gameInsert");

  // === CSS ===
  const css = `
#asciiGameWrapper {
  position: fixed;
  bottom: 0;
  right: 0;
  width: ${screenWidth}px;
  height: ${screenHeight}px;
  background: #f5f5f5;
  border: 2px solid #ccc;
  overflow: hidden;
  z-index: 9999;
  font-family: monospace;
}
#asciiGameWrapper .asciiObject {
  position: absolute;
  white-space: pre;
  font-size: ${fontSize}px;
  color: black;
  cursor: pointer;
}
#asciiGameWrapper #inventoryOverlay {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.95);
  font-size: ${fontSize}px;
  padding: 20px;
  overflow-y: auto;
  z-index: 10000;
}`;
  folder.file("game_style.css", css);

  // === Script ===
  const js = `
const initialGameState = ${JSON.stringify(gameState)};
let gameState = JSON.parse(JSON.stringify(initialGameState));
const scaleX = ${scaleX};
const scaleY = ${scaleY};
let playing = true;
let mainPlayerObj = null;
let sceneObjects = [];
const keysPressed = new Set();
const inventory = [];
const currencies = {};

// --- touch throttling: once-per-touch + 1s cooldown ---
const TOUCH_COOLDOWN_MS = 1000;
const touchMemory = new Map(); // key -> { inContact: bool, last: number }

function touchKeyFor(obj) {
  // Prefer stable key by itemName; fall back to element/object identity
  return obj.itemName || obj.element || obj;
}
function canTriggerTouch(obj) {
  const key = touchKeyFor(obj);
  const state = touchMemory.get(key) || { inContact: false, last: 0 };
  const now = performance.now();
  const allowed = !state.inContact && (now - state.last >= TOUCH_COOLDOWN_MS);
  if (allowed) {
    state.inContact = true;
    state.last = now;
    touchMemory.set(key, state);
  }
  return allowed;
}
function endContact(obj) {
  const key = touchKeyFor(obj);
  const state = touchMemory.get(key) || { inContact: false, last: 0 };
  if (state.inContact) {
    state.inContact = false;
    touchMemory.set(key, state);
  }
}

function renderInventoryOverlay() {
  const overlay = document.getElementById('inventoryOverlay');
  if (!overlay) return;
  const hasCurrencies = Object.keys(currencies).length > 0;
  const hasItems = inventory.length > 0;
  if (!hasCurrencies && !hasItems) {
    overlay.innerHTML = '<p>No inventory yet.</p>';
    return;
  }
  let html = "<h2>Inventory</h2>";
  if (hasCurrencies) {
    html += "<strong>Currencies:</strong><ul>";
    html += Object.entries(currencies).map(([name, amount]) => \`<li>\${name}: \${amount}</li>\`).join("");
    html += "</ul>";
  }
  if (hasItems) {
    html += "<strong>Items:</strong><ul>";
    html += inventory.map(item => \`<li>\${item}</li>\`).join("");
    html += "</ul>";
  }
  overlay.innerHTML = html;
}

function renderScene(sceneId) {
  gameState.saveCurrentScene = sceneId;
  const container = document.getElementById('gameArea');
  container.innerHTML = "";
  sceneObjects = [];
  const objects = gameState.sceneList[sceneId] || [];

  objects.forEach(obj => {
    const div = document.createElement('div');
    div.className = 'asciiObject';
    div.innerText = obj.ascii;
    div.style.left = (obj.left * scaleX) + 'px';
    div.style.top = (obj.top * scaleY) + 'px';
    div.style.color = obj.colors?.default || '#000';

    if (obj.colors?.hover?.enabled) {
      div.addEventListener('mouseenter', () => div.style.color = obj.colors.hover.color);
      div.addEventListener('mouseleave', () => div.style.color = obj.colors.default);
    }

    const handleClick = () => {
      if (obj.clickable && obj.colors?.click?.enabled) div.style.color = obj.colors.click.color;

      if (obj.giveCurrency?.enabled && obj.giveCurrency.trigger === 'click' && obj.giveCurrency.currency) {
        currencies[obj.giveCurrency.currency] = (currencies[obj.giveCurrency.currency] || 0) + obj.giveCurrency.amount;
        if (obj.giveCurrency.deleteAfter) {
          div.remove();
          sceneObjects = sceneObjects.filter(o => o.element !== div);
          gameState.sceneList[sceneId] = gameState.sceneList[sceneId].filter(o => o.itemName !== obj.itemName);
        }
      }

      if (obj.giveObject?.enabled && obj.giveObject.trigger === 'click' && obj.giveObject.object) {
        inventory.push(obj.giveObject.object);
        if (obj.giveObject.deleteAfter) {
          div.remove();
          sceneObjects = sceneObjects.filter(o => o.element !== div);
          gameState.sceneList[sceneId] = gameState.sceneList[sceneId].filter(o => o.itemName !== obj.itemName);
        }
      }

      if (obj.switchScene?.enabled && obj.switchScene.trigger === 'click' && obj.switchScene.target) {
        renderScene(obj.switchScene.target);
      }
    };

    if (obj.clickable) div.addEventListener('click', handleClick);

    container.appendChild(div);

    const scaledObj = { ...obj, element: div, left: obj.left * scaleX, top: obj.top * scaleY, width: div.offsetWidth, height: div.offsetHeight };
    sceneObjects.push(scaledObj);

    if (obj.mainCharacter) {
      mainPlayerObj = { element: div, objData: obj, x: scaledObj.left, y: scaledObj.top, width: scaledObj.width, height: scaledObj.height };
    }
  });
}

function moveMainPlayer(dx, dy) {
  if (!mainPlayerObj) return;
  const proposedX = mainPlayerObj.x + dx;
  const proposedY = mainPlayerObj.y + dy;
  const virtualPlayer = { x: proposedX, y: proposedY, width: mainPlayerObj.width, height: mainPlayerObj.height };

  let blocked = false;

  for (let obj of sceneObjects) {
    if (obj.element === mainPlayerObj.element) continue;
    const other = { left: obj.left, top: obj.top, width: obj.width, height: obj.height };
    const colliding = !(virtualPlayer.x + virtualPlayer.width < other.left || virtualPlayer.x > other.left + other.width || virtualPlayer.y + virtualPlayer.height < other.top || virtualPlayer.y > other.top + other.height);

    if (colliding) {
      // Throttled "touch" triggers
      const mayTrigger = canTriggerTouch(obj);

      if (mayTrigger) {
        if (obj.switchScene?.enabled && obj.switchScene.trigger === 'touch' && obj.switchScene.target) {
          renderScene(obj.switchScene.target);
          return;
        }
        if (obj.giveCurrency?.enabled && obj.giveCurrency.trigger === 'touch' && obj.giveCurrency.currency) {
          currencies[obj.giveCurrency.currency] = (currencies[obj.giveCurrency.currency] || 0) + obj.giveCurrency.amount;
          if (obj.giveCurrency.deleteAfter) {
            obj.element.remove();
            sceneObjects = sceneObjects.filter(o => o.element !== obj.element);
            gameState.sceneList[gameState.saveCurrentScene] =
              gameState.sceneList[gameState.saveCurrentScene].filter(o => o.itemName !== obj.itemName);
          }
        }
        if (obj.giveObject?.enabled && obj.giveObject.trigger === 'touch' && obj.giveObject.object) {
          inventory.push(obj.giveObject.object);
          if (obj.giveObject.deleteAfter) {
            obj.element.remove();
            sceneObjects = sceneObjects.filter(o => o.element !== obj.element);
            gameState.sceneList[gameState.saveCurrentScene] =
              gameState.sceneList[gameState.saveCurrentScene].filter(o => o.itemName !== obj.itemName);
          }
        }
      }

      if (obj.collision !== false) {
        blocked = true; // maintain original block behavior
      }
    } else {
      // Not touching anymore -> allow future triggers
      endContact(obj);
    }
  }

  if (blocked) return;

  mainPlayerObj.x = Math.max(0, Math.min(proposedX, ${screenWidth} - mainPlayerObj.width));
  mainPlayerObj.y = Math.max(0, Math.min(proposedY, ${screenHeight} - mainPlayerObj.height));
  mainPlayerObj.element.style.left = mainPlayerObj.x + 'px';
  mainPlayerObj.element.style.top = mainPlayerObj.y + 'px';

  const currentSceneId = gameState.saveCurrentScene;
  const sceneData = gameState.sceneList[currentSceneId];
  const playerObj = sceneData.find(o => o.mainCharacter);
  if (playerObj) {
    playerObj.left = Math.round(mainPlayerObj.x / scaleX);
    playerObj.top = Math.round(mainPlayerObj.y / scaleY);
  }
}

function gameLoop() {
  if (!playing) return;
  let dx = 0, dy = 0;
  if (keysPressed.has('w')) dy -= 3;
  if (keysPressed.has('s')) dy += 3;
  if (keysPressed.has('a')) dx -= 3;
  if (keysPressed.has('d')) dx += 3;
  moveMainPlayer(dx, dy);
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
  keysPressed.add(e.key.toLowerCase());
  const action = gameState.saveCustomKeyBindings?.[e.key.toLowerCase()];
  if (action === 'toggleInventory' && gameState.persistentSettings?.inventoryEnabled) {
    const overlay = document.getElementById('inventoryOverlay');
    if (overlay) {
      overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
      if (overlay.style.display === 'block') renderInventoryOverlay();
    }
  }
});

document.addEventListener('keyup', e => keysPressed.delete(e.key.toLowerCase()));

window.onload = () => {
  const wrapper = document.createElement('div');
  wrapper.id = 'asciiGameWrapper';

  const gameArea = document.createElement('div');
  gameArea.id = 'gameArea';
  wrapper.appendChild(gameArea);

  if (gameState.persistentSettings?.inventoryEnabled) {
    const overlay = document.createElement('div');
    overlay.id = 'inventoryOverlay';
    wrapper.appendChild(overlay);
  }

  document.body.appendChild(wrapper);
  renderScene(gameState.saveCurrentScene);
  requestAnimationFrame(gameLoop);
};
`;
  folder.file("game_script.js", js);

  const embed = `
(function(){
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'gameInsert/game_style.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'gameInsert/game_script.js';
  document.body.appendChild(script);
})();
`;
  folder.file("game_embed.js", embed);

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gameInsert.zip';
  a.click();
  URL.revokeObjectURL(a.href);
}
