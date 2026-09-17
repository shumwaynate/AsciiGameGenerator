# AsciiGameGenerator

AsciiGameGenerator is a browser-based ASCII game creator for building small interactive games without a backend, account, framework, or installed game engine.

Create scenes, place and color ASCII/text-art objects, configure interactions, preview the game on desktop or phone, and export a standalone browser game that can be hosted almost anywhere.

**Current beta:** `0.1.0-beta.1`

**Current focus:** ASCII-first game creation on desktop and mobile. The editor itself may use whatever modern web UI best supports creation, but the games and runtime are intended to remain fundamentally ASCII for the foreseeable future.

[Open the editor](https://shumwaynate.github.io/AsciiGameGenerator/)

---

## What this project is becoming

AsciiGameGenerator started as a lightweight ASCII scene editor. The longer-term goal is broader:

> **A browser-first ASCII game engine that remains easy enough to use on a phone, while becoming powerful enough to create complete adventure, puzzle, story, RPG-style, and other 2D ASCII games without requiring code.**

The project is intentionally **not** trying to become a generic 3D engine right now. Full 3D, sprites, and other rendering systems may be explored much later, but the near- and medium-term direction is to make ASCII itself much more capable.

The creator/editor does not need to look like a terminal. It can use a polished, responsive web interface with inspectors, panels, tabs, visual logic controls, and other modern tools. The exported games should retain a coherent ASCII identity.

### Design principles going forward

- **ASCII-first runtime.** World objects, animation, effects, dialogue, menus, HUD elements, and game feedback should work naturally with text and ASCII art.
- **Modern creator UI.** The editor should prioritize usability over pretending to be an ASCII interface.
- **Simple on the surface, deeper underneath.** A first-time user should still be able to add an object, drag it, save a scene, and preview it within minutes.
- **Powerful primitives instead of hundreds of special cases.** New systems should increasingly be built from reusable concepts such as variables, triggers, conditions, and actions.
- **Desktop and mobile are both first-class.** The same project should be practical to create and play from either.
- **Manual scene saving remains deliberate.** Editing a workspace is not the same as committing that workspace to a saved scene.
- **Standalone export remains important.** Exported games should not require the editor, its browser storage, an account, or a backend.
- **No unnecessary complexity.** New architecture should earn its place by unlocking multiple useful game features, not merely preparing for hypothetical future systems.

---

## Current capabilities

Today the editor supports:

- Multiple manually saved scenes
- Positioned ASCII and multi-character text-art objects
- Foreground colors plus hover/click color behavior
- Object visibility
- Collision
- Zero or one Main Player per scene
- Mouse, touch, and pen object dragging through Pointer Events
- Desktop and phone editor layouts
- Click- and contact-triggered interactions
- Scene switching
- Currency rewards
- Inventory/object collection
- Custom keybindings
- Runtime inventory display
- WASD gameplay on desktop
- Touch directional controls on coarse-pointer devices
- Preview with Play, Pause, and Reset
- Standalone browser-game ZIP export
- Project JSON export/import
- Schema validation and safe project recovery
- Responsive exported-widget placement and optional dragging

The project intentionally does **not** yet include a generalized logic system, dialogue system, usable/equippable inventory, combat/RPG systems, runtime progress saving, accounts, or cloud projects.

---

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
application version. **Load Example: Garden Trail** imports a supported example
project that demonstrates several current engine features. A pre-import backup
preserves the preceding project.

---

## Saving scenes and projects

**Save Scene is manual.** Adding, dragging, deleting, or editing workspace objects
does not change a saved scene until you choose Save Scene. Saving under another
name creates a separate scene snapshot. Use the scene list to load a saved scene.

Loading replaces the workspace, including unsaved edits. This beta does not yet
include unsaved-change prompts or undo/redo.

Explicit scene saves and confirmed project settings/keybinding changes persist to
browser storage. Workspace-only edits are not persisted as scene changes.

Navigation between Editor and Settings does **not** save pending typing:

- Scene edits require **Save Scene**
- Currency amount edits require **Save Currency Changes**
- Settings fields require their appropriate Save button
- Navigating away does not silently confirm unfinished input

**New Project** asks once, then resets this application's project and screen
settings to valid defaults. It does not clear unrelated browser storage. The
latest pre-import backup remains available in Settings.

---

## Desktop and phone use

- Desktop keeps the current full editor layout and uses WASD during gameplay.
- Phone/tablet layouts use a scaled canvas, section navigation, collapsible
  panels, and touch-sized controls. Scaling does not change saved coordinates.
- Tap to select; use **Edit Properties** to configure an object.
- Items / Scenes can select invisible objects, whose selected outline can be dragged.
- Scroll normally outside object dragging. Release/cancel stops a drag.
- Preview and exported games automatically show directional controls and an
  Inventory button on coarse-pointer devices.
- Held touch directions support continuous movement.
- An action's **Touch** trigger means player collision/contact, not a browser
  touchscreen gesture. Click actions can still be tapped on a touchscreen.

---

## Preview and standalone export

Preview autoplays. Play resumes, Pause suppresses gameplay input, and Reset restores
initial state and stays paused. Inventory is available when enabled. Currency and
inventory changes persist between runtime scenes but do not modify the editor's
saved project.

Save at least one scene before Preview or game export. If the active scene is
missing, the editor chooses the first saved scene. Deleting the last scene leaves
an empty usable workspace rather than creating a fake default scene.

In Settings, configure screen dimensions and exported-widget placement. The nine
positions anchor the game on its host page. Allow Drag adds a Move game handle
for mouse/touch dragging or arrow-key positioning.

**Save Game** downloads a ZIP containing:

- `gameInsert/game_script.js` — shared runtime plus embedded project data
- `gameInsert/game_style.css` — presentation styles
- `gameInsert/game_embed.js` — injector that loads the adjacent files

Extract the folder beside your host HTML, then include:

~~~html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="gameInsert/game_embed.js"></script>
~~~

The exported game does not need the editor, its storage, or a backend.

---

## Project JSON, validation and recovery

**Export Project JSON** downloads a portable project containing saved scenes and
settings. Project exports intentionally exclude unsaved workspace changes, DOM
state, transient editor IDs, pointer state, and runtime state.

The supported root format is:

~~~js
{
  schemaVersion: 1,
  sceneList: { /* scene names mapped to object arrays */ },
  saveCurrentScene: null,
  saveCustomKeyBindings: {},
  persistentSettings: { /* inventory, currencies, library, configuration */ },
  editorSettings: {
    screenWidth: 650,
    screenHeight: 400,
    position: 9,
    allowDrag: false
  }
}
~~~

Import parses, validates, and normalizes before replacing project data:

- Unsupported versions and invalid project structures are rejected.
- Failed imports leave the current project intact.
- Missing or malformed optional nested values are normalized where safe.
- Invalid active-scene references recover to a valid saved scene when possible.
- A successful import preserves one pre-import backup for recovery.
- Empty projects are valid and use a null current scene.

### Versionless browser data

Existing in-browser data without `schemaVersion` is accepted only when it has the
current supported structure. It is normalized and rewritten as schema version 1.

This protects current browser projects; it is **not** a general legacy migration
system. Imported project files are expected to use the supported schema.

---

# Engine direction

The next stage of development is intended to expand what can be built **without
abandoning ASCII or turning the editor into a collection of unrelated settings**.

The planned engine model centers on five areas:

## 1. ASCII World

Scenes continue to contain positioned ASCII entities.

An ASCII entity may eventually support richer presentation such as:

- Single- or multi-line ASCII art
- Foreground color
- Background color
- Visibility
- Collision
- Layer/depth
- Reusable ASCII art assets
- Animation frames
- Runtime appearance changes

The world remains ASCII rather than becoming a sprite-based engine.

## 2. Game State

A small generalized game-state system is planned so games can remember values such as:

~~~text
hasKey = true
questStage = 2
coinsFound = 8
playerName = "Alex"
~~~

Initial variable types are expected to stay intentionally simple:

- Boolean
- Number
- Text

Currencies and inventory remain specialized game-state systems where they are
useful rather than forcing everything into one generic variable system.

## 3. Triggers, Conditions, and Actions

This is the most important planned engine expansion.

Current features such as Switch Scene, Give Currency, and Give Object are useful,
but continuing to add one custom property section for every new behavior would
eventually make the editor difficult to use.

The planned logic model is:

~~~text
WHEN
    [ Trigger ]

IF
    [ Optional Conditions ]

DO
    [ Action ]
    [ Action ]
    [ Action ]
~~~

Possible triggers include:

~~~text
Player Touch
Click / Tap
Scene Start
~~~

Possible conditions include:

~~~text
Variable comparison
Has inventory item
Currency comparison
~~~

Possible actions may include:

~~~text
Set Variable
Change Number
Add / Remove Currency
Give / Remove Item
Switch Scene
Show / Hide Object
Change ASCII Text
Change Color
Show Message
~~~

For example:

~~~text
WHEN Player Touches Door

IF
    hasKey == true

DO
    Remove Item "Key"
    Set doorUnlocked = true
    Show Message "You unlock the door."
    Switch Scene "Inside"
~~~

This approach is intended to unlock quests, doors, switches, shops, puzzles,
branching events, secrets, alternate endings, and other systems without requiring
a completely separate engine feature for each one.

## 4. ASCII Runtime UI

World objects and game interface elements should remain separate.

Dialogue boxes, menus, inventory panels, notifications, choices, and HUD elements
should eventually render in a dedicated runtime UI layer over the ASCII world.

The exported game can use normal responsive HTML/CSS internally while presenting
an intentionally ASCII-styled interface, for example:

~~~text
╔══════════════════════════════════════╗
║ GUARD                                ║
║                                      ║
║ The northern gate has been sealed.   ║
║                                      ║
║                         [ Continue ]  ║
╚══════════════════════════════════════╝
~~~

This allows the same dialogue or menu to adapt to a desktop monitor or phone
without pretending that it is a movable world object.

## 5. ASCII Assets and Animation

A later visual expansion can remain entirely ASCII.

Potential systems include:

- Reusable multi-line ASCII art assets
- ASCII animation frames
- Idle/walk/interact/damage animations
- Scene color palettes
- Layer/depth ordering
- Background and foreground ASCII layers
- Camera movement
- Screen shake
- Text-based particles/effects
- Parallax-style ASCII backgrounds

These systems can make games substantially more expressive without introducing
sprites or full 3D rendering.

---

# Editor direction

The game runtime is intended to remain ASCII-first, but the creator itself may
become a more capable modern editor.

A likely long-term desktop organization is:

~~~text
┌───────────────────────────────────────────────────────────┐
│ Scene           Save                         ▶ Preview    │
├────────────┬───────────────────────────┬──────────────────┤
│ HIERARCHY  │                           │    INSPECTOR     │
│            │                           │                  │
│ Player     │       ASCII WORLD         │ Appearance       │
│ Door       │                           │ Collision        │
│ Key        │                           │ Interactions     │
│ NPC        │                           │                  │
├────────────┴───────────────────────────┴──────────────────┤
│ Scenes | Variables | Items | Logic | Dialogue / Game UI │
└───────────────────────────────────────────────────────────┘
~~~

This is a direction, not a promise to immediately replace the current interface.

The important separation is:

- **Hierarchy / Items:** what exists in the current scene
- **Viewport:** where those things are positioned
- **Inspector:** what the selected thing is and how it behaves
- **Project systems:** scenes, variables, inventory definitions, logic, dialogue,
  and other systems that belong to the game rather than one selected object

On phones, these concepts can become tabs, sheets, or collapsible sections rather
than squeezing a desktop layout onto a small display.

The project should continue to favor **progressive complexity**: basic creation
should stay simple even as advanced logic becomes possible.

---

# Tentative roadmap

The roadmap is intentionally organized around **large capability jumps** rather
than dozens of isolated features.

## v0.2 — Game Logic Foundation

Primary goal: make the current engine programmable without requiring code.

Planned direction:

- Boolean / Number / Text variables
- Trigger → Condition → Action model
- Existing scene/currency/inventory interactions mapped into the generalized logic system
- Variable conditions
- Inventory and currency conditions
- Set/change variable actions
- Show/hide object
- Change object ASCII/text
- Change object color
- Simple runtime message overlay

This milestone should provide the foundation for puzzles, keys/doors, quest flags,
shops, switches, branching events, and other systems.

## v0.3 — Dialogue & Runtime UI

Primary goal: enable story-heavy and interaction-heavy games.

Possible scope:

- Dedicated ASCII-styled runtime UI layer
- Message boxes
- Dialogue
- Speaker names
- Continue/close behavior
- Dialogue choices
- Conditions/actions from choices
- Better inventory interaction/use
- Notifications and simple HUD elements

## v0.4 — Richer ASCII Worlds

Primary goal: significantly improve visual expression while staying ASCII.

Possible scope:

- Reusable ASCII assets
- Multi-line asset editing
- ASCII animation
- Layer/depth ordering
- Background/foreground layers
- Scene palettes
- Runtime color/effect actions
- Camera movement or simple scrolling-world support
- Text-based effects

## v0.5 — Creator Experience

Primary goal: make larger games substantially faster and easier to build.

Possible scope:

- Duplicate objects
- Copy/paste
- Scene duplication
- Undo/redo
- Better positioning/grid tools
- Reusable object templates/prefabs
- Improved logic editing
- Better project organization
- More complete game templates/examples

These version labels are directional rather than fixed contracts. Features may
move between milestones as real usage shows what matters most.

---

## What is deliberately not a near-term priority

To keep the project focused and understandable, the following are not currently
core roadmap priorities:

- Full 3D
- Generic sprite-engine conversion
- Complex ECS architecture exposed to users
- Multiplayer
- Accounts/cloud infrastructure
- Large scripting-language implementation
- Full RPG framework hard-coded into the engine

Some of these may make sense much later. The near-term goal is to make the ASCII
engine itself powerful enough that creators can build many kinds of games from a
small set of reusable systems.

---

## Architecture

Plain HTML/CSS/JavaScript, no framework, bundler, or package-manager requirement.

| Module | Responsibility |
| --- | --- |
| `js/core/app-info.js` | Central application and schema versions |
| `js/core/project-model.js` | Object/settings defaults, normalization, scene serialization |
| `js/core/project-storage.js` | Validation, browser storage, JSON import/export, backup/reset/help preferences |
| `js/core/editor-state.js` | Saved scenes plus an isolated editable workspace and selection |
| `js/editor/editor-renderer.js` | State-driven DOM and canvas sizing |
| `js/editor/editor-controller.js` | Shared Pointer Events, controls, explicit scene operations |
| `script.js` | Editor bootstrap, persistence callbacks, help/status UI |
| `settings.js` | Settings forms and safe import/export/recovery UI |
| `js/runtime/game-runtime.js` | Shared gameplay, lifecycle, touch controls, widget positioning |
| `js/runtime/runtime-builder.js` | Embeds the runtime factory and project into standalone source |
| `export_converter.js` / `generate_export_files.js` | Thin Preview / ZIP adapters |

The current architecture deliberately separates saved scenes from the editable
workspace and keeps Preview and standalone Export on the same gameplay runtime.

Future logic/UI systems should build on those boundaries rather than collapsing
them back into a single monolithic editor script.

---

## Run locally and test

Serve this directory with any static HTTP server, then open `index.html`.

For example:

~~~sh
python -m http.server 8000 --bind 127.0.0.1
~~~

Then open:

~~~text
http://127.0.0.1:8000/index.html
~~~

HTTP is recommended for example loading and iframe tests; there is no server-side
application logic.

Browser test pages:

- `tests/editor-tests.html`
- `tests/runtime-tests.html`
- `tests/mobile-tests.html`
- `tests/persistence-tests.html`

The tests use fixtures/in-memory storage. See `RELEASE.md` for the current release
audit and manual matrix.

---

## Current limitations

- No generalized variables/conditions/actions system yet.
- No proper dialogue/choice system yet.
- Inventory currently focuses on collection/display rather than full item use/equipment.
- No RPG/combat/stat framework, equipment system, or party movement.
- No scene autosave, unsaved-change prompts, or undo/redo.
- No accounts or cloud saves.
- No legacy file migrations.
- No runtime progress saving between browser sessions.
- Browser storage may be blocked, cleared, or full; export portable JSON backups.
- Automated checks primarily use Chromium. Physical iOS/Android gestures, popup
  policies, real downloads, and final hosted-build behavior should still receive
  manual release testing.

---

## Project philosophy

AsciiGameGenerator does not need hundreds of hard-coded game systems to become a
capable engine.

The preferred direction is:

> **Build a few powerful primitives that creators can combine into many game mechanics.**

A health system, locked door, quest, puzzle, shop, alternate ending, or collectible
should increasingly be something the creator can construct from game state,
conditions, interactions, and actions rather than something that requires a new
special-purpose engine subsystem every time.

The editor should remain approachable enough to make a first scene quickly, while
the engine underneath gains enough depth to support complete games.

For the foreseeable future, **ASCII is not a temporary placeholder for graphics.
ASCII is the medium.**
