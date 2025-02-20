// script.js

// Global variables
let selectedAsciiArt = null; // Track selected ASCII art for context menu
let scenes = { default: [] }; // Initialize with default scene
let currentScene = 'default'; // Default scene
let asciiObjects = []; // Track individual ASCII objects with their properties
let gameCurrency = 0; // Initialize game currency for reward actions
let keyBindings = {};// Store keybindings in an object

// Add ASCII Art to Display
document.getElementById('add-ascii-art').addEventListener('click', () => {
    const asciiArt = document.getElementById('ascii-input').value;
    if (asciiArt) {
        addAsciiArt(asciiArt);
        refreshItemsInSceneBox(); // Update the list of objects in the scene
        document.getElementById('ascii-input').value = ''; // Clear the input after adding

    } else {
        alert('Please enter some ASCII art!');
    }
    
});

// Save Scene
document.getElementById('save-scene').addEventListener('click', () => {
    const sceneName = document.getElementById('scene-name').value;
    if (sceneName) {
        saveScene(sceneName); // Save the current scene
        currentScene = sceneName; // Update current scene name global variable
       
        //may need this later to just copy the objects and not the references
        // let asciiObjectsCopy = JSON.parse(JSON.stringify(asciiObjects));

        //set textbox input with id scene-name to empty string
        document.getElementById('scene-name').value = '';
        
        refreshItemsInSceneBox(); // Update the list of objects in the scene
    } else {
        alert('Please enter a scene name!');
    }
});

// Load Scene
document.getElementById('load-scene').addEventListener('click', () => {
    const sceneName = document.getElementById('scene-name').value;
    if (sceneName) {
        loadScene(sceneName); // Load the specified scene
        document.getElementById('scene-name').value = ''; // Clear the input after loading
        saveGameState() // Serialize and save the current scenes and game state
        refreshItemsInSceneBox(); // Update the list of objects in the scene
    } else {
        alert('Please enter a scene name to load!');
    }
});

// Using this to handle scene changes
const sceneManager = {
    currentScene: 'default', // Keep track of the current scene

    switchToScene(sceneName) {
        loadScene(sceneName); // Load the specified scene
    },

    getAllScenes() {
        // Collect scene data (you can customize this further)
        // detect if there are no scenes return empty array
        if (!document.querySelectorAll('.scene').length) { 
            console.log('No scenes detected');
            return {};
        }
        log('Scenes detected');

        //return a dictionary of scenes {"sceneName": [list of asciiObjects]}
        return Object.fromEntries(
            Array.from(document.querySelectorAll('.scene')).map(scene => {
                return [scene.id, Array.from(scene.querySelectorAll('.ascii-art')).map(art => {
                    return {
                        id: art.id,
                        content: art.innerText,
                        style: art.style.cssText
                    };
                })];
            })
        );
    },

    loadScenes(scenesInput) {
        // Load scene data it is in the form of a dictionary of scenes, the layout is scenesInput: {"sceneName": [list of asciiObjects], "sceneName2": [list of asciiObjects], etc}
        // Loop through the scenes and load them into the document adding them to global scenes object
        //only save the scenes to the global scenes, do not actually load a specific scene here, we will call switchToScene to load the scene not in this function
        //gets scenes from scenesInput from the local Storage and saves them to global scenes object
        // the variable is layed out scenesInput: {"sceneName": [list of asciiObjects], "sceneName2": [list of asciiObjects], etc}
        for (const [sceneName, asciiArtList] of Object.entries(scenesInput)) {
            scenes[sceneName] = asciiArtList;
        }
        
    }


};

