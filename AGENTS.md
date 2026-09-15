# Project Overview

AsciiGameGenerator is a browser-based ASCII game editor that supports scene creation, object interactions, game previewing, project import and export, and generation of standalone embeddable games.

## Permanent Project Requirements

- Each scene supports a maximum of one main character.
- A scene may have zero main characters.
- When a different object is marked as the main character, the previously marked object in the current scene should be unmarked automatically.
- Different scenes may use different main-character objects.
- Multiple-character or party movement is not currently supported and may be reconsidered later.
- Compatibility with old test JSON files is not currently required. Test and example JSON files may be regenerated as the project evolves.
- Preserve projects created with the current supported schema unless a deliberate schema change is approved.
- The current project format is schema version 1. Keep the schema version and application version centralized in js/core/app-info.js.
- Read/write project data only through js/core/project-storage.js. Project persistence must never implicitly commit workspace edits to a saved scene.
- Validate and normalize project imports before replacing saved data. Imports require an explicit supported schema version; structurally current versionless browser data may be rewritten as version 1. Do not migrate legacy example files.
- An empty project has a null current scene. Invalid current-scene references resolve to the first saved scene; deleting the active scene loads the next valid scene or clears the workspace.
- Do not build legacy migrations or compatibility layers unless the user explicitly requests them.
- The editor must continue working entirely in the browser without a backend.
- Exported games must remain standalone and must not depend on the editor or its `localStorage`.
- Preview behavior and exported-game behavior should remain consistent.
- Do not introduce a JavaScript framework unless the user explicitly approves it.
- Prefer plain HTML, CSS, and JavaScript.
- Keep changes focused and avoid unrelated refactoring.
- Before making broad structural changes, explain the proposed approach.
- Do not remove an existing feature merely because its implementation is incomplete.
- Mobile editor support is an active requirement. Keep phone, tablet, and desktop layouts usable and use Pointer Events for shared input handling.
- Treat "touch" in existing object actions as player collision/contact, not necessarily a browser touchscreen gesture.
- When changing save-state behavior, preserve the current scene, scenes, keybindings, persistent settings, currencies, inventory configuration, and object properties.
- Preview and exported games use the shared runtime in js/runtime/game-runtime.js. Keep gameplay and touch controls in that runtime so both remain consistent.
- After every implementation task, summarize changed files and provide manual testing steps.

- Navigation between Editor and Settings must not save pending input. Currency amount edits require Save Currency Changes; scene edits require Save Scene; Settings form edits require its Save button. Only confirmed changes persist across navigation.
