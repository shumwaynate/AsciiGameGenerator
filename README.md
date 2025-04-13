# AsciiGameGenerator
I am planning to make here a website that will allow a user to create a game or usable widget using ASCII created objects. This project will allow the user to, after editing, download or copy the .html, .css, and a single script.js file to add the widget to any website .html. I am starting this as a project for one of my college classes.

# Working Plan Stretches

Here’s a revised 7-week plan to guide us toward implementing all the features I've outlined for the ASCII generative application. This plan organizes tasks by priority, with achievable milestones each week, ensuring a steady build-up to the complete functionality.

## Week 1: Initial Setup and Core Structure

Goals:

	•	Set up the GitHub repository with project documentation.
 
	•	Create the initial HTML, CSS, and JavaScript file structure.
 
	•	Establish the main 2D render area (canvas or div) and build the persistent layout.
 
Key Features:

	•	Basic rendering of ASCII art in the main canvas.
 
	•	Scalable/responsive container setup to allow embedding on other websites.
 
Milestone: Successfully display a simple, centered ASCII scene that resizes based on the container dimensions.

## Week 2: Scene and Object Management

Goals:

	•	Implement the framework for creating, saving, loading, and switching between scenes.
 
	•	Set up scene storage using localStorage and/or downloadable JSON files.
 
Key Features:

	•	Editor functionality to create new scenes, adjust scene size, and position objects.
 
	•	Ability to save and load scenes.
 
Milestone: Ability to save a basic scene with objects and reload it on editor load.

## Week 3: Interactive and Persistent Toolbars

Goals:

	•	Develop an editor toolbar for creating and adding items to scenes.
 
	•	Implement the in-game toolbar (money counter, save/load button, inventory/map buttons).
 
Key Features:

	•	Ability to add the in-game toolbar and make it persist across scenes, with an option to hide it per scene.
 
	•	Drag-and-drop functionality for adding items from the editor toolbar into the scene.
 
Milestone: Editor toolbar functions to add elements to scenes; in-game toolbar can display persistent data like money count.

## Week 4: Clickable ASCII Objects with Configurable Actions

Goals:

	•	Enable ASCII characters or groups to function as clickable objects with custom actions.
 
	•	Implement configurable actions like granting items, adding currency, navigating to scenes, or displaying text.

Key Features:

	•	Clickable ASCII groups with a simple action editor.
 
	•	Scene navigation buttons.
 
Milestone: Scene elements can be clicked, triggering basic actions like scene transitions or displaying a message.

## Week 5: Custom Keyboard Inputs for In-Game Actions

Goals:

	•	Implement custom keyboard input bindings, allowing users to assign keys to specific actions (e.g., ‘e’ for an explosion).
 
	•	Integrate these bindings with existing objects and actions.
 
Key Features:

	•	Keyboard event listeners that trigger assigned actions.
 
	•	Support for custom effects like “drop a bomb” or “shoot a fireball.”
Milestone: Users can configure a key to trigger a specific action for selected objects in-game.


## Week 6: Color Customization for ASCII Objects

Goals:

	•	Implement color settings for individual ASCII characters and groups.
 
	•	Set up state-based color changes (default, hover, and click).
 
Key Features:

	•	Color selection tools in the editor, supporting different states.
 
	•	Preview of color changes in the render area.
 
Milestone: Users can assign colors to ASCII objects, with colors changing on hover and click events.

## Week 7: Final Integration, Testing, and Documentation

Goals:

	•	Conduct thorough testing of all features to ensure smooth functionality.
 
	•	Write comprehensive documentation and create usage examples.
 
	•	Perform any final adjustments or optimizations for embedding and scaling.
 
Key Features:

	•	Documentation on GitHub covering installation, configuration, and usage.
 
	•	Bug fixes and improvements based on testing.
 
Milestone: Fully functional, documented application ready for embedding on any website.



# Features And Questions

## Features

Currently scenes.json Is impenmented but meant to later be replaced with a user database. It currentely will be used to save scenes.



## Questions



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