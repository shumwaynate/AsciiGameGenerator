// This script will extract all necessary data from the editor (scenes, objects, keybinds, interactions) 
// and format them into properly structured files (index.html, script.js, style.css). This ensures that 
// all functionality, including scene transitions and interactions, is correctly translated into an 
// independent game format.
// This script will then use the 3 files to make a popup window with the game loaded locally to avoid trying to adjust the website organization.


// file: export_converter.js

// Function to launch the game preview
function launchGamePreview() {

    // Get the values from the input fields 
    const userWidthset = document.getElementById('screenWidth').value;
    const userHeightset = document.getElementById('screenHeight').value;

    // Save the values into localStorage
    localStorage.setItem('userWidth', userWidthset);
    localStorage.setItem('userHeight', userHeightset);


    // Get gameState from localStorage
    const gameState = JSON.parse(localStorage.getItem('gameState'));
    if (!gameState) {
      alert("No game state found in localStorage.");
      return;
    }
  
    const currentScene = gameState.saveCurrentScene;
    const sceneList = gameState.sceneList;
    const keyBindings = gameState.saveCustomKeyBindings;
  
    // === 1. Retrieve user-defined dimensions from settings.html ===
    const userWidth = parseInt(localStorage.getItem('userWidth') || '650');
    const userHeight = parseInt(localStorage.getItem('userHeight') || '400');
  
    // Calculate scaling factors based on the user input
    const scaleX = userWidth / 650; // base width of the editor
    const scaleY = userHeight / 400; // base height of the editor
  
    // === 2. Create CSS content for pop-up window ===
    const cssContent = `
      body {
        background-color: #111;
        color: #eee;
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
        background-color: #222;
        overflow: hidden;
      }
      .asciiObject {
        position: absolute;
        cursor: pointer;
        white-space: pre;
      }
      button {
        margin: 5px;
        padding: 10px 15px;
        font-size: 14px;
        cursor: pointer;
      }
    `;
  
    // === 3. JavaScript logic for scaling and rendering the game ===
    const jsContent = `
      const gameState = ${JSON.stringify(gameState)};
  
      let playing = false;
  
      function renderScene(sceneId) {
        const sceneObjects = gameState.sceneList[sceneId] || [];
        const container = document.getElementById('gameArea');
        container.innerHTML = "";
  
        sceneObjects.forEach(obj => {
          const div = document.createElement('div');
          div.textContent = obj.ascii;
          div.classList.add('asciiObject');
  
          // Apply scaling to position and size
          div.style.left = (obj.left * ${scaleX}) + "px";
          div.style.top = (obj.top * ${scaleY}) + "px";
          div.style.color = obj.color;
  
          // Hover + click effects
          div.addEventListener('mouseenter', () => {
            if (obj.hoverColor) div.style.color = obj.hoverColor;
          });
          div.addEventListener('mouseleave', () => {
            div.style.color = obj.color;
          });
          div.addEventListener('click', () => {
            if (obj.clickable && obj.clickColor) {
              div.style.color = obj.clickColor;
              console.log("Clicked:", obj.ascii);
            }
          });
  
          container.appendChild(div);
        });
      }
  
      function playGame() {
        playing = true;
        console.log("Game started.");
        renderScene(gameState.saveCurrentScene);
      }
  
      function pauseGame() {
        playing = false;
        console.log("Game paused.");
      }
  
      function resetGame() {
        playing = false;
        renderScene(gameState.saveCurrentScene);
        console.log("Game reset.");
      }
  
      function returnToSettings() {
        window.close();
      }
  
      function setupKeyBindings() {
        const bindings = gameState.saveCustomKeyBindings;
        window.addEventListener('keydown', (e) => {
          const action = bindings[e.key];
          if (action) {
            console.log(\`Key '\${e.key}' triggers action: \${action}\`);
          }
        });
      }
  
      window.onload = () => {
        renderScene(gameState.saveCurrentScene);
        setupKeyBindings();
      };
    `;
  
    // === 4. HTML template for game window ===
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
  
    // === 5. Create blobs for CSS and JS ===
    const cssBlob = new Blob([cssContent], { type: 'text/css' });
    const jsBlob = new Blob([jsContent], { type: 'application/javascript' });
    const cssUrl = URL.createObjectURL(cssBlob);
    const jsUrl = URL.createObjectURL(jsBlob);
  
    const finalHtml = htmlTemplate
      .replace("STYLE_URL", cssUrl)
      .replace("SCRIPT_URL", jsUrl);
  
    // === 6. Open the pop-up window ===
    const gameWindow = window.open('', '_blank', `width=${userWidth+100},height=${userHeight+100}`);
  
    if (gameWindow) {
      gameWindow.document.open();
      gameWindow.document.write(finalHtml);
      gameWindow.document.close();
    } else {
      alert("Popup blocked. Please enable pop-ups for this site.");
    }
  }
  