# AsciiGameGenerator
I am planning to make here a website that will allow a user to create a game or usable widget using ASCII created objects. This project will allow the user to, after editing, download or copy the .html, .css, and a single script.js file to add the widget to any website .html. I am starting this as a project for one of my college classes.

## 🌐 Try It Live

You can launch the live version of the ASCII Game Editor here:

🔗 [AsciiGameGenerator Editor](https://shumwaynate.github.io/AsciiGameGenerator/)

Start creating scenes, test your game, and export it—all right in the browser!


# How To Use

AsciiGameGenerator is a browser-based ASCII game editor that lets users visually build game scenes with interactive ASCII art. It includes a test render window for live previewing, and exports a complete game into a self-contained folder called gameInsert. This folder includes:

game_style.css – handles all game visuals

game_script.js – contains all gameplay logic and embedded game state

game_embed.js – a single injector script

To embed your game on any website, simply place the gameInsert folder in the same directory as your site's index.html, and add the following line in your HTML:

```html
<script src="gameInsert/game_embed.js"></script>
```

# Features

	🎨 Visual Editor – Drag and drop ASCII objects into a scalable game canvas.

	📜 Scene Management – Create, name, save, load, and switch between multiple scenes.

	🖱️ Clickable Objects – Assign actions like scene changes, item giving, and currency rewards to ASCII art.

	🎮 Custom Keybinds – Trigger game actions like inventory or map toggles via user-defined keys.

	🎯 Modular Properties – Toggle visibility, collision, colors (hover/click), and interactivity per object.

	🧠 Context Menu Editing – Right-click objects to quickly edit functionality.

	🧰 Global Settings Panel – Configure RPG settings, currency types, and object libraries.

	💾 Save & Import – Export your entire game state as a .json project file to reopen later.

	🧪 Launch Game Preview – Test your game in a popup window with real-time Play, Pause, and Reset.

	📦 Export as Website Game – One click generates an embeddable gameInsert/ folder with CSS, JS, and inject script to add to any site.

	💾 Your work is saved automatically to your local device using `localStorage`, so you can pick up where you left off.

	📤 Export your full editor project as a `.json` file to switch devices or back up your progress.
	
	🧪 Use the built-in **Import Test Project** button to instantly load a sample game and explore key features in action.


# Not Yet Implemented Features

	🧙 RPG Mechanics (Planned)
		Players will eventually have RPG-style stats like health, mana, strength, and agility.
		 ASCII objects will be able to affect these stats through interaction (e.g., a potion
		  increasing health or a sword increasing strength). These effects will persist across
		   scenes and be tracked in a global player profile.

	🎒 Inventory System (Planned)
		The inventory will be a toggleable popup during gameplay, listing both collected 
		objects and currencies. Developers will be able to configure:

			* What objects are obtainable
			* How they’re displayed
			* Stat-modifying effects on use/equip
			* A persistent toolbar to display selected stats/currencies





## Working Plan and Boring Notes

### 🧭 Original Plan of Attack: 7-Week Build Strategy

This was the original 7-week roadmap created at the start of the project. It laid out a prioritized development structure to ensure a complete and usable ASCII game editor, with weekly goals and milestones.

---

#### **Week 1: Initial Setup and Core Structure**

**Goals:**
- Set up the GitHub repository with project documentation  
- Create initial HTML, CSS, and JavaScript file structure  
- Establish the main 2D render area (canvas or `div`) and layout  

**Key Features:**
- Basic rendering of ASCII art on the canvas  
- Responsive container for embedding in any site  

**Milestone:**  
> Display a centered, scalable ASCII scene.

---

#### **Week 2: Scene and Object Management**

**Goals:**
- Implement creation, saving, and switching between scenes  
- Store scenes in `localStorage` or downloadable `.json`  

**Key Features:**
- Scene creation tools and size adjustments  
- Ability to save/load scenes via UI  

**Milestone:**  
> Successfully save and reload a basic scene.

---

#### **Week 3: Interactive and Persistent Toolbars**

**Goals:**
- Build an editor toolbar for adding items to scenes  
- Add an in-game persistent toolbar (e.g., money, inventory/map, save)  

**Key Features:**
- Toolbar appears across scenes, with toggle options  
- Drag-and-drop to place toolbar elements  

**Milestone:**  
> Functional editor and in-game toolbar system.

---

#### **Week 4: Clickable ASCII Objects with Configurable Actions**

**Goals:**
- Make ASCII objects interactive with custom behaviors  
- Enable object-triggered actions like giving currency or switching scenes  

**Key Features:**
- Clickable ASCII groups with attached logic  
- Simple dropdown/action editors  

**Milestone:**  
> Click to transition scenes or give rewards.

---

#### **Week 5: Custom Keyboard Inputs for In-Game Actions**

**Goals:**
- Support custom keybindings for game actions  
- Map keys like ‘e’ to trigger effects or events  

**Key Features:**
- Flexible key-to-action bindings  
- Trigger custom actions like “drop bomb” or “toggle map”  

**Milestone:**  
> Custom key mapped to in-game object behavior.

---

#### **Week 6: Color Customization for ASCII Objects**

**Goals:**
- Add per-object color options (default, hover, click states)  

**Key Features:**
- Color pickers in the editor  
- Preview changes live in the canvas  

**Milestone:**  
> Dynamic color states for ASCII objects.

---

#### **Week 7: Final Integration, Testing, and Documentation**

**Goals:**
- Run complete functionality tests  
- Write full documentation and examples  
- Ensure export-compatibility and responsive design  

**Key Features:**
- GitHub README with setup and usage guides  
- Code cleanup and embedding optimization  

**Milestone:**  
> A fully functional, exportable ASCII game creator ready for the web.

---



# Questions




# Update: 2-19-2025
I have implemented most of the previous and got basics laid out. I have not added in the persistent and not toolbars for games, however there are property box and items in scene boxes as well as creation and reaction to programmable keyboard inputs. 

Other things implemented (This list quickly made using co-pilot help):
I have implemented the following:
- A scene editor that allows users to create and edit scenes with ASCII objects using text entry.
- State-based color changes for ASCII objects.
- Clickable ASCII objects with configurable actions.
- Custom keyboard inputs for in-game actions.
- The ability to save and load scenes using local storage.
- A basic rendering engine that displays ASCII scenes in a resizable container.
- A simple toolbar for adding objects to scenes.
- Clickable ASCII objects with configurable actions.
- Custom keyboard inputs for in-game actions.
- Color customization for ASCII objects.
- A basic documentation file outlining the project's features and working plan.
- A Game State/ scenes saved reset button that clears the current scenes saved in local storage


I have not implemented the following:
- A persistent toolbar for in-game actions.
- Scene navigation buttons outside of the game, such as a main menu or level select.
- Custom effects like "drop a bomb" or "shoot a fireball."


As far as what I am working on next, I will describe my goals for the next phase of development. I plan to focus on the Exporting and importing functionality as described below.
- Part 1: this will be done in the end with 2 parts. The first being that I want the site to provide the game state and all settings as a downloadable file that an editor can download then import into the website on a different device/browser and from there be able to open back up the project like they never left. This is part 1.          
- Part 2: for part 2, as you know this will hopefully be an exportable file or files that allow the game/thing created to be put in any website anywhere, so these exportables will need to be a file or possibly folder with files in it that can be added straight into any html code and css files on any website. I will expound more on part 2 later, but right now I would like to see how I would incorporate part 1.

# Update: 2-19-2025
Part 1 is done as of now, I am looking into the creation and usage of the exportable game files, here is a blurb of what is needed for the exportable files:
To create a fully exportable and standalone game, the system will generate a set of files—index.html, script.js, and style.css—which can be embedded into any website. The index.html will provide the game’s structure, rendering the ASCII game in a scalable format while ensuring all necessary event listeners for interactions are in place. The script.js will contain all the game logic, including object interactions, scene transitions, keybind functionality, and player actions. The style.css will define the visual aspects of the game, ensuring text formatting and scalable rendering. These files will be generated based on the current project state within the editor and packaged for easy download.

Additionally, the export functionality will need to extract all necessary scene data, object properties, and event handlers from the editor and format them in a way that the exported script.js can initialize correctly. This means ensuring that keybinds remain functional, clickable objects still perform their assigned actions (like scene transitions or giving items), and all game settings persist across reloads. The exported game must be self-contained, meaning it cannot rely on the original editor’s local storage or backend—everything must be embedded directly within the generated files.

For testing and refining the standalone export, a separate game running window within the editor will be created. This window will allow developers to simulate the final game environment with essential controls like play, pause, and reset. The play button will start or continue the game loop, ensuring all interactions function as expected. The pause button will temporarily disable keybinds and object interactions, allowing debugging or scene inspection. The reset button will reload the game state to its initial configuration, allowing quick testing of the game’s starting conditions. This ensures the exported version behaves identically across all environments before being embedded into external websites.

 Synopsis: I am thinking of possible using a new set of 3 temporary files, a .html for the window/game loop to be in, a .css for the css, and a .js that runs standalone for the game. Also I am thinking of also adding one more seperate .js file specifically for converting everything from my editor to the 3 standalone files.

Next steps: 
	Step 1: Implement game_window.html and test basic rendering – Start by creating a minimal version of game_window.html that simply loads and displays ASCII content using hardcoded values.
	Step 2: Implement game_script.js logic for Play, Pause, Reset – Add functionality for handling the game loop, stopping interactions, and resetting the game state.
	Step 3: Ensure game interactions work properly – Gradually implement scene transitions, keybinds, and object interactions within the standalone window.
	Step 4: Build export_converter.js – Once we confirm that game_window.html runs the game properly, we move on to writing the script that extracts data from the editor and formats it into final exportable files.


# Update: 4-10-2025

Properties and Features Update

I have updated some more things and have fixed up some amazing problems I was facing previously! Here is a list of things that I have added(Not all 100% implemented):
- I have moved the properties to be visible and adjustable using a "context menu" that pops up when you click on an object in the scene. This menu allows you to adjust the properties of the object besides name and color.
-The property updates include as listed below, clickable, invisible, enable colors, main player, click/touch change scene(Scene loading into dropdowns implemented), click/touch give currency(Currencies and this functionality not implemented), and click/touch give object(Objects and this functionality not implemented). I will be adding a way to create currencies, objects, and a “player inventory” to hold them later.
- As a big change to account for the way that websites work instead of trying to make a new website/path for a practice/render space, not possible for a realtime website, I decided to make a popout window the size of the requested pixels that will be a practice game area. It will render at the last saved/loaded scene and will be a separate window that can be closed or moved around. This will allow for a more realistic game testing experience. 
- The now called Launch Game Window works as intended, having a play, pause, and reset button. The play button will start the game loop, ensuring all interactions function as expected. The pause button will temporarily disable keybinds and object interactions, allowing debugging or scene inspection. The reset button will reload the game state to its initial configuration, allowing quick testing of the game’s starting conditions.
- Export and import functionality is now working, allowing users to save their game state and settings as a downloadable file. This file can be imported back into the editor, restoring the project to its previous state.


On the way to getting implemented next
-Added a way to create currencies, objects, and a “player inventory” to hold them later
-player inventory?


I've recently expanded the structure of object properties within my game editor to support more robust and game-like behavior. Basic properties like clickable, visible, and main player are now formalized as toggleable states. Visibility now ties to transparency, while "main player" designates which object receives keyboard controls. A new collision property has been introduced to determine whether other objects can pass through. Color behavior has also been modularized into sub-properties—default, hover, and click—each with a toggle for activation and a color value, allowing for more dynamic interactions without visual edits in the context menu itself.

More complex behavior has also been integrated. Scene switching can now occur through either click or touch triggers, depending on whether the object is clickable or being contacted by the main player. Similarly, giving currency or objects has been enhanced to include a list selection of available resources, amount input (for currency), and an optional setting to delete the source object after transfer. These features can be triggered on click or touch depending on the object's configuration and the player's interaction.

All these properties are being saved in a structured and modular format, matching the revised object schema and maintaining backward compatibility with the rest of the editor. The context menu has been adapted to reflect each configurable property in its own row, with dropdowns, inputs, and checkboxes used as appropriate. Default states are false to prevent unintended behaviors, with exceptions made for properties that assume deletion after use (like giving items or currency). Systems for player inventory and currency creation are planned for upcoming phases, and these foundational structures ensure they will integrate smoothly.

Next I would like to implement 2 new features but they will require many new features to start them. I would like to start by taking a step back, with this project I want it to range from a simple score count and/or timer based game, to a game just about solving a puzzle with no score or time features, ranging to an rpg type game with just the one character that might have score or time or player aspects (like damage or health) and/or currencies(maybe different types and multiple) and/or objects that a player can get( to be addeed to a player inventory and/or adjust player aspects/stats) and/or a full like inventory to hold items(allowing equipping removing and seeing currencies and such) and or some sort of persistent like toolbar(this would be in any scene where it is added and hold any stats or currencies that would be customizable in the editor).        Now of all those things many things are implemented but the hardest is yet to come in terms of code. I would like to implement into the game state saving probably some sort of other item/dictionary to hold things that will be persisting through scenes.   Next thought is I am thinking of splitting of the keybind creation out of the Property Box and making another 3rd seperate box that would handle creation if big game persisting objects/functionality. This would include keybind creation(other functionality based around specific keybinds to be added later), MAybe just a Enable RPG spot here that creates a rpg mechanics/incorporates them (maybe adding health, damage, a toolbar , and maybe a couple keybinds?), creating currencies and setting starting values(will discuss currencie organization/structuring later), creating objects(adjusting functionality/possible ascii images created to represent the objects may be implemented unsure), Enabling/creating a sort of toolbar(as per previous to hold and display some if not all player stats) and the making of a player inventory(maay include a coded inventory only, or maybe the creation of a inventory scene perhaps? Or maybe like the context menu a pop up menu like the context menu but it only will open in game time and cover all or most of the render area stopping all time for the game in render to reflect other game pause logic). These are things I am thinking to add.

# Update: 5-26-2025

After tinkering and adjusting the window of the game I have finished, for now, the export game to a folder functionality. This will allow the user to export the game to a folder with all the files needed to run the game in a browser. The idea of exporting the game into a standalone website folder—gameInsert—is central to making the AsciiGameGenerator practical and widely usable. By packaging the complete game into modular files (game_style.css, game_script.js, and game_embed.js), users can embed their creations into any existing HTML site with a single script tag. This approach eliminates dependency on the original editor or browser storage, ensuring the game runs independently and consistently. It also empowers creators to share, host, or publish their games anywhere on the web with minimal setup, making the editor not just a development tool but a full pipeline for deployment.

Currently the export functionality sets the game on the bottom right of the website its added to, but this is adjustable in the game_style.css file. The game_embed.js file will handle the loading of the game and the game_script.js file will handle all the game logic and functionality. The game_style.css file will handle all the styling of the game and its elements.

I will possible look into creating a UI for the settings website for adjusting the placement of the game in the website or if I want to make the game be draggable in the website. I may also look into making the game be able to be resized in the website, but this will take some time to implement and test.