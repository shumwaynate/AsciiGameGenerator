// Preview adapter for the shared ASCII gameplay runtime.

let asciiGamePreviewWindow = null;

function launchGamePreview() {
  const widthInput = document.getElementById('screenWidth').value;
  const heightInput = document.getElementById('screenHeight').value;

  localStorage.setItem('userWidth', widthInput);
  localStorage.setItem('userHeight', heightInput);

  const gameState = JSON.parse(localStorage.getItem('gameState'));
  if (!gameState) {
    alert('No game state found in localStorage.');
    return;
  }

  const width = parseInt(localStorage.getItem('userWidth') || '650', 10) || 650;
  const height = parseInt(localStorage.getItem('userHeight') || '400', 10) || 400;
  const scaleFont = ((width / 650) + (height / 400)) / 2;
  const fontSize = 15 * scaleFont;
  const runtimeSource = window.AsciiGameGenerator.buildRuntimeSource({
    initialGameState: gameState,
    width: width,
    height: height,
    autoPlay: true,
    rootId: 'asciiGameWrapper',
    exposeAs: 'asciiGameRuntime',
    controlIds: {
      play: 'playGame',
      pause: 'pauseGame',
      reset: 'resetGame'
    }
  });

  const previewHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ASCII Game Preview</title>
  <style>
    body { background: #fff; color: #000; font-family: monospace; padding: 20px; }
    #previewControls { margin-bottom: 10px; }
    button { margin: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; }
    #asciiGameWrapper { position: relative; width: ${width}px; height: ${height}px; border: 1px solid #ccc; background: #f5f5f5; overflow: hidden; }
    .ascii-game-area { position: relative; width: 100%; height: 100%; overflow: hidden; }
    .asciiObject { position: absolute; cursor: pointer; white-space: pre; font-size: ${fontSize}px; }
    #inventoryOverlay { display: none; box-sizing: border-box; position: absolute; inset: 0; background: rgba(255,255,255,0.95); font-size: ${fontSize}px; padding: 20px; overflow-y: auto; z-index: 100; }
  </style>
</head>
<body>
  <div id="previewControls">
    <button id="playGame" type="button">Play</button>
    <button id="pauseGame" type="button">Pause</button>
    <button id="resetGame" type="button">Reset</button>
  </div>
  <div id="asciiGameWrapper"></div>
  <script>${runtimeSource}<\/script>
</body>
</html>`;

  if (asciiGamePreviewWindow && !asciiGamePreviewWindow.closed && asciiGamePreviewWindow.asciiGameRuntime) {
    asciiGamePreviewWindow.asciiGameRuntime.destroy();
  }

  asciiGamePreviewWindow = window.open('', 'asciiGamePreview', `width=${width + 100},height=${height + 180}`);
  if (!asciiGamePreviewWindow) {
    alert('Popup blocked. Please enable pop-ups for this site.');
    return;
  }

  asciiGamePreviewWindow.document.open();
  asciiGamePreviewWindow.document.write(previewHtml);
  asciiGamePreviewWindow.document.close();
  asciiGamePreviewWindow.focus();
}
