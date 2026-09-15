(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};

  function serializeForScript(value) {
    const serialized = JSON.stringify(value === undefined ? null : value);
    return serialized
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

  function buildRuntimeSource(options) {
    options = options || {};
    if (typeof namespace.createAsciiGameRuntime !== 'function') {
      throw new Error('game-runtime.js must be loaded before runtime-builder.js.');
    }

    const runtimeOptions = {
      initialGameState: options.initialGameState || {},
      width: options.width,
      height: options.height,
      autoPlay: Boolean(options.autoPlay)
    };
    const rootId = options.rootId || 'asciiGameWrapper';
    const exposeAs = options.exposeAs || 'asciiGameRuntime';
    const controlIds = options.controlIds || null;

    return `(function () {
  'use strict';
  window.AsciiGameGenerator = window.AsciiGameGenerator || {};
  window.AsciiGameGenerator.createAsciiGameRuntime = ${namespace.createAsciiGameRuntime.toString()};

  function bootstrapAsciiGame() {
    var root = document.getElementById(${serializeForScript(rootId)});
    if (!root) {
      root = document.createElement('div');
      root.id = ${serializeForScript(rootId)};
      document.body.appendChild(root);
    }

    if (window[${serializeForScript(exposeAs)}] && typeof window[${serializeForScript(exposeAs)}].destroy === 'function') {
      window[${serializeForScript(exposeAs)}].destroy();
    }

    var runtime = window.AsciiGameGenerator.createAsciiGameRuntime({
      root: root,
      initialGameState: ${serializeForScript(runtimeOptions.initialGameState)},
      width: ${serializeForScript(runtimeOptions.width)},
      height: ${serializeForScript(runtimeOptions.height)},
      autoPlay: ${serializeForScript(runtimeOptions.autoPlay)}
    });
    window[${serializeForScript(exposeAs)}] = runtime;
    ${controlIds ? `document.getElementById(${serializeForScript(controlIds.play)}).addEventListener('click', runtime.play);
    document.getElementById(${serializeForScript(controlIds.pause)}).addEventListener('click', runtime.pause);
    document.getElementById(${serializeForScript(controlIds.reset)}).addEventListener('click', runtime.reset);` : ''}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapAsciiGame, { once: true });
  } else {
    bootstrapAsciiGame();
  }
})();`;
  }

  namespace.buildRuntimeSource = buildRuntimeSource;
})(window);