// Add ASCII Art Object to the Display
function addAsciiArt(asciiArt, left = null, top = null, color = null) {
    const artDiv = document.createElement('div');
    artDiv.classList.add('ascii-art');
    artDiv.innerText = asciiArt;
    artDiv.style.cursor = 'pointer';
    artDiv.style.position = 'absolute';
    artDiv.style.whiteSpace = 'pre';
    artDiv.style.color = color || 'black';

    const container = document.getElementById('ascii-display');
    if (left !== null && top !== null) { // If left and top are provided
        artDiv.style.left = `${left}px`; 
        artDiv.style.top = `${top}px`;
    } else { // Center the object if no position is provided
        const containerRect = container.getBoundingClientRect();
        artDiv.style.left = `${(containerRect.width - 100) / 2}px`;
        artDiv.style.top = `${(containerRect.height - 50) / 2}px`;
    }

    const asciiObject = {
        id: Date.now(),  // Add a unique ID using timestamp
        element: artDiv, // Reference to the DOM element
        ascii: asciiArt, // ASCII art content string
        left: artDiv.style.left , // Save the initial position from the left
        top: artDiv.style.top, // Save the initial position from the top
        color: color || 'black',
        hoverColor: null,
        clickColor: null,
        clickable: false,
        giveCurrency: false,
        switchScene: false,
        giveObject: false,
        targetScene: null,
        targetObjectName: null,
        itemName: '' // Initialize item name as empty string
    };

    asciiObjects.push(asciiObject); // Add the object to the global array of objects in current scene

    // Hover effect (Change color on hover)
    artDiv.addEventListener('mouseenter', () => {
        if (asciiObject.hoverColor) {
            artDiv.style.color = asciiObject.hoverColor;
        }
    });
    // Reset color on mouse leave
    artDiv.addEventListener('mouseleave', () => {
        artDiv.style.color = asciiObject.color; // Reset to original color
    });

    // Handle clicks to open context menu and select the object
    artDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        // showContextMenu(e.clientX, e.clientY, asciiObject); // For the context menu
        selectAsciiObject(asciiObject);

        // Change color on click if a clickColor is set
        if (asciiObject.clickColor) {
            artDiv.style.color = asciiObject.clickColor;
        }
    }
);

    // Draggable functionality
    artDiv.addEventListener('mousedown', (e) => {
        const rect = artDiv.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const mouseMoveHandler = (event) => {
            artDiv.style.left = `${event.clientX - containerRect.left - offsetX}px`;
            artDiv.style.top = `${event.clientY - containerRect.top - offsetY}px`;
        };

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });

    container.appendChild(artDiv);

    refreshItemsInSceneBox(); // Update the panel
}


function saveScene(sceneName) {
    const artArray = asciiObjects.map(art => ({
        ascii: art.ascii,
        left: parseFloat(art.element.style.left), // Save as a number
        top: parseFloat(art.element.style.top), // Save as a number
        color: art.color,
        hoverColor: art.hoverColor || null,
        clickColor: art.clickColor || null,
        clickable: art.clickable || false,
        giveCurrency: art.giveCurrency || false,
        switchScene: art.switchScene || false,
        giveObject: art.giveObject || false,
        targetScene: art.targetScene || null,
        targetObjectName: art.targetObjectName || null,
        itemName: art.itemName || '' // Save the item's name
    })); // this is in the form artArray = [{ascii: "asciiArt", left: 0, top: 0, color: "black", etc}, {ascii: "asciiArt2", left: 0, top: 0, color: "black", etc}]
    scenes[sceneName] = artArray;
    alert(`Scene '${sceneName}' saved!`);
}

function loadScene(sceneName) {
    if (scenes[sceneName]) {
        document.getElementById('ascii-display').innerHTML = '';
        asciiObjects = []; // Clear existing objects
        scenes[sceneName].forEach(({ ascii, left, top, color, hoverColor, clickColor, clickable, giveCurrency, switchScene, giveObject, itemName, targetScene, targetObjectName }) => {   
            // Add ASCII art to the scene
            addAsciiArt(ascii, left, top, color);
            const artObject = asciiObjects[asciiObjects.length - 1]; //this 
            
            // // Assign additional properties
            Object.assign(artObject, { hoverColor, clickColor, clickable, giveCurrency, switchScene, giveObject, itemName, targetScene, targetObjectName });
            
            const artDiv = artObject.element;
            artDiv.style.color = color; // Set the color of the ASCII art

            // Apply hover and click events (clearing previous ones if necessary)
            artDiv.onmouseenter = hoverColor ? () => { artDiv.style.color = hoverColor; } : null;
            artDiv.onmouseleave = hoverColor ? () => { artDiv.style.color = artObject.color; } : null;

            artDiv.onmousedown = clickColor ? () => { artDiv.style.color = clickColor; } : null;
            artDiv.onmouseup = clickColor ? () => { artDiv.style.color = artObject.color; } : null;
        });

        currentScene = sceneName; // Update the current scene in global variable

        // alert(`Scene '${sceneName}' loaded!`); // Alert the user that the scene was loaded
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
    }
}

document.getElementById('delete-selected-item').addEventListener('click', () => {
    if (selectedAsciiArt) {
        deleteAsciiArt(selectedAsciiArt);
        selectedAsciiArt = null; // Clear the selection after deletion
        clearPropertyBox();
        refreshItemsInSceneBox();
    } else {
        alert('No ASCII art selected to delete!');
    }
});

// This is a context menu function that is not used in this project currently
// pops up a box with options like delete at the object clicked, but it doesn't work now
function showContextMenu(x, y, asciiObject) { 
    const contextMenu = document.getElementById('context-menu');
    const artDiv = asciiObject.element; // Reference to the clicked object
    const artRect = artDiv.getBoundingClientRect(); // Get the position of the clicked object

    // Adjust the menu position relative to the object
    const offsetX = 10; // Optional offset to prevent overlap
    const offsetY = 10; // Optional offset to prevent overlap

    // Set the position of the context menu relative to the clicked object
    contextMenu.style.left = `${artRect.left + offsetX}px`; // Adjust the position from the left
    contextMenu.style.top = `${artRect.top + offsetY}px`; // Adjust the position from the top
    contextMenu.style.display = 'block';  

    // Remove previous listeners to prevent duplication
    const deleteItemButton = document.getElementById('delete-item');
    const deleteSelectedButton = document.getElementById('delete-selected-item');

    deleteItemButton.replaceWith(deleteItemButton.cloneNode(true));
    deleteSelectedButton.replaceWith(deleteSelectedButton.cloneNode(true));

    // Reattach event listeners to new cloned buttons
    document.getElementById('delete-item').addEventListener('click', () => {
        if (selectedAsciiArt) {
            deleteAsciiArt(selectedAsciiArt);
            selectedAsciiArt = null; // Clear the selection after deletion
            clearPropertyBox();
            refreshItemsInSceneBox();
        } else {
            alert('No ASCII art selected to delete!');
        }
    });

    document.getElementById('delete-selected-item').addEventListener('click', () => {
        if (selectedAsciiArt) {
            deleteAsciiArt(selectedAsciiArt);
            selectedAsciiArt = null; // Clear the selection after deletion
            clearPropertyBox();
            refreshItemsInSceneBox();
        } else {
            alert('No ASCII art selected to delete!');
        }
    });

    document.getElementById('change-color').onclick = () => {
        changeAsciiColor(asciiObject);
        contextMenu.style.display = 'none';
    };
}

// Clear Property Box
function clearPropertyBox() {
    document.getElementById('property-box').querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
}

// Delete ASCII art
function deleteAsciiArt(asciiObject) {
    const index = asciiObjects.indexOf(asciiObject);
    if (index !== -1) {
        asciiObjects.splice(index, 1);
        asciiObject.element.remove();
    }
}

// Change ASCII art color (callable from both UI and context menu)
function changeAsciiColor(asciiObject, specificColor = null) {
    const newColor = specificColor || prompt("Enter a new color for the ASCII art:");
    if (newColor) {
        asciiObject.element.style.color = newColor;
        asciiObject.color = newColor;
    }
}

// Handle ASCII object selection and apply highlight
function selectAsciiObject(asciiObject) {
    // Remove highlight from previously selected object
    if (selectedAsciiArt) {
        selectedAsciiArt.element.classList.remove('flashing-border');
    }

    // Update selected object
    selectedAsciiArt = asciiObject;

    // Add highlight to the currently selected object
    selectedAsciiArt.element.classList.add('flashing-border');

    // Ensure the property box only updates for the selected object
    updatePropertyBox(selectedAsciiArt);

    // Update the highlight in the "Items in Scene" panel
    updateScenePanelHighlight(asciiObject);

    // highlightSelectedListItem(asciiObject);  //Uncommenting removes highlight on panel box but causes error
}

// Update the highlight in the "Items in Scene" panel
function updateScenePanelHighlight(asciiObject) {
    const sceneItems = document.querySelectorAll('.scene-item');
    sceneItems.forEach(item => {
        item.classList.remove('selected-panel-item'); // Remove highlight from all items
    });

    // Find the corresponding item for the selected object
    const targetItem = Array.from(sceneItems).find(item => item.dataset.id === asciiObject.id);
    if (targetItem) {
        targetItem.classList.add('selected-panel-item'); // Highlight the corresponding item
    }
}

// Event listener for document click to close the context menu
document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});

// Update the property box with selected object's properties
function updatePropertyBox(asciiObject) {
    // Update checkbox states
    document.getElementById('clickable').checked = asciiObject.clickable;
    document.getElementById('give-currency').checked = asciiObject.giveCurrency;
    document.getElementById('switch-scene').checked = asciiObject.switchScene;
    document.getElementById('give-object').checked = asciiObject.giveObject;

    // Update Name Text Box
    document.getElementById('item-name').value = asciiObject.itemName;

    // Update color inputs
    const defaultColorInput = document.getElementById('default-color');
    const hoverColorInput = document.getElementById('hover-color');
    const clickColorInput = document.getElementById('click-color');

    let itemNameInput1 = document.getElementById('item-name');

    // Remove existing event listeners by cloning inputs
    const clonedDefaultColorInput = defaultColorInput.cloneNode(true);
    const clonedHoverColorInput = hoverColorInput.cloneNode(true);
    const clonedClickColorInput = clickColorInput.cloneNode(true);

    let clonedItemNameInput = itemNameInput1.cloneNode(true);

    defaultColorInput.replaceWith(clonedDefaultColorInput);
    hoverColorInput.replaceWith(clonedHoverColorInput);
    clickColorInput.replaceWith(clonedClickColorInput);

    itemNameInput1.replaceWith(clonedItemNameInput);

    // Re-assign the updated inputs
    const updatedDefaultColorInput = document.getElementById('default-color');
    const updatedHoverColorInput = document.getElementById('hover-color');
    const updatedClickColorInput = document.getElementById('click-color');

    let updatedNameInput = document.getElementById('item-name');

    // Set the current color values for the selected object
    updatedDefaultColorInput.value = asciiObject.color || '#000000';
    updatedHoverColorInput.value = asciiObject.hoverColor || '#000000';
    updatedClickColorInput.value = asciiObject.clickColor || '#000000';

    updatedNameInput.value = asciiObject.itemName || '';

    // Event listeners for color inputs to update properties dynamically
    updatedDefaultColorInput.addEventListener('input', function () {
        if (selectedAsciiArt) {
            const newColor = this.value; // Get the selected color value
            selectedAsciiArt.element.style.color = newColor; // Update the element's color
            selectedAsciiArt.color = newColor; // Save the color to the object's properties
        }
    });

    updatedHoverColorInput.addEventListener('input', function () {
        asciiObject.hoverColor = this.value;
    });

    updatedClickColorInput.addEventListener('input', function () {
        asciiObject.clickColor = this.value;
    });

    // Event listener for "clickable" checkbox
    const clickableCheckbox = document.getElementById('clickable');
    clickableCheckbox.addEventListener('change', () => {
        if (clickableCheckbox.checked) {
            enableClickable(asciiObject); // Call the function to enable "clickable"
        } else {
            disableClickable(asciiObject); // Call the function to disable "clickable" (if implemented)
        }
    });

    // Listen for changes in the item name input box
    updatedNameInput.addEventListener('input', function() {
        // Dynamically update the object's name as you type
        asciiObject.itemName = updatedNameInput.value;

        refreshItemsInSceneBox();
        
    });
}

// New function to handle enabling the "clickable" property and prompting the user
// function enableClickable(asciiObject) {
//     // If the targetObjectName already exists, don't prompt the user again
//     if (asciiObject.targetObjectName) {
//         alert(`Clickability already set for target: ${asciiObject.targetObjectName}`);
//         return; // Skip the prompt if targetObjectName already exists
//     }

//     // Alert user and prompt for target object name when the "clickable" property is enabled
//     const targetObjectName = prompt('Enter the target object name to enable clickability');
//     if (targetObjectName) {
//         asciiObject.targetObjectName = targetObjectName; // Save target object name to the ASCII object
//         //set item-name here for better readability if possible to targetObjectName
//         alert(`Clickability enabled for target: ${targetObjectName}`);
//     } else {
//         // If user cancels or enters nothing, disable clickable again
//         asciiObject.clickable = false;
//         document.getElementById('clickable').checked = false;
//         alert('Clickability was not enabled.');
//     }
// }

// Save properties
document.getElementById('save-properties').addEventListener('click', () => {
    if (selectedAsciiArt) {
        const clickable = document.getElementById('clickable').checked;
        const giveCurrency = document.getElementById('give-currency').checked;
        const switchScene = document.getElementById('switch-scene').checked;
        const giveObject = document.getElementById('give-object').checked;

        selectedAsciiArt.clickable = clickable;
        selectedAsciiArt.giveCurrency = giveCurrency;
        selectedAsciiArt.switchScene = switchScene;
        selectedAsciiArt.giveObject = giveObject;

        if (switchScene) {
            selectedAsciiArt.targetScene = prompt("Enter the target scene name for transition:");
        }

        if (giveObject) {
            selectedAsciiArt.targetObjectName = prompt("Enter the target object name to enable clickability:");
        }

        // Ensure the property box only updates for the selected object
        updatePropertyBox(selectedAsciiArt);

        // Update the highlight in the "Items in Scene" panel
        updateScenePanelHighlight(asciiObject);
        
    }
});

// Handle click actions for clickable objects
function performClickableActions(asciiObject) {
    if (asciiObject.clickable) {
        if (asciiObject.giveCurrency) {
            gameCurrency += 10; // Award example currency amount
            alert(`You received currency! Total: ${gameCurrency}`);
        }
        if (asciiObject.switchScene && asciiObject.targetScene) {
            loadScene(asciiObject.targetScene);
        }
        if (asciiObject.giveObject && asciiObject.targetObjectName) {
            const targetObject = findObjectByName(asciiObject.targetObjectName);
            if (targetObject) {
                targetObject.clickable = true;
                alert(`Object "${asciiObject.targetObjectName}" is now clickable!`);
            }
        }
    }
}

// Find an ASCII object by name
function findObjectByName(name) {
    return asciiObjects.find(obj => obj.targetObjectName === name);
}

// Enable or disable properties based on clickability
document.getElementById('clickable').addEventListener('change', function() {
    const isChecked = this.checked;
    document.getElementById('give-currency').disabled = !isChecked;
    document.getElementById('switch-scene').disabled = !isChecked;
    document.getElementById('give-object').disabled = !isChecked;
});

// Event listener for adding custom keybindings
// Add a new keybinding
document.getElementById('add-key-binding').addEventListener('click', () => {
    const key = document.getElementById('key-input').value;
    const action = document.getElementById('action-select').value;

    if (key && action) {
        keyBindings[key] = action; // Add to keyBindings object
        updateKeyBindingsList(); // Refresh the keybindings list
        document.getElementById('key-input').value = ''; // Clear input field
    } else {
        alert('Please enter a key and select an action.');
    }
});

//Updating items in scene box

// Update the list of objects in the scene
function updateItemsInSceneBox() {
    const objectList = document.getElementById('object-list');
    objectList.innerHTML = ''; // Clear the current list

    asciiObjects.forEach((asciiObject, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = asciiObject.itemName || `Object ${index + 1}`;
        listItem.dataset.index = index;

        // Select the object when clicked
        listItem.addEventListener('click', () => {
            selectAsciiObject(asciiObject);
            highlightSelectedListItem(listItem);
        });

        objectList.appendChild(listItem);
    });
}

// Highlight the selected object in the list
function highlightSelectedListItem(selectedItem) {
    const listItems = document.querySelectorAll('#object-list li');
    listItems.forEach(item => item.classList.remove('selected'));
    // selectedItem.classList.add('selected'); // for highlighting object in objects in scene
}


// Update the list of keybindings
function updateKeyBindingsList() {
    const keyBindingsList = document.getElementById('keybindings-ul');
    keyBindingsList.innerHTML = ''; // Clear the current list

    Object.entries(keyBindings).forEach(([key, action]) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${key} for ${action}`;
        keyBindingsList.appendChild(listItem);
    });
}

// Call this function whenever an object is added, removed, or updated
function refreshItemsInSceneBox() {
    updateItemsInSceneBox();
    updateKeyBindingsList();
}


// Listen for keydown events globally to trigger actions
document.addEventListener('keydown', (event) => {
    const key = event.key;  // Get the key that was pressed
    if (keyBindings[key]) {
        const action = keyBindings[key];
        alert(`Action triggered for '${key}': ${action}`);
        performAction(action); // Trigger the action associated with the keybinding
    }
});

// used to swap to settings page
document.getElementById('settings-button').addEventListener('click', () => {
    saveGameState() // Serialize and save the current scenes and game state
    
    //wait 5 seconds before navigating to settings.html
    setTimeout(() => {
        window.location.href = 'settings.html';
    }, 5000);
    // Navigate to settings.html
    window.location.href = 'settings.html';
});

// used to load where left off when returning/loading site
window.addEventListener('load', () => {
    loadGameState() // Load the saved game state from localStorage
    refreshItemsInSceneBox(); // Refresh the items in the scene box

});

// function for clearing local storage using button with id clear-storage
document.getElementById('clear-storage').addEventListener('click', () => {
    localStorage.clear();
    alert('Local storage cleared!');
    loadScene('default'); // Load the default scene after clearing local storage
    keyBindings = {}; // Clear keybindings
    window.location.reload();
    refreshItemsInSceneBox(); // Refresh the items in the scene box
});

// function that can be callable to save the game state from anywere, likely will me added when saving a scene.
function saveGameState() {
    const gameState = {
        sceneList: scenes, // Save all scenes as a dictionary sceneList = {"sceneName": [list of asciiObjects], "sceneName2": [list of asciiObjects], etc}
        saveCurrentScene: currentScene,         // Save which scene is currently active
        // playerSettings: playerSettings,     // Save any other global settings if necessary
        saveCustomKeyBindings: keyBindings // Save the custom keybindings
    };
    //give localStorage a key of gameState and save the gameState object as a string
    localStorage.setItem('gameState', JSON.stringify(gameState));
    // alert the user how many scenes are saved
    alert(`Saved ${Object.keys(scenes).length} scenes to local storage!`);
}

// Function to load the game state from local storage
function loadGameState() {
    // Load the saved game state from localStorage
    const savedGameState = localStorage.getItem('gameState');
    //make it so scenemanager.getAllScenes() returns an empty array if no scenes are detected, otherwise save the scenes
    if (savedGameState) {
        const gameState = JSON.parse(savedGameState);
        sceneManager.loadScenes(gameState.sceneList);
        currentScene = gameState.saveCurrentScene;
        loadScene(currentScene);
        keyBindings = gameState.saveCustomKeyBindings;

        // playerSettings = gameState.playerSettings; // Load any other global settings if necessary
        alert('Game state loaded successfully!');
        //alert user which scene they are in and what scenes are available
        alert(`Current Scene: ${currentScene}\nAvailable Scenes: ${Object.keys(scenes).join(', ')}`);
        //this alert displays we are in a scene that was previously saved but the scene doesn't display or load items from it
        
    } else {
        alert('No saved game state found.');
    }
}

// Function to perform actions based on the keybinding
function performAction(action) {
    switch (action) {
        case 'toggleInventory':
            toggleInventory();
            break;
        case 'openMap':
            openMap();
            break;
        case 'customAction':
            customAction();
            break;
        default:
            alert(`No defined action for ${action}`);
    }
}

// Example actions for testing
function toggleInventory() {
    alert("Inventory toggled!");
}

function openMap() {
    alert("Map opened!");
}

function customAction() {
    alert("Custom action triggered!");
}


// Refresh items in scene box when the page loads
refreshItemsInSceneBox();