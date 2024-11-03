# AsciiGameGenerator
I am planning to make here a website that will allow a user to create a game or usable widget. This project will allow the user to, after editing, download or copy the .html, .css, and a single script.js file to add the widget to any website .html. I am starting this as a project for one of my college classes.

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

