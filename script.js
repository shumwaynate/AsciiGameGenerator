// Global variables
let selectedAsciiArt = null; // Track selected ASCII art for context menu
const scenes = { default: [] }; // Initialize with default scene
let currentScene = 'default'; // Default scene
let asciiObjects = []; // Track individual ASCII objects with their properties

document.getElementById('add-ascii-art').addEventListener('click', () => {
    const asciiArt = document.getElementById('ascii-input').value;
    if (asciiArt) {
        addAsciiArt(asciiArt);
        document.getElementById('ascii-input').value = ''; // Clear the input after adding
    } else {
        alert('Please enter some ASCII art!');
    }
});

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

document.getElementById('load-scene').addEventListener('click', () => {
    const sceneName = document.getElementById('scene-name').value;
    if (sceneName) {
        loadScene(sceneName); // Load the specified scene
    } else {
        alert('Please enter a scene name to load!');
    }
});

// Function to add ASCII art to the display
function addAsciiArt(asciiArt, left = null, top = null, color = null) {
    const artDiv = document.createElement('div');
    artDiv.classList.add('ascii-art');
    artDiv.innerText = asciiArt;
    artDiv.style.cursor = 'pointer';
    artDiv.style.position = 'absolute'; // Allow positioning
    artDiv.style.whiteSpace = 'pre';
    artDiv.style.color = color || 'black';

    const container = document.getElementById('ascii-display');

    // Position the art: if left/top provided (loading a scene), use those; otherwise, center it
    if (left !== null && top !== null) {
        artDiv.style.left = `${left}px`;
        artDiv.style.top = `${top}px`;
    } else {
        const containerRect = container.getBoundingClientRect();
        const centerX = (containerRect.width - 100) / 2; // Adjust based on ASCII width
        const centerY = (containerRect.height - 50) / 2; // Adjust based on ASCII height
        artDiv.style.left = `${centerX}px`;
        artDiv.style.top = `${centerY}px`;
    }

    // Save the ASCII art object
    const asciiObject = {
        element: artDiv,
        ascii: asciiArt,
        left: artDiv.style.left,
        top: artDiv.style.top,
        color: color || 'black',
        clickable: false,
        giveCurrency: false,
        switchScene: false,
        giveObject: false
    };
    asciiObjects.push(asciiObject);

    artDiv.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering document click
        showContextMenu(e.clientX, e.clientY, asciiObject); // Show context menu
        selectAsciiObject(asciiObject); // Track the selected art
    });

    // Mouse events for dragging
    artDiv.addEventListener('mousedown', (e) => {
        // Calculate initial offsets
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

// Function to save the current scene
function saveScene(sceneName) {
    const artArray = asciiObjects.map(art => ({
        ascii: art.ascii,
        left: art.element.style.left,
        top: art.element.style.top,
        color: art.element.style.color,
        clickable: art.clickable,
        giveCurrency: art.giveCurrency,
        switchScene: art.switchScene,
        giveObject: art.giveObject
    }));
    scenes[sceneName] = artArray; // Save the scene with its ASCII art
    alert(`Scene '${sceneName}' saved!`);
}

// Function to load a specific scene
function loadScene(sceneName) {
    if (scenes[sceneName]) {
        // Clear existing elements in display and in asciiObjects array
        document.getElementById('ascii-display').innerHTML = ''; // Clear display
        asciiObjects = []; // Clear array to avoid duplicates

        // Load each art object with its saved left/top positions and color
        scenes[sceneName].forEach(({ ascii, left, top, color, clickable, giveCurrency, switchScene, giveObject }) => {
            addAsciiArt(ascii, parseInt(left), parseInt(top), color);
            const artObject = asciiObjects[asciiObjects.length - 1];
            artObject.clickable = clickable;
            artObject.giveCurrency = giveCurrency;
            artObject.switchScene = switchScene;
            artObject.giveObject = giveObject;
        });

        currentScene = sceneName; // Update current scene after loading
        alert(`Scene '${sceneName}' loaded!`);
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
    }
}

// Function to show context menu
function showContextMenu(x, y, asciiObject) {
    const contextMenu = document.getElementById('context-menu');
    const container = document.getElementById('ascii-display');

    // Position context menu relative to container
    const containerRect = container.getBoundingClientRect();
    contextMenu.style.left = `${x - containerRect.left}px`;
    contextMenu.style.top = `${y - containerRect.top}px`;
    contextMenu.style.display = 'block';

    // Set up event listeners for the buttons
    document.getElementById('delete-item').onclick = () => {
        deleteAsciiArt(asciiObject);
        contextMenu.style.display = 'none';
    };

    document.getElementById('change-color').onclick = () => {
        changeAsciiColor(asciiObject);
        contextMenu.style.display = 'none';
    };
}

// Function to delete ASCII art
function deleteAsciiArt(asciiObject) {
    const index = asciiObjects.indexOf(asciiObject);
    if (index !== -1) {
        asciiObjects.splice(index, 1); // Remove from array
        asciiObject.element.remove(); // Remove from display
    }
}

// Function to change ASCII art color
function changeAsciiColor(asciiObject) {
    const newColor = prompt("Enter a new color for the ASCII art:");
    if (newColor) {
        asciiObject.element.style.color = newColor;
        asciiObject.color = newColor; // Update color in the object
    }
}

// Function to handle ASCII object selection and apply highlight
function selectAsciiObject(asciiObject) {
    // Remove highlight from previous selection
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

        // Save properties to the selected ASCII object
        selectedAsciiArt.clickable = clickable;
        selectedAsciiArt.giveCurrency = giveCurrency;
        selectedAsciiArt.switchScene = switchScene;
        selectedAsciiArt.giveObject = giveObject;
    }
});
