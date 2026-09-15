# AsciiGameGenerator

A browser-based ASCII game editor for small games and embeddable widgets. Create
scenes, place text-art objects, configure interactions, and export a standalone
game. It runs entirely in your browser, with no account or backend.

**Beta:** 0.1.0-beta.1. Desktop and phone layouts are supported. This is an early
beta; export project JSON backups for work you want to keep.

[Open the editor](https://shumwaynate.github.io/AsciiGameGenerator/)

## Create your first game

1. Type ASCII art and choose **Add ASCII Art to Display**.
2. Select an object and drag it. **Edit Properties** opens its name, colors,
   visibility, collision, and action controls. Desktop right-click also works.
3. Optionally mark an object **Main Player**. Each scene supports zero or one;
   marking another automatically unmarks the previous one. Different scenes can
   use different player objects.
4. Enter a scene name and choose **Save Scene**.
5. Open **Editor Settings + Export & Import**, then **Launch Game Preview**.
6. Add other scenes and configure Switch Scene, Give Currency, or Give Object.

The Help control reopens the dismissible getting-started card. Settings shows the
application version. **Load Example: Garden Trail** imports a small two-scene
project with a solid obstacle, gold, inventory pickups, a clickable chest, and
contact-triggered gates. A pre-import backup preserves the preceding project.

## Saving scenes and projects

**Save Scene is manual.** Adding, dragging, deleting, or editing workspace objects
does not change a saved scene until you choose Save Scene. Saving under another
name creates a separate scene snapshot. Use the scene list to load a saved scene.
Loading replaces the workspace, including unsaved edits; this beta has no
unsaved-change prompts or undo/redo.

Explicit scene saves and project settings/keybinding changes persist to browser
storage. Reopening the editor loads the saved active scene. Workspace-only edits
are not persisted. Save Scene before navigating to Settings or closing the page.

**New Project** asks once, then resets this application's project and screen
settings to valid defaults. It does not clear unrelated browser storage. The
latest pre-import backup remains available in Settings.

## Desktop and phone use

- Desktop keeps the floating panels. Use WASD during gameplay.
- Phone/tablet layouts use a scaled canvas, section navigation, collapsible
  panels, and touch-sized controls. Scaling does not change saved coordinates.
- Tap to select; use Edit Properties. Items / Scenes also selects invisible
  objects, whose selected outline can be dragged.
- Scroll normally outside object dragging. Release/cancel stops a drag.
- Preview and exported games automatically show a directional pad and Inventory
  button on coarse-pointer devices. Hold directions to move; multitouch release
  is tracked separately for each pointer.
- An action's **Touch** trigger means player collision/contact, not a browser
  touchscreen gesture. Click actions can be tapped on a touchscreen.

## Preview and standalone export

Preview autoplays. Play resumes, Pause suppresses gameplay input, and Reset restores
initial state and stays paused. Inventory is available when enabled. Currency and
inventory changes persist between runtime scenes, but do not modify the editor's
saved project.

Save at least one scene before Preview or game export. If the active scene is
missing, the editor chooses the first saved scene. Deleting the last scene leaves
an empty usable workspace; it does not create a fake default scene.

In Settings, configure screen dimensions and exported-widget placement. The nine
positions anchor the game on its host page. Allow Drag adds a Move game handle
for mouse/touch dragging or arrow-key positioning. Save Screen Size / Location
persists these settings. Preview and game export also use current form values.

**Save Game** downloads a ZIP containing:

- gameInsert/game_script.js — shared runtime plus embedded project data.
- gameInsert/game_style.css — presentation styles.
- gameInsert/game_embed.js — injector that loads the adjacent files.

Extract the folder beside your host HTML, then include:

~~~html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="gameInsert/game_embed.js"></script>
~~~

The exported game does not need the editor, its storage, or a backend. Test it
through tests/export-host.html. ZIP creation loads JSZip from the existing CDN;
if unavailable, Settings shows an error instead of silently failing.

## Project JSON, validation and recovery

**Export Project JSON** downloads AsciiGameGenerator-YYYY-MM-DD.json containing
saved scenes and settings. Save screen-setting changes first. Exports exclude
workspace edits, DOM state, transient editor IDs, pointer state, and runtime state.

The supported root format is:

~~~js
{
  schemaVersion: 1,
  sceneList: { /* scene names mapped to object arrays */ },
  saveCurrentScene: null, // a saved scene name when scenes exist
  saveCustomKeyBindings: {},
  persistentSettings: { /* inventory, currencies, library, configuration */ },
  editorSettings: { screenWidth: 650, screenHeight: 400, position: 9, allowDrag: false }
}
~~~

Import parses, validates, and normalizes before replacing any project data:

- Unsupported versions, invalid JSON, invalid scene lists/arrays, and objects
  without ASCII text are rejected with a message. Current data is retained.
- Missing/malformed optional nested values are normalized safely, with warnings.
- Invalid active scenes choose the first saved scene in Object.keys order; no
  scenes means null.
- Immediately before a successful replacement, one raw backup of the previous
  browser project/settings is saved under **asciiGameGenerator.preImportBackup**.
  **Restore Pre-import Backup** validates and restores it. Each import replaces
  this single backup; there is no version-history system.
- Browser write failures trigger rollback of completed writes and an error. If
  the browser also denies rollback, the message explicitly reports that problem.
- Corrupt browser projects are not silently overwritten at startup. Recovery
  instructions link to Settings for a valid import, or use New Project to reset.

### Versionless browser data

Existing in-browser data without schemaVersion is accepted only when it has the
current sceneList/object structure, saveCurrentScene field, keybinding object,
and persistentSettings object. It is then normalized and rewritten with version 1.
This is preservation of active browser projects, **not a legacy-file migration**.
Imported files must specify version 1; old wrapper-shaped/legacy examples are
unsupported. Garden-Trail.json is the supported example; older files in Example
Saves are historical and are not offered by the UI.

Navigation between Editor and Settings must not save pending input. Currency amount edits require Save Currency Changes; scene edits require Save Scene; Settings form edits require its Save button. Only confirmed changes persist across navigation.

## Architecture

Plain HTML/CSS/JavaScript, no framework, bundler, or package-manager requirement.

| Module | Responsibility |
| --- | --- |
| js/core/app-info.js | Central application and schema versions |
| js/core/project-model.js | Object/settings defaults, normalization, scene serialization |
| js/core/project-storage.js | Validation, browser storage, JSON import/export, backup/reset/help preferences |
| js/core/editor-state.js | Saved scenes plus an isolated editable workspace and selection |
| js/editor/editor-renderer.js | State-driven DOM and canvas sizing |
| js/editor/editor-controller.js | Shared Pointer Events, controls, explicit scene operations |
| script.js | Editor bootstrap, persistence callbacks, help/status UI |
| settings.js | Settings forms and safe import/export/recovery UI |
| js/runtime/game-runtime.js | Shared gameplay, lifecycle, touch controls, widget positioning |
| js/runtime/runtime-builder.js | Embeds the runtime factory and project into standalone source |
| export_converter.js / generate_export_files.js | Thin Preview / ZIP adapters |

The storage API owns the existing gameState and editorSettings keys. gameState
contains the versioned gameplay project; editorSettings holds screen/placement
settings. The API combines them into the single JSON format above. Multi-key
writes are synchronous with rollback; this is not a cross-tab transaction system.

## Run locally and test

Serve this directory with any static HTTP server, then open index.html. For
example, if Python is installed:

~~~sh
python -m http.server 8000 --bind 127.0.0.1
~~~

Open http://127.0.0.1:8000/index.html. HTTP is recommended for example loading and
iframe tests; there is no server-side application logic.

Browser test pages:

- tests/editor-tests.html
- tests/runtime-tests.html
- tests/mobile-tests.html (also run with ?touch=1 for visible touch-control layout)
- tests/persistence-tests.html

The tests use fixtures/in-memory storage. ?touch=1 tests layout on mouse-only
hosts; runtime tests separately synthesize touch Pointer Events. No specific
physical phone is required. See RELEASE.md for the release audit and manual matrix.

## Current limitations

- No RPG/combat/stat effects, equipment, party movement, or persistent toolbar.
  Unfinished controls are disabled; only Toggle Inventory is a supported custom
  keybinding action in this beta.
- No scene autosave, unsaved-change prompts, undo/redo, accounts, or cloud saves.
- No legacy file migrations or runtime progress saving between browser sessions.
- Browser storage may be blocked, cleared, or full. Export portable JSON backups.
- Automated checks use Chromium. Physical iOS/Android gestures, popup policies,
  real downloads, and the final hosted build still need a manual release pass.
