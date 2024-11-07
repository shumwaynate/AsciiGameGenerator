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
        selectAsciiArt(asciiObject); // Select ASCII art for properties
    });

    // Mouse events for dragging
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
        document.getElementById('ascii-display').innerHTML = ''; // Clear display

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

// Function to highlight selected ASCII art and update properties panel
function selectAsciiArt(asciiObject) {
    if (selectedAsciiArt) {
        selectedAsciiArt.element.classList.remove('highlight');
    }
    selectedAsciiArt = asciiObject;
    selectedAsciiArt.element.classList.add('highlight');

    // Update properties panel with selected ASCII object's properties
    document.getElementById('clickable').checked = selectedAsciiArt.clickable;
    document.getElementById('give-currency').checked = selectedAsciiArt.giveCurrency;
    document.getElementById('switch-scene').checked = selectedAsciiArt.switchScene;
    document.getElementById('give-object').checked = selectedAsciiArt.giveObject;

    // Set color dropdown to the selected ASCII object's color
    document.getElementById('color-select').value = selectedAsciiArt.color || 'black';
}

// Function to delete selected ASCII art
document.getElementById('delete-item').addEventListener('click', () => {
    if (selectedAsciiArt) {
        const index = asciiObjects.indexOf(selectedAsciiArt);
        if (index !== -1) {
            asciiObjects.splice(index, 1); // Remove from array
            selectedAsciiArt.element.remove(); // Remove from display
            selectedAsciiArt = null; // Clear selection
        }
    }
});

// Function to change color of selected ASCII art
document.getElementById('color-select').addEventListener('change', (event) => {
    if (selectedAsciiArt) {
        const newColor = event.target.value;
        selectedAsciiArt.element.style.color = newColor;
        selectedAsciiArt.color = newColor; // Update color in the object
    }
});

// Save properties button
document.getElementById('save-properties').addEventListener('click', () => {
    if (selectedAsciiArt) {
        selectedAsciiArt.clickable = document.getElementById('clickable').checked;
        selectedAsciiArt.giveCurrency = document.getElementById('give-currency').checked;
        selectedAsciiArt.switchScene = document.getElementById('switch-scene').checked;
        selectedAsciiArt.giveObject = document.getElementById('give-object').checked;
        alert('Properties saved!');
    } else {
        alert('No ASCII art selected!');
    }
});

// Event listener for document click to close the context menu
document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});
