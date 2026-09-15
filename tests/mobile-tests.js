(async function () {
  'use strict';
  const results = document.getElementById('results');
  const frames = document.getElementById('frames');
  const parameters = new URLSearchParams(location.search);
  const touchLayout = parameters.has('touch');
  document.body.dataset.pointerMode = touchLayout ? 'forced-touch-layout' : (matchMedia('(any-pointer: coarse)').matches ? 'coarse' : 'fine');
  let passed = 0;
  let total = 0;
  const longName = 'A-very-long-scene-and-object-name-'.repeat(5);
  const project = {
    sceneList: { [longName]: [{ ascii: '@', itemName: longName, left: 300, top: 180, mainCharacter: true, visible: true, collision: false }] },
    saveCurrentScene: longName,
    saveCustomKeyBindings: { i: 'toggleInventory' },
    persistentSettings: { inventoryEnabled: true, inventory: ['key'], currencies: { [longName]: 3 }, objects: [longName] }
  };

  function assert(condition, message) { if (!condition) throw new Error(message); }
  async function test(name, run) {
    total += 1;
    const item = document.createElement('li');
    try { await run(); passed += 1; item.className = 'pass'; item.textContent = 'PASS — ' + name; }
    catch (error) { item.className = 'fail'; item.textContent = 'FAIL — ' + name + ': ' + error.message; }
    results.appendChild(item);
  }
  function ready(win) { return new Promise(function (resolve) { win.setTimeout(resolve, 40); }); }

  async function mount(html, width, height, initialStorage) {
    const iframe = document.createElement('iframe');
    iframe.width = width;
    iframe.height = height;
    const storage = JSON.stringify(initialStorage || { gameState: JSON.stringify(project), editorSettings: JSON.stringify({ screenWidth: 650, screenHeight: 400, position: 9, allowDrag: false }) }).replace(/</g, '\\u003c');
    // Force only touch-control visibility when checking touch layout on a mouse-only host.
    // Input behavior is tested with Pointer Events in runtime-tests.js.
    const touchStyle = touchLayout ? '<style>.ascii-runtime .ascii-touch-controls { display: flex !important; }</style>' : '';
    const setup = `<base href="${new URL('../', location.href).href}">${touchStyle}<script>
      window.alert = function () {}; window.confirm = function () { return true; };
      window.testErrors = [];
      window.addEventListener('error', event => window.testErrors.push(event.message));
      window.addEventListener('unhandledrejection', event => window.testErrors.push(String(event.reason)));
      const data = ${storage};
      Object.defineProperty(window, 'localStorage', { value: { getItem: key => data[key] || null, setItem: (key, value) => data[key] = String(value), removeItem: key => delete data[key], clear: () => {} } });
      HTMLAnchorElement.prototype.click = function () {};
    <\/script>`;
    iframe.srcdoc = html.replace('<head>', '<head>' + setup);
    await new Promise(function (resolve, reject) {
      const timeout = setTimeout(function () { reject(new Error('iframe load timed out')); }, 10000);
      iframe.onload = function () { clearTimeout(timeout); resolve(); };
      frames.appendChild(iframe);
    });
    await ready(iframe.contentWindow);
    return iframe;
  }
  function noOverflow(doc) {
    assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, 'page has horizontal overflow');
  }

  try {
    const [editorHtml, rawSettingsHtml] = await Promise.all(['index.html', 'settings.html'].map(function (path) {
      return fetch('../' + path).then(function (response) { if (!response.ok) throw new Error(path); return response.text(); });
    }));
    // The ZIP adapter is exercised with a memory-only archive; no network/CDN or download is needed.
    const settingsHtml = rawSettingsHtml.replace(/<script src="https:[^"]+"[^>]*><\/script>/, '');
    for (const size of [[320, 640], [390, 844], [430, 932], [768, 1024], [812, 375], [1440, 900]]) {
      const [width, height] = size;
      if (parameters.has('inspect') && Number(parameters.get('inspect')) !== width) continue;
      let editor;
      let settings;
      let preview;
      let exported;
      await test(width + '×' + height + ' editor layout, properties and scrolling', async function () {
        editor = await mount(editorHtml, width, height);
        const win = editor.contentWindow;
        const doc = win.document;
        assert(win.editorState, 'editor did not bootstrap');
        assert(win.testErrors.length === 0, 'editor console errors: ' + win.testErrors.join(', '));
        noOverflow(doc);
        const canvas = doc.getElementById('ascii-display').getBoundingClientRect();
        assert(canvas.width <= width, 'canvas should fit the viewport');
        if (width <= 1100) {
          assert(doc.querySelectorAll('.panel-box.collapsed').length === 3, 'mobile panels should begin collapsed');
          doc.querySelector('[data-editor-target="items-in-scene-box"]').click();
        }
        doc.querySelector('#object-list li').click();
        doc.getElementById('edit-selected-properties').click();
        assert(doc.getElementById('prop-main-player').checked, 'selected properties should be available');
        const menu = doc.getElementById('context-menu').getBoundingClientRect();
        assert(menu.left >= 0 && menu.right <= width, 'properties must fit horizontally');
        if (width > 1100) assert(menu.top >= 0 && menu.bottom <= height, 'desktop popover must fit vertically');
        doc.querySelectorAll('.panel-box').forEach(function (panel) {
          if (panel.classList.contains('collapsed')) panel.querySelector('.panel-header').click();
        });
        noOverflow(doc);
        assert(win.getComputedStyle(doc.body).touchAction !== 'none', 'page scrolling must remain enabled');
        assert(win.getComputedStyle(doc.querySelector('.ascii-art')).touchAction === 'none', 'object drag must suppress browser panning');
        if (width <= 1100) {
          assert(doc.getElementById('save-scene').getBoundingClientRect().height >= 44, 'Save Scene needs a touch target');
          assert(doc.getElementById('scene-name').getBoundingClientRect().right <= width, 'scene input must fit');
        }
        win.scrollTo(0, 0);
      });
      await test(width + '×' + height + ' Settings placement round trip and ZIP adapter', async function () {
        settings = await mount(settingsHtml, width, height);
        const win = settings.contentWindow;
        const doc = win.document;
        noOverflow(doc);
        doc.getElementById('positionSelect').value = '1';
        doc.getElementById('allowDragCheckbox').checked = true;
        doc.getElementById('saveScreenSize').click();
        const saved = JSON.parse(win.localStorage.getItem('editorSettings'));
        assert(saved.position === 1 && saved.allowDrag === true, 'location and drag must save');
        win.showEditorSettings(saved);
        assert(doc.getElementById('positionSelect').value === '1' && doc.getElementById('allowDragCheckbox').checked, 'location and drag must restore');
        const files = {};
        win.JSZip = function () {
          this.folder = function () { return { file: function (name, content) { files[name] = content; } }; };
          this.generateAsync = async function () { return new win.Blob(['test']); };
        };
        await win.exportGameAsZip();
        assert(win.testErrors.length === 0, 'Settings console errors: ' + win.testErrors.join(', '));
        assert(files['game_script.js'].includes('ascii-touch-controls'), 'export must contain shared controls');
        assert(!files['game_script.js'].includes('localStorage'), 'export must be standalone');
        assert(files['game_script.js'].includes('position: 1') && files['game_script.js'].includes('allowDrag: true'), 'export must consume placement');
        settings.exportFiles = files;
      });
      await test(width + '×' + height + ' preview fit, autoplay, Pause/Play/Reset and inventory', async function () {
        const win = settings.contentWindow;
        let previewHtml = '';
        win.open = function () { return { document: { open: function () {}, write: function (html) { previewHtml = html; }, close: function () {} }, focus: function () {} }; };
        win.launchGamePreview();
        preview = await mount(previewHtml, width, height);
        const doc = preview.contentDocument;
        const runtime = preview.contentWindow.asciiGameRuntime;
        noOverflow(doc);
        assert(runtime.getSnapshot().playing, 'preview must autoplay');
        doc.getElementById('pauseGame').click();
        assert(!runtime.getSnapshot().playing, 'Pause must work');
        doc.getElementById('playGame').click();
        doc.querySelector('[data-action="inventory"]').click();
        assert(doc.getElementById('inventoryOverlay').style.display === 'block', 'inventory must open');
        doc.getElementById('resetGame').click();
        assert(!runtime.getSnapshot().playing, 'Reset must remain paused');
        const root = doc.getElementById('asciiGameWrapper').getBoundingClientRect();
        assert(root.bottom <= height, 'game and controls must fit vertically');
        const coarse = preview.contentWindow.matchMedia('(any-pointer: coarse)').matches;
        const controls = doc.querySelector('.ascii-touch-controls');
        assert((preview.contentWindow.getComputedStyle(controls).display !== 'none') === (touchLayout || coarse), 'touch controls must follow pointer capability');
        if (touchLayout || coarse) assert(controls.scrollWidth <= controls.clientWidth, 'touch controls must not be clipped');
      });
      await test(width + '×' + height + ' generated game fit and shared controls', async function () {
        const files = settings.exportFiles;
        exported = await mount('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>' + files['game_style.css'] + '</style></head><body><script>' + files['game_script.js'] + '<\/script></body></html>', width, height);
        const doc = exported.contentDocument;
        const root = doc.getElementById('asciiGameWrapper').getBoundingClientRect();
        noOverflow(doc);
        assert(root.left >= 0 && root.right <= width && root.top >= 0 && root.bottom <= height, 'export must fit entirely in viewport');
        assert(doc.querySelectorAll('[data-direction]').length === 4, 'export must contain a complete direction pad');
        assert(doc.querySelector('.ascii-widget-handle'), 'enabled widget drag must have a handle');
        assert(exported.contentWindow.asciiGameRuntime.getSnapshot().playing, 'export must autoplay');
      });
      if (!parameters.has('inspect')) [editor, settings, preview, exported].forEach(function (frame) { if (frame) frame.remove(); });
    }
    if (!parameters.has('inspect')) {
      await test('fresh phone editor help never blocks creation, explicit saving or reload', async function () {
        const frame = await mount(editorHtml, 320, 640, {});
        const win = frame.contentWindow; const doc = win.document;
        assert(!doc.getElementById('editor-help').hidden, 'first-run help should be visible');
        assert(win.editorState.getProjectState().currentScene === null, 'fresh project must have no fake scene');
        doc.getElementById('ascii-input').value = '@'; doc.getElementById('add-ascii-art').click();
        assert(win.editorState.getWorkspaceState().objects.length === 1, 'help must not block adding');
        doc.getElementById('dismiss-help').click();
        assert(doc.getElementById('editor-help').hidden, 'help must dismiss');
        doc.getElementById('show-help').click();
        assert(!doc.getElementById('editor-help').hidden, 'help must reopen');
        doc.getElementById('dismiss-help').click();
        doc.getElementById('scene-name').value = 'First'; doc.getElementById('save-scene').click();
        const saved = JSON.parse(win.localStorage.getItem('gameState'));
        assert(saved.schemaVersion === win.AsciiGameGenerator.AppInfo.schemaVersion && saved.sceneList.First.length === 1, 'explicit scene save must persist');
        const data = {};
        Object.values(win.AsciiGameGenerator.ProjectStorage.keys).forEach(function (key) { const value = win.localStorage.getItem(key); if (value !== null) data[key] = value; });
        assert(win.testErrors.length === 0, 'fresh editor should have no console errors');
        frame.remove();
        const reopened = await mount(editorHtml, 320, 640, data);
        assert(reopened.contentWindow.editorState.getWorkspaceState().objects.length === 1, 'reopen should load saved scene');
        assert(reopened.contentDocument.getElementById('editor-help').hidden, 'help dismissal should persist');
        noOverflow(reopened.contentDocument); reopened.remove();
      });
      await test('unreadable browser project stays protected while editor remains usable', async function () {
        const raw = '{broken';
        const frame = await mount(editorHtml, 390, 844, { gameState: raw });
        const win = frame.contentWindow; const doc = win.document;
        assert(win.editorState, 'editor should still open');
        doc.getElementById('ascii-input').value = '@'; doc.getElementById('add-ascii-art').click();
        doc.getElementById('scene-name').value = 'First'; doc.getElementById('save-scene').click();
        assert(win.localStorage.getItem('gameState') === raw, 'failed loading must not lead to silent replacement');
        assert(!doc.getElementById('status-message').hidden, 'recovery instructions should be visible');
        assert(win.testErrors.length === 0, 'invalid storage must not produce an uncaught error');
        frame.remove();
      });
    }
  } catch (error) {
    await test('test harness', function () { throw error; });
  }
  document.getElementById('summary').textContent = passed + '/' + total + ' tests passed';
  document.title = passed + '/' + total + ' mobile checks passed';
  document.body.dataset.testStatus = passed === total ? 'passed' : 'failed';
})();
