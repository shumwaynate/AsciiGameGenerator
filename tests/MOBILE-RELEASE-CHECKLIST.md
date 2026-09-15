# Mobile + UX release candidate

This records the mobile-phase checkpoint. See [../RELEASE.md](../RELEASE.md) for current beta test totals and the full release checklist.

## Automated checks

Serve the repository with any local static HTTP server, then open:

- `tests/editor-tests.html` — 29 checks (25 original + 4 new).
- `tests/runtime-tests.html` — 27 checks (19 original + 8 new).
- `tests/mobile-tests.html` — 24 responsive/integration checks.
- `tests/mobile-tests.html?touch=1` — the same 24 checks with touch controls visible on mouse-only hosts.

The mobile suite tests 320×640, 390×844, 430×932, 768×1024, 812×375, and
1440×900. It mounts the real editor and Settings pages, captures the actual
Preview HTML and ZIP adapter outputs, and runs the resulting games. Storage is
isolated in memory and ZIP downloads are stubbed. No framework is required.

`?touch=1` forces only the controls' CSS visibility; it does not emulate a phone
browser. Pointer press/release/cancel, multitouch, keyboard coexistence, pause,
reset, and destruction are tested separately in the runtime suite. To leave the
frames on screen for inspection, use `?inspect=390&touch=1` (or another tested width).

The existing gameplay tests now explicitly call Play before acting. Their
assertions are retained; acting on an initially paused runtime is no longer valid.

Run `git diff --check` as the final whitespace check.

## Manual test matrix

Use a disposable project. Browser responsive mode is sufficient to run this
checklist; a real touch-device pass remains useful before promotion.

| Environment | Steps | Expected result |
| --- | --- | --- |
| Desktop Chrome, about 1440×900 | Add ASCII, click/select, drag and release. Right-click an object, then use Edit Properties. | Familiar floating panels; movement stops on release; both property paths work; popover stays in the viewport. |
| Desktop keyboard | Save a scene with one Main Player, open Settings → Preview, hold WASD. | Preview autoplays; keyboard movement works; touch pad is hidden on a mouse-only device. |
| Phone portrait, 320 and 375–430 wide | Scroll the page; use Canvas, Add, Items / Scenes, Global; expand/collapse panels. | No page-wide horizontal scrolling; all editor areas remain reachable; controls are comfortably sized. |
| Phone add/select/drag | Add ASCII, tap it, drag it, release, then scroll outside the object. Cancel an active drag by switching apps or interrupting the gesture. | Selection is visible; coordinates update correctly on the scaled canvas; release/cancel stops movement; normal page scrolling works. |
| Phone properties | Select an item → Edit Properties. Change name, colors, click/contact actions, and Main Player; use Back to Canvas. | Properties remain reachable without right-click or hover. Selecting a second Main Player unmarks the first; unchecking permits zero. |
| Phone invisible object | Mark selected object invisible; return to canvas. Select it again from Items / Scenes, drag its outlined handle, then delete it. | Art remains transparent; selected outline is visible and draggable; deletion clears selection. |
| Phone scene workflow | Name and Save Scene, change the workspace, then load from the scene list. Reload the page after an explicit Save Scene. Clear Canvas in a disposable workspace. | Saved scene is restored; edits are not automatically saved; explicit Save Scene survives reload; Clear Canvas clears the workspace. |
| Phone Settings | Navigate to Settings, set dimensions/location/drag, save, return, and revisit. Export/import the project JSON. | Dimensions and placement options round-trip; every control fits; game state is preserved. |
| Phone Preview | Launch Preview, hold/release each direction, use two fingers, cancel a touch, open/close Inventory. | Game fits; controls sit below game content; movement stops correctly; Inventory works without a keyboard binding. |
| Phone landscape | Rotate editor and Preview; repeat dragging and directional controls. | Canvas rescales without changing saved coordinates; gameplay and controls stay visible and reachable. |
| Runtime lifecycle | While moving, Pause. Try WASD, pad, reward/door clicks, and Inventory. Play again, then Reset. | Paused gameplay is suppressed. Play needs fresh input; Reset restores initial state and stays paused. |
| Runtime gameplay | Test scenes with zero/one Main Player, solid/pass-through objects, contact rewards, click rewards, deletion, and scene transitions. | Movement/collision/rewards remain consistent in Preview and Export; contact is collision, not a touchscreen gesture. |
| Standalone export | Download/unzip `gameInsert.zip`, load it through `tests/export-host.html`, and repeat runtime checks. Choose several of the nine locations; enable dragging and move the widget to each edge. | No editor storage dependency; widget is anchored as configured, scales to fit, and stays inside the viewport. Dragging uses the dedicated Move game handle. |

## Settings and scope

- Location is a 1–9 grid for the **exported widget**, not a scene coordinate.
- Allow Drag adds a dedicated Move game handle supporting mouse, touch, and arrow keys.
- Both values use the existing `editorSettings` object (`position`, `allowDrag`).
  They survive settings save/load and project JSON import/export. Unsaved form values
  are also used by the explicit game export action.
- Preview remains a document-flow game with Play/Pause/Reset; widget placement
  applies to the exported host page.
- Runtime controls and fit/placement are generated by the shared factory. No mobile
  control fields, schema version, migration, framework, or persistence rewrite was added.
- The checked-in `gameInsert` sample was regenerated with its existing project data.

## Release limits

No failing automated check was found in this phase. These checks are Chromium-based;
physical iOS/Android gestures, browser popup policies, and the real ZIP download
are still manual verification items. Export ZIP creation continues to load JSZip
from the existing CDN. Host pages should include a device-width viewport meta tag.
The separately planned persistence/schema hardening remains outside this phase.
