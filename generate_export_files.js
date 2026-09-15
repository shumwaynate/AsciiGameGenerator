// Standalone Export adapter for the shared ASCII gameplay runtime.

document.getElementById('saveGameExport')?.addEventListener('click', exportGameAsZip);

async function exportGameAsZip() {
  try {
  const gameState = window.AsciiGameGenerator.prepareGameLaunch();
  if (typeof JSZip !== 'function') throw new Error('ZIP export could not load. Check your connection and reload Settings.');
  const editorSettings = gameState.editorSettings;
  const screenWidth = editorSettings.screenWidth;
  const screenHeight = editorSettings.screenHeight;
  const fontSize = 15 * ((screenWidth / 650 + screenHeight / 400) / 2);
  const zip = new JSZip();
  const position = editorSettings.position;
  const allowDrag = editorSettings.allowDrag;
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
#asciiGameWrapper #inventoryOverlay { display: none; }`;
  folder.file('game_style.css', css);

  const runtimeSource = window.AsciiGameGenerator.buildRuntimeSource({
    initialGameState: gameState,
    width: screenWidth,
    height: screenHeight,
    position: position,
    allowDrag: allowDrag,
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
  setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 1000);
  } catch (error) { alert(error.message); }
}
