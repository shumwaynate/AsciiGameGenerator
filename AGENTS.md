# Project Overview

AsciiGameGenerator is a browser-based ASCII game editor that supports scene creation, object interactions, game previewing, project import and export, and generation of standalone embeddable games.

## Permanent Project Requirements

- Multiple ASCII objects may be marked as main characters. Do not enforce a single-main-character restriction.
- Existing exported JSON project files must remain compatible whenever practical.
- Use non-destructive normalization or migrations when the saved structure changes.
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
