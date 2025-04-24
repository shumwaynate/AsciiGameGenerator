// This script will extract all necessary data from the editor (scenes, objects, keybinds, interactions) 
// and format them into properly structured files (index.html, script.js, style.css). This ensures that 
// all functionality, including scene transitions and interactions, is correctly translated into an 
// independent game format.
// This script will then use the 3 files to make a popup window with the game loaded locally to avoid trying to adjust the website organization.
// export_converter.js - Updated with Inventory + Deletion Logic for Game Preview

// export_converter.js - Updated with Inventory + Deletion Logic for Game Preview

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
  
    const currentScene = gameState.saveCurrentScene;
    const userWidth = parseInt(localStorage.getItem('userWidth') || '650');
    const userHeight = parseInt(localStorage.getItem('userHeight') || '400');
    const scaleX = userWidth / 650;
    const scaleY = userHeight / 400;
    const scaleFont = (scaleX + scaleY) / 2;
    const baseFontSize = 15;
    const finalFontSize = baseFontSize * scaleFont;
  
    const cssContent = `
      body {
        background-color: #ffffff;
        color: #000000;
        font-family: monospace;
        padding: 20px;
        position: relative;
      }
      #gameArea {
        position: relative;
        border: 1px solid #ccc;
        margin-bottom: 20px;
        height: ${userHeight}px;
        width: ${userWidth}px;
        background-color: #f5f5f5;
        overflow: hidden;
      }
      .asciiObject {
        position: absolute;
        cursor: pointer;
        white-space: pre;
        font-size: ${finalFontSize}px;
      }
      button {
        margin: 5px;
        padding: 10px 15px;
        font-size: 14px;
        cursor: pointer;
      }
      #inventoryPanel {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid #ccc;
        padding: 10px;
        font-family: monospace;
        font-size: 14px;
        width: 180px;
        z-index: 10;
      }
      #inventoryPanel h3 {
        margin-top: 0;
        font-size: 16px;
      }
      #inventoryPanel ul {
        padding-left: 20px;
        margin-top: 4px;
        margin-bottom: 10px;
      }
      #inventoryPanel li {
        list-style-type: disc;
      }
    `;
  
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
      const deletedObjects = {};
  
      function switchToScene(sceneId) {
        renderScene(sceneId);
      }
  
      function renderInventory() {
        const curBox = document.getElementById('inventoryPanel');
        const curList = Object.entries(currencies).map(([name, amount]) => '<li>' + name + ': ' + amount + '</li>').join('');
        const objList = inventory.map(obj => '<li>' + obj + '</li>').join('');
        curBox.innerHTML =
            '<h3>Inventory</h3>' +
            '<strong>Currencies:</strong>' +
            '<ul>' + curList + '</ul>' +
            '<strong>Items:</strong>' +
            '<ul>' + objList + '</ul>';
        }

  
      function renderScene(sceneId) {
        sceneObjects = [];
        const container = document.getElementById('gameArea');
        container.innerHTML = "";
        const objects = gameState.sceneList[sceneId] || [];
        deletedObjects[sceneId] = deletedObjects[sceneId] || [];
  
        objects.forEach(obj => {
          if (deletedObjects[sceneId].includes(obj.itemName)) return;
  
          const div = document.createElement('div');
          div.textContent = obj.ascii;
          div.classList.add('asciiObject');
  
          const left = obj.left * scaleX;
          const top = obj.top * scaleY;
  
          div.style.left = left + "px";
          div.style.top = top + "px";
          div.style.color = obj.colors?.default || "#fff";
  
          if (obj.colors?.hover?.enabled) {
            div.addEventListener('mouseenter', () => div.style.color = obj.colors.hover.color);
            div.addEventListener('mouseleave', () => div.style.color = obj.colors.default);
          }
  
          const handleInteraction = () => {
            if (obj.colors?.click?.enabled) div.style.color = obj.colors.click.color;
            if (obj.switchScene?.enabled && obj.switchScene.trigger === 'click' && obj.switchScene.target) {
              switchToScene(obj.switchScene.target);
            }
            if (obj.giveCurrency?.enabled && obj.giveCurrency.trigger === 'click' && obj.giveCurrency.currency) {
              if (!(obj.giveCurrency.currency in currencies)) currencies[obj.giveCurrency.currency] = 0;
              currencies[obj.giveCurrency.currency] += obj.giveCurrency.amount;
              renderInventory();
            }
            if (obj.giveObject?.enabled && obj.giveObject.trigger === 'click' && obj.giveObject.object) {
              if (!inventory.includes(obj.giveObject.object)) inventory.push(obj.giveObject.object);
              renderInventory();
            }
            if ((obj.giveCurrency?.deleteAfter || obj.giveObject?.deleteAfter) && obj.itemName) {
              deletedObjects[sceneId].push(obj.itemName);
              renderScene(sceneId);
            }
          };
  
          if (obj.clickable) {
            div.addEventListener('click', handleInteraction);
          }
  
          container.appendChild(div);
  
          const scaledObj = {
            ...obj,
            element: div,
            left,
            top,
            width: div.offsetWidth,
            height: div.offsetHeight
          };
          sceneObjects.push(scaledObj);
  
          if (obj.mainCharacter) {
            mainPlayerObj = {
              element: div,
              objData: obj,
              x: left,
              y: top,
              width: div.offsetWidth,
              height: div.offsetHeight
            };
          }
        });
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
            if (obj.switchScene?.enabled && obj.switchScene.trigger === "touch" && obj.switchScene.target) {
              switchToScene(obj.switchScene.target);
              return;
            }
            if (obj.giveCurrency?.enabled && obj.giveCurrency.trigger === 'touch') {
              if (!(obj.giveCurrency.currency in currencies)) currencies[obj.giveCurrency.currency] = 0;
              currencies[obj.giveCurrency.currency] += obj.giveCurrency.amount;
              renderInventory();
              if (obj.giveCurrency.deleteAfter && obj.itemName) {
                deletedObjects[currentScene].push(obj.itemName);
                renderScene(currentScene);
                return;
              }
            }
            if (obj.giveObject?.enabled && obj.giveObject.trigger === 'touch') {
              if (!inventory.includes(obj.giveObject.object)) inventory.push(obj.giveObject.object);
              renderInventory();
              if (obj.giveObject.deleteAfter && obj.itemName) {
                deletedObjects[currentScene].push(obj.itemName);
                renderScene(currentScene);
                return;
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
          mainPlayerObj.element.style.left = mainPlayerObj.x + "px";
          mainPlayerObj.element.style.top = mainPlayerObj.y + "px";
        }
      }
  
      function setupKeyBindings() {
        document.addEventListener('keydown', (e) => keysPressed.add(e.key.toLowerCase()));
        document.addEventListener('keyup', (e) => keysPressed.delete(e.key.toLowerCase()));
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
  
      function pauseGame() {
        playing = false;
      }
  
      function resetGame() {
        playing = false;
        renderScene(gameState.saveCurrentScene);
      }
  
      function returnToSettings() {
        window.close();
      }
  
      window.onload = () => {
        const panel = document.createElement('div');
        panel.id = 'inventoryPanel';
        document.body.appendChild(panel);
        renderScene(gameState.saveCurrentScene);
        renderInventory();
        setTimeout(() => playGame(), 100);
      };
    `;
  
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ASCII Game Preview</title>
        <link rel="stylesheet" href="STYLE_URL">
      </head>
      <body>
        <div id="gameArea"></div>
        <button onclick="playGame()">Play</button>
        <button onclick="pauseGame()">Pause</button>
        <button onclick="resetGame()">Reset</button>
        <button onclick="returnToSettings()">Return to Settings</button>
        <script src="SCRIPT_URL"></script>
      </body>
      </html>
    `;
  
    const cssBlob = new Blob([cssContent], { type: 'text/css' });
    const jsBlob = new Blob([jsContent], { type: 'application/javascript' });
    const cssUrl = URL.createObjectURL(cssBlob);
    const jsUrl = URL.createObjectURL(jsBlob);
  
    const finalHtml = htmlTemplate.replace("STYLE_URL", cssUrl).replace("SCRIPT_URL", jsUrl);
  
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
  