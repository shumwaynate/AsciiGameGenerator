// script.js

// Global variables
let selectedAsciiArt = null; // Track selected ASCII art for context menu
const scenes = { default: [] }; // Initialize with default scene
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
        saveScene(sceneName);
        currentScene = sceneName; // Update current scene
        document.getElementById('scene-name').value = ''; // Clear the scene name after saving
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
        refreshItemsInSceneBox(); // Update the list of objects in the scene
    } else {
        alert('Please enter a scene name to load!');
    }
});
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
    if (left !== null && top !== null) {
        artDiv.style.left = `${left}px`;
        artDiv.style.top = `${top}px`;
    } else {
        const containerRect = container.getBoundingClientRect();
        artDiv.style.left = `${(containerRect.width - 100) / 2}px`;
        artDiv.style.top = `${(containerRect.height - 50) / 2}px`;
    }

    const asciiObject = {
        element: artDiv,
        ascii: asciiArt,
        left: artDiv.style.left,
        top: artDiv.style.top,
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
    asciiObjects.push(asciiObject);

    // Hover effect (Change color on hover)
    artDiv.addEventListener('mouseenter', () => {
        if (asciiObject.hoverColor) {
            artDiv.style.color = asciiObject.hoverColor;
        }
    });
    artDiv.addEventListener('mouseleave', () => {
        artDiv.style.color = asciiObject.color; // Reset to original color
    });

    // Handle clicks to open context menu and select the object
    artDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY, asciiObject);
        selectAsciiObject(asciiObject);

        // Change color on click if a clickColor is set
        if (asciiObject.clickColor) {
            artDiv.style.color = asciiObject.clickColor;
        }
    });

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
        targetObjectName: art.targetObjectName || null
    }));
    scenes[sceneName] = artArray;
    alert(`Scene '${sceneName}' saved!`);
}

function loadScene(sceneName) {
    if (scenes[sceneName]) {
        document.getElementById('ascii-display').innerHTML = '';
        asciiObjects = []; // Clear existing objects
        scenes[sceneName].forEach(({ ascii, left, top, color, hoverColor, clickColor, clickable, giveCurrency, switchScene, giveObject, targetScene, targetObjectName }) => {
            // Add ASCII art to the scene
            addAsciiArt(ascii, left, top, color);
            const artObject = asciiObjects[asciiObjects.length - 1];
            
            // Assign additional properties
            Object.assign(artObject, { hoverColor, clickColor, clickable, giveCurrency, switchScene, giveObject, targetScene, targetObjectName });
            
            const artDiv = artObject.element;
            artDiv.style.color = color;

            // Apply hover and click events (clearing previous ones if necessary)
            artDiv.onmouseenter = hoverColor ? () => { artDiv.style.color = hoverColor; } : null;
            artDiv.onmouseleave = hoverColor ? () => { artDiv.style.color = artObject.color; } : null;

            artDiv.onmousedown = clickColor ? () => { artDiv.style.color = clickColor; } : null;
            artDiv.onmouseup = clickColor ? () => { artDiv.style.color = artObject.color; } : null;
        });

        currentScene = sceneName;
        alert(`Scene '${sceneName}' loaded!`);
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
    }
}




function showContextMenu(x, y, asciiObject) {
    const contextMenu = document.getElementById('context-menu');
    const artDiv = asciiObject.element; // Reference to the clicked object
    const artRect = artDiv.getBoundingClientRect(); // Get the position of the clicked object

    // Adjust the menu position relative to the object
    const offsetX = 10; // Optional offset to prevent overlap
    const offsetY = 10; // Optional offset to prevent overlap

    // Set the position of the context menu relative to the clicked object
    contextMenu.style.left = `${artRect.left + offsetX}px`;
    contextMenu.style.top = `${artRect.top + offsetY}px`;
    contextMenu.style.display = 'block';

    // Hide the delete and change color buttons when objects are clicked
    document.getElementById('delete-item').style.display = 'none';
    // document.getElementById('delete-selected-item').style.display = 'none';
    document.getElementById('change-color').style.display = 'none';

    // Example: Make buttons reappear later (if needed for future functionality)
    // You can add a flag here to toggle this based on your requirements.
    // For example:
    // if (!hideContextMenuButtons) {
    //     document.getElementById('delete-item').style.display = 'block';
    //     document.getElementById('delete-selected-item').style.display = 'block';
    //     document.getElementById('change-color').style.display = 'block';
    // }

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

    // Update items box after deleting an object
    document.getElementById('delete-selected-item').addEventListener('click', () => {
        if (selectedAsciiArt) {
            asciiObjects = asciiObjects.filter(obj => obj !== selectedAsciiArt);
            selectedAsciiArt.element.remove();
            selectedAsciiArt = null;
            refreshItemsInSceneBox();
        } else {
            alert('No object selected to delete.');
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
}

// Update the highlight in the "Items in Scene" panel
function updateScenePanelHighlight(asciiObject) {
    const sceneItems = document.querySelectorAll('.scene-item');
    console.log('Update done, items found:', sceneItems.length);
    sceneItems.forEach(item => {
        item.classList.remove('selected-panel-item'); // Remove highlight from all items
        console.log('Checking item:', item.dataset.asciiId, 'against', asciiObject.element.dataset.asciiId);
        
        // Highlight the corresponding panel item
        if (item.dataset.asciiId === asciiObject.element.dataset.asciiId) {
            console.log('Match found:', item);
            item.classList.add('selected-panel-item');
        }
    });

    // Find the corresponding item for the selected object
    // const targetItem = Array.from(sceneItems).find(item => item.dataset.id === asciiObject.id);
    // if (targetItem) {
    //     targetItem.classList.add('selected-panel-item'); // Highlight the corresponding item
    // }
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

    // Update color inputs
    const defaultColorInput = document.getElementById('default-color');
    const hoverColorInput = document.getElementById('hover-color');
    const clickColorInput = document.getElementById('click-color');

    // Remove existing event listeners by cloning inputs
    const clonedDefaultColorInput = defaultColorInput.cloneNode(true);
    const clonedHoverColorInput = hoverColorInput.cloneNode(true);
    const clonedClickColorInput = clickColorInput.cloneNode(true);

    defaultColorInput.replaceWith(clonedDefaultColorInput);
    hoverColorInput.replaceWith(clonedHoverColorInput);
    clickColorInput.replaceWith(clonedClickColorInput);

    // Re-assign the updated inputs
    const updatedDefaultColorInput = document.getElementById('default-color');
    const updatedHoverColorInput = document.getElementById('hover-color');
    const updatedClickColorInput = document.getElementById('click-color');

    // Set the current color values for the selected object
    updatedDefaultColorInput.value = asciiObject.color || '#000000';
    updatedHoverColorInput.value = asciiObject.hoverColor || '#000000';
    updatedClickColorInput.value = asciiObject.clickColor || '#000000';

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
    selectedItem.classList.add('selected');
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