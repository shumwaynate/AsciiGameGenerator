(function () {
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
})();