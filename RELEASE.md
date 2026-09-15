# v0.1.0-beta.1 release checklist

## Implemented

- Central application version and schema version 1 in js/core/app-info.js.
- ProjectStorage owns browser reads/writes, validation, JSON export/import, one pre-import backup, restore, reset, and help preference.
- Imports validate before replacing data. Unsupported/versionless files are rejected; structurally current versionless browser data is normalized and rewritten. Nested malformed values receive safe defaults.
- Missing active scenes resolve to the first saved scene. Deleting the active scene loads the first remaining scene; deleting the last clears the workspace and sets the current scene to null.
- Preview and standalone export explain that a scene must be saved when the project is empty. Both continue using the shared runtime.
- New Project resets only application project/settings/help data; unrelated browser data and the recovery backup remain.
- Small dismissible/reopenable help, version display, and two-scene Garden Trail example.
- Navigation never confirms pending input. Currency amounts require Save Currency Changes, workspace edits require Save Scene, and screen settings require Save Screen Size / Location. Explicit Add/Delete/configuration actions still persist their changes.

## Automated verification

Local Chromium headless runs, September 15, 2026:

| Suite | Result |
| --- | --- |
| Editor | 32/32 |
| Runtime | 27/27 |
| Persistence/import | 22/22 |
| Mobile | 26/26 |
| Mobile with forced touch-control visibility | 26/26 |

Original baseline assertions remain. Added coverage includes schema/version rejection, safe imports/backup, malformed settings, storage failures/rollback, scene recovery/deletion, empty launch guards, transient/unsaved export exclusions, example gameplay, help, and explicit currency saving versus navigation. Responsive integration checks exercise 320, 390, 430, 768, 812, and 1440 pixel widths, capture browser errors, and execute real Preview and generated game source. ZIP downloads are stubbed in automated tests.

## Release audit

Small issues fixed: unsafe scattered storage access, invalid current-scene references, unsupported action choices appearing enabled, disabled stat-effect fields still having persistence handlers, missing ZIP-library error handling, stale example path/docs, and runtime transitions to nonexistent scenes. Settings import requests use an epoch so an older async read cannot overwrite a later import/restore.

No automated failures remain. Before promotion, complete the unchecked manual matrix below on the final hosted build and physical devices. These checks are not claimed as completed by the automated tests.

Deferred: RPG/combat/stat effects, equipment, party movement, toolbar gameplay, undo/redo, autosave, cloud/accounts, legacy migrations, and runtime progress persistence. Storage rollback is best effort if the browser itself refuses restoration; simultaneous multi-tab editing is not coordinated. JSZip is currently loaded from a CDN for ZIP generation.

## Manual release matrix

Use a disposable project and keep a portable JSON backup.

### Fresh user

- [ ] New Project confirms once, leaves an empty usable canvas, and preserves unrelated site storage.
- [ ] Help is visible, dismissible, and reopenable; Add Object works while help is shown.
- [ ] Add an ASCII object, optionally mark Main Player, save the first scene, and Preview.
- [ ] Empty-project Preview and ZIP export show a useful message without opening a broken game.

### Desktop editor

- [ ] Add, select, drag, edit properties, and delete objects; Save Scene commits the result.
- [ ] Mark another Main Player: the earlier player is unmarked; zero players remains valid.
- [ ] Save/load multiple scenes; delete the current scene, then the last scene.
- [ ] Add currency, type another amount, visit Settings and return: the saved amount remains.
- [ ] Change the amount and click Save Currency Changes: it survives Settings navigation and reload.
- [ ] Pending new currency/object/keybinding text and unsaved scene edits do not survive navigation as saved changes.
- [ ] Explicit currency/object-library/keybinding additions and deletions persist.
- [ ] Settings screen values persist only after Save Screen Size / Location; unsaved values disappear on returning.

### Phone editor

- [ ] Check portrait and landscape: readable controls, scrolling, no sideways page overflow.
- [ ] Add/select/drag visible and invisible objects; scrolling outside drag targets still works.
- [ ] Edit Properties is reachable; keyboard does not trap the page.
- [ ] Save/load scenes and navigate to/from Settings.
- [ ] Repeat explicit currency saving versus discarded typing on a touch device.

### Gameplay

- [ ] Desktop WASD and phone directional pad move the main player; release/cancel stops movement.
- [ ] Garden Trail wall blocks movement; coin adds Gold; key adds an inventory item.
- [ ] Garden/Cabin transitions work; chest interaction gives its item.
- [ ] Inventory works by configured key and touch button; pause/play/reset release movement and reset state correctly.

### Persistence

- [ ] Reload/reopen restores saved scenes, current scene, bindings, currencies, inventory config, and settings.
- [ ] Export project JSON and reimport it; schemaVersion is 1 and saved data matches.
- [ ] Invalid JSON, invalid scene shape, and unsupported schema leave the project intact with a readable error.
- [ ] Valid import creates one pre-import backup; Restore returns to that project.
- [ ] New Project returns to a valid empty state without creating a fake default scene.

### Standalone export

- [ ] Download a real ZIP with network access to JSZip; extract and serve its host example.
- [ ] Play on desktop and a physical phone, including rewards, inventory, transitions, pause/reset.
- [ ] Clear editor storage or use a separate browser profile: the exported game still works independently.
- [ ] Verify placement, optional widget dragging, and screen fitting on the final host.

## Changed-file map

Created: js/core/app-info.js, js/core/project-storage.js, Example Saves/Garden-Trail.json, tests/persistence-tests.html, tests/persistence-tests.js, RELEASE.md.

Changed: AGENTS.md, README.md, index.html, style.css, script.js, settings.html, settings.js, export_converter.js, generate_export_files.js, js/core/project-model.js, js/core/editor-state.js, js/editor/editor-renderer.js, js/editor/editor-controller.js, js/runtime/game-runtime.js, gameInsert/game_script.js, gameInsert/game_style.css, tests/editor-tests.js, tests/mobile-tests.js, tests/MOBILE-RELEASE-CHECKLIST.md.

No commit was created for this implementation.
