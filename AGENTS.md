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
- When introducing the next significant saved-data structure, add a `schemaVersion` field so future formats can be identified clearly.
- Do not build legacy migrations or compatibility layers unless the user explicitly requests them.
- The editor must continue working entirely in the browser without a backend.
- Exported games must remain standalone and must not depend on the editor or its `localStorage`.
- Preview behavior and exported-game behavior should remain consistent.
- Do not introduce a JavaScript framework unless the user explicitly approves it.
- Prefer plain HTML, CSS, and JavaScript.
- Keep changes focused and avoid unrelated refactoring.
- Before making broad structural changes, explain the proposed approach.
- Do not remove an existing feature merely because its implementation is incomplete.
- Mobile editor support is planned, so prefer Pointer Events and responsive-compatible approaches for future input and layout work.
- Treat "touch" in existing object actions as player collision/contact, not necessarily a browser touchscreen gesture.
- When changing save-state behavior, preserve the current scene, scenes, keybindings, persistent settings, currencies, inventory configuration, and object properties.
- Preview and export runtime code currently differ; changes affecting gameplay must account for both until a shared runtime is created.
- After every implementation task, summarize changed files and provide manual testing steps.
