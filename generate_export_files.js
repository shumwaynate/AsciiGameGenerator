// Standalone Export adapter for the shared ASCII gameplay runtime.

document.getElementById('saveGameExport')?.addEventListener('click', exportGameAsZip);

async function exportGameAsZip() {
  const gameState = JSON.parse(localStorage.getItem('gameState'));
  if (!gameState) {
    alert('No game state found in localStorage.');
    return;
  }

  const widthInput = document.getElementById('screenWidth')?.value;
  const heightInput = document.getElementById('screenHeight')?.value;
  const screenWidth = parseInt(widthInput || localStorage.getItem('userWidth') || '650', 10) || 650;
  const screenHeight = parseInt(heightInput || localStorage.getItem('userHeight') || '400', 10) || 400;
  const scaleFont = ((screenWidth / 650) + (screenHeight / 400)) / 2;
  const fontSize = 15 * scaleFont;
  const zip = new JSZip();
  const folder = zip.folder('gameInsert');

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
#asciiGameWrapper .ascii-game-area {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
  box-sizing: border-box;
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.95);
  font-size: ${fontSize}px;
  padding: 20px;
  overflow-y: auto;
  z-index: 10000;
}`;
  folder.file('game_style.css', css);

  const runtimeSource = window.AsciiGameGenerator.buildRuntimeSource({
    initialGameState: gameState,
    width: screenWidth,
    height: screenHeight,
    autoPlay: true,
    rootId: 'asciiGameWrapper',
    exposeAs: 'asciiGameRuntime'
  });
  folder.file('game_script.js', runtimeSource);

  const embed = `(function () {
  'use strict';
  var embedScript = document.currentScript;
  var baseUrl = embedScript && embedScript.src ? new URL('.', embedScript.src) : new URL('gameInsert/', document.baseURI);
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('game_style.css', baseUrl).href;
  var loadGameScript = function () {
    var script = document.createElement('script');
    script.src = new URL('game_script.js', baseUrl).href;
    document.body.appendChild(script);
  };
  link.onload = loadGameScript;
  link.onerror = loadGameScript;
  document.head.appendChild(link);
})();`;
  folder.file('game_embed.js', embed);

  const blob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'gameInsert.zip';
  link.click();
  URL.revokeObjectURL(downloadUrl);
}
