// Final version of export_converter.js with inventory overlay toggle support (merged into full file)

function launchGamePreview() {
  const userWidthset = document.getElementById('screenWidth').value;
  const userHeightset = document.getElementById('screenHeight').value;

  localStorage.setItem('userWidth', userWidthset);
  localStorage.setItem('userHeight', userHeightset);

  const gameState = JSON.parse(localStorage.getItem('gameState'));
  if (!gameState) {
    alert("No game state found in localStorage.");
    return;
  }

  const userWidth = parseInt(localStorage.getItem('userWidth') || '650');
  const userHeight = parseInt(localStorage.getItem('userHeight') || '400');
  const scaleX = userWidth / 650;
  const scaleY = userHeight / 400;
  const scaleFont = (scaleX + scaleY) / 2;
  const baseFontSize = 15;
  const finalFontSize = baseFontSize * scaleFont;

  const cssContent = `body { background-color: #ffffff; color: #000; font-family: monospace; padding: 20px; position: relative; }
#gameArea { position: relative; border: 1px solid #ccc; height: ${userHeight}px; width: ${userWidth}px; background: #f5f5f5; overflow: hidden; }
.asciiObject { position: absolute; cursor: pointer; white-space: pre; font-size: ${finalFontSize}px; }
button { margin: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; }
#inventoryOverlay { display: none; position: absolute; top: 0; left: 0; width: ${userWidth}px; height: ${userHeight}px; background: rgba(255,255,255,0.95); font-size: ${finalFontSize}px; padding: 20px; overflow-y: auto; z-index: 100; font-family: monospace; }`;

  const jsContent = `
const gameState = ${JSON.stringify(gameState)};
const scaleX = ${scaleX};
const scaleY = ${scaleY};
let playing = false;
let mainPlayerObj = null;
let sceneObjects = [];
const keysPressed = new Set();
const inventory = [];
const currencies = {};

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
    for (const [name, amount] of Object.entries(currencies)) {
      html += \`<li>\${name}: \${amount}</li>\`;
    }
    html += "</ul>";
  }
  if (hasItems) {
    html += "<strong>Items:</strong><ul>";
    for (const item of inventory) {
      html += \`<li>\${item}</li>\`;
    }
    html += "</ul>";
  }
  overlay.innerHTML = html;
}

function updateMainPlayerPosition() {
  if (mainPlayerObj) {
    const currentScene = gameState.saveCurrentScene;
    const sceneObjects = gameState.sceneList[currentScene];
    const playerObject = sceneObjects.find(o => o.mainCharacter);
    if (playerObject) {
      playerObject.left = Math.round(mainPlayerObj.x / scaleX);
      playerObject.top = Math.round(mainPlayerObj.y / scaleY);
    }
  }
}

function renderScene(sceneId) {
  const container = document.getElementById('gameArea');
  container.innerHTML = "";
  sceneObjects = [];

  const objects = gameState.sceneList[sceneId] || [];

  objects.forEach((obj) => {
    const div = document.createElement('div');
    div.textContent = obj.ascii;
    div.classList.add('asciiObject');

    let left = obj.left * scaleX;
    let top = obj.top * scaleY;

    div.style.left = left + 'px';
    div.style.top = top + 'px';
    div.style.color = obj.colors?.default || '#000';

    if (obj.colors?.hover?.enabled) {
      div.addEventListener('mouseenter', () => div.style.color = obj.colors.hover.color);
      div.addEventListener('mouseleave', () => div.style.color = obj.colors.default);
    }

    const handleInteraction = () => {
      if (obj.colors?.click?.enabled) div.style.color = obj.colors.click.color;

      if (obj.giveCurrency?.enabled && obj.giveCurrency.trigger === 'click' && obj.giveCurrency.currency) {
        if (!(obj.giveCurrency.currency in currencies)) currencies[obj.giveCurrency.currency] = 0;
        currencies[obj.giveCurrency.currency] += obj.giveCurrency.amount;
        if (obj.giveCurrency.deleteAfter && obj.itemName) {
          const idx = gameState.sceneList[sceneId].findIndex(o => o.itemName === obj.itemName);
          if (idx !== -1) {
            gameState.sceneList[sceneId].splice(idx, 1);
            renderScene(sceneId);
            return;
          }
        }
      }

      if (obj.giveObject?.enabled && obj.giveObject.trigger === 'click' && obj.giveObject.object) {
        inventory.push(obj.giveObject.object);
        if (obj.giveObject.deleteAfter && obj.itemName) {
          const idx = gameState.sceneList[sceneId].findIndex(o => o.itemName === obj.itemName);
          if (idx !== -1) {
            gameState.sceneList[sceneId].splice(idx, 1);
            renderScene(sceneId);
            return;
          }
        }
      }

      if (obj.switchScene?.enabled && obj.switchScene.trigger === 'click' && obj.switchScene.target) {
        switchToScene(obj.switchScene.target);
      }
    };

    if (obj.clickable) div.addEventListener('click', handleInteraction);

    container.appendChild(div);

    const scaledObj = { ...obj, element: div, left, top, width: div.offsetWidth, height: div.offsetHeight };
    sceneObjects.push(scaledObj);

    if (obj.mainCharacter) {
      mainPlayerObj = { element: div, objData: obj, x: left, y: top, width: div.offsetWidth, height: div.offsetHeight };
    }
  });
}

function switchToScene(sceneId) {
  updateMainPlayerPosition();
  gameState.saveCurrentScene = sceneId;
  renderScene(sceneId);
}

function isColliding(a, b) {
  return !(a.x + a.width < b.left || a.x > b.left + b.width || a.y + a.height < b.top || a.y > b.top + b.height);
}

function moveMainPlayer(dx, dy) {
  if (!mainPlayerObj) return;
  const proposedX = mainPlayerObj.x + dx;
  const proposedY = mainPlayerObj.y + dy;
  const virtualPlayer = { x: proposedX, y: proposedY, width: mainPlayerObj.width, height: mainPlayerObj.height };

  let blocked = false;

  for (let obj of sceneObjects) {
    if (obj.element === mainPlayerObj.element) continue;
    const otherObj = { left: obj.left, top: obj.top, width: obj.width, height: obj.height };
    if (isColliding(virtualPlayer, otherObj)) {
      if (obj.switchScene?.enabled && obj.switchScene.trigger === 'touch' && obj.switchScene.target) {
        switchToScene(obj.switchScene.target);
        return;
      }
      if (obj.giveCurrency?.enabled && obj.giveCurrency.trigger === 'touch' && obj.giveCurrency.currency) {
        if (!(obj.giveCurrency.currency in currencies)) currencies[obj.giveCurrency.currency] = 0;
        currencies[obj.giveCurrency.currency] += obj.giveCurrency.amount;
        if (obj.giveCurrency.deleteAfter && obj.itemName) {
          const idx = gameState.sceneList[gameState.saveCurrentScene].findIndex(o => o.itemName === obj.itemName);
          if (idx !== -1) {
            gameState.sceneList[gameState.saveCurrentScene].splice(idx, 1);
            renderScene(gameState.saveCurrentScene);
            return;
          }
        }
      }
      if (obj.giveObject?.enabled && obj.giveObject.trigger === 'touch' && obj.giveObject.object) {
        inventory.push(obj.giveObject.object);
        if (obj.giveObject.deleteAfter && obj.itemName) {
          const idx = gameState.sceneList[gameState.saveCurrentScene].findIndex(o => o.itemName === obj.itemName);
          if (idx !== -1) {
            gameState.sceneList[gameState.saveCurrentScene].splice(idx, 1);
            renderScene(gameState.saveCurrentScene);
            return;
          }
        }
      }
      if (obj.collision !== false) {
        blocked = true;
        break;
      }
    }
  }

  if (!blocked) {
    mainPlayerObj.x = Math.max(0, Math.min(proposedX, ${userWidth} - mainPlayerObj.width));
    mainPlayerObj.y = Math.max(0, Math.min(proposedY, ${userHeight} - mainPlayerObj.height));
    mainPlayerObj.element.style.left = mainPlayerObj.x + 'px';
    mainPlayerObj.element.style.top = mainPlayerObj.y + 'px';
    updateMainPlayerPosition();
  }
}

function setupKeyBindings() {
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keysPressed.add(key);
    const action = gameState.saveCustomKeyBindings?.[key];
    if (gameState.persistentSettings?.inventoryEnabled && action === 'toggleInventory') {
      const overlay = document.getElementById('inventoryOverlay');
      if (overlay) {
        const showing = overlay.style.display === 'block';
        overlay.style.display = showing ? 'none' : 'block';
        if (!showing) renderInventoryOverlay();
      }
    }
  });
  document.addEventListener('keyup', e => keysPressed.delete(e.key.toLowerCase()));
}

function gameLoop() {
  if (playing && mainPlayerObj) {
    let dx = 0, dy = 0;
    if (keysPressed.has('w')) dy -= 3;
    if (keysPressed.has('s')) dy += 3;
    if (keysPressed.has('a')) dx -= 3;
    if (keysPressed.has('d')) dx += 3;
    if (dx || dy) moveMainPlayer(dx, dy);
  }
  requestAnimationFrame(gameLoop);
}

function playGame() {
  playing = true;
  renderScene(gameState.saveCurrentScene);
  setupKeyBindings();
  requestAnimationFrame(gameLoop);
}

function pauseGame() { playing = false; }
function resetGame() { playing = false; renderScene(gameState.saveCurrentScene); }
function returnToSettings() { window.close(); }

window.onload = () => {
  if (gameState.persistentSettings?.inventoryEnabled) {
    const invOverlay = document.createElement('div');
    invOverlay.id = 'inventoryOverlay';
    document.body.appendChild(invOverlay);
  }
  renderScene(gameState.saveCurrentScene);
  setTimeout(() => playGame(), 100);
};
`;

  const htmlTemplate = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>ASCII Game Preview</title><link rel='stylesheet' href='STYLE_URL'></head><body><div id='gameArea'></div><script src='SCRIPT_URL'></script></body></html>`;

  const cssBlob = new Blob([cssContent], { type: 'text/css' });
  const jsBlob = new Blob([jsContent], { type: 'application/javascript' });
  const cssUrl = URL.createObjectURL(cssBlob);
  const jsUrl = URL.createObjectURL(jsBlob);

  const finalHtml = htmlTemplate.replace('STYLE_URL', cssUrl).replace('SCRIPT_URL', jsUrl);

  const gameWindow = window.open('', '_blank', `width=${userWidth + 100},height=${userHeight + 100}`);
  if (gameWindow) {
    gameWindow.document.open();
    gameWindow.document.write(finalHtml);
    gameWindow.focus();
    gameWindow.document.close();
  } else {
    alert("Popup blocked. Please enable pop-ups for this site.");
  }
}
