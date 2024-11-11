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
    } else {
        alert('Please enter a scene name!');
    }
});

// Load Scene
document.getElementById('load-scene').addEventListener('click', () => {
    const sceneName = document.getElementById('scene-name').value;
    if (sceneName) {
        loadScene(sceneName); // Load the specified scene
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
        clickable: false,
        giveCurrency: false,
        switchScene: false,
        giveObject: false,
        targetScene: null,
        targetObjectName: null
    };
    asciiObjects.push(asciiObject);

    artDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY, asciiObject);
        selectAsciiObject(asciiObject);
    });

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

// Save the current scene
function saveScene(sceneName) {
    const artArray = asciiObjects.map(art => ({
        ascii: art.ascii,
        left: art.element.style.left,
        top: art.element.style.top,
        color: art.element.style.color,
        clickable: art.clickable,
        giveCurrency: art.giveCurrency,
        switchScene: art.switchScene,
        giveObject: art.giveObject,
        targetScene: art.targetScene,
        targetObjectName: art.targetObjectName
    }));
    scenes[sceneName] = artArray;
    alert(`Scene '${sceneName}' saved!`);
}

// Load a specific scene
function loadScene(sceneName) {
    if (scenes[sceneName]) {
        document.getElementById('ascii-display').innerHTML = '';
        asciiObjects = [];
        scenes[sceneName].forEach(({ ascii, left, top, color, clickable, giveCurrency, switchScene, giveObject, targetScene, targetObjectName }) => {
            addAsciiArt(ascii, parseInt(left), parseInt(top), color);
            const artObject = asciiObjects[asciiObjects.length - 1];
            Object.assign(artObject, { clickable, giveCurrency, switchScene, giveObject, targetScene, targetObjectName });
        });
        currentScene = sceneName;
        alert(`Scene '${sceneName}' loaded!`);
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
    }
}

// Show context menu for ASCII object
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

    // Add event listeners for context menu actions
    document.getElementById('delete-item').onclick = () => {
        deleteAsciiArt(asciiObject);
        contextMenu.style.display = 'none';
    };

    document.getElementById('change-color').onclick = () => {
        changeAsciiColor(asciiObject);
        contextMenu.style.display = 'none';
    };
}
// Delete ASCII art
function deleteAsciiArt(asciiObject) {
    const index = asciiObjects.indexOf(asciiObject);
    if (index !== -1) {
        asciiObjects.splice(index, 1);
        asciiObject.element.remove();
    }
}

// Change ASCII art color
function changeAsciiColor(asciiObject) {
    const newColor = prompt("Enter a new color for the ASCII art:");
    if (newColor) {
        asciiObject.element.style.color = newColor;
        asciiObject.color = newColor;
    }
}

// Handle ASCII object selection and apply highlight
function selectAsciiObject(asciiObject) {
    if (selectedAsciiArt) {
        selectedAsciiArt.element.classList.remove('flashing-border');
    }
    selectedAsciiArt = asciiObject;
    selectedAsciiArt.element.classList.add('flashing-border');
    updatePropertyBox(asciiObject);
}

// Event listener for document click to close the context menu
document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});

// Update the property box with selected object's properties
function updatePropertyBox(asciiObject) {
    document.getElementById('clickable').checked = asciiObject.clickable;
    document.getElementById('give-currency').checked = asciiObject.giveCurrency;
    document.getElementById('switch-scene').checked = asciiObject.switchScene;
    document.getElementById('give-object').checked = asciiObject.giveObject;
}

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
document.getElementById('add-key-binding').addEventListener('click', () => {
    const key = document.getElementById('key-input').value;
    const action = document.getElementById('action-select').value;
    if (key && action) {
        keyBindings[key] = action;  // Store the keybinding
        alert(`Keybinding for '${key}' added with action: ${action}`);
    } else {
        alert('Please enter a valid key and action.');
    }
});



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
