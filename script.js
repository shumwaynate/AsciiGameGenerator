console.log("script.js loaded successfully");

// Global variables
let selectedAsciiArt = null;
let isDragging = false;
const scenes = { default: [] };
let currentScene = 'default';
let asciiObjects = [];
let offsetX, offsetY;

// Event listeners for adding ASCII art and scene management
document.getElementById('add-ascii-art').addEventListener('click', () => {
    const asciiArt = document.getElementById('ascii-input').value;
    if (asciiArt) {
        addAsciiArt(asciiArt);
        document.getElementById('ascii-input').value = ''; // Clear input after adding
    } else {
        alert('Please enter some ASCII art!');
    }
});

document.getElementById('save-scene').addEventListener('click', () => {
    const sceneName = document.getElementById('scene-name').value;
    if (sceneName) {
        saveScene(sceneName);
        currentScene = sceneName; // Update current scene
        document.getElementById('scene-name').value = ''; // Clear scene name
    } else {
        alert('Please enter a scene name!');
    }
});

document.getElementById('load-scene').addEventListener('click', () => {
    const sceneName = document.getElementById('scene-name').value;
    if (sceneName) {
        loadScene(sceneName); // Load specified scene
    } else {
        alert('Please enter a scene name to load!');
    }
});

// Function to add ASCII art to the display
function addAsciiArt(asciiArt, left = null, top = null, color = 'black') {
    const artDiv = document.createElement('div');
    artDiv.classList.add('ascii-art');
    artDiv.innerText = asciiArt;
    artDiv.style.position = 'absolute';
    artDiv.style.whiteSpace = 'pre';
    artDiv.style.color = color;

    // Center new ASCII art by default if no position provided
    const container = document.getElementById('ascii-display');
    const containerRect = container.getBoundingClientRect();
    artDiv.style.left = left !== null ? `${left}px` : `${(containerRect.width - 100) / 2}px`;
    artDiv.style.top = top !== null ? `${top}px` : `${(containerRect.height - 50) / 2}px`;

    // Add to `asciiObjects` array
    const asciiObject = {
        element: artDiv,
        ascii: asciiArt,
        left: artDiv.style.left,
        top: artDiv.style.top,
        color: color,
        clickable: false,
    };
    asciiObjects.push(asciiObject);

    // Click event to select ASCII art
    artDiv.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent triggering document click
        selectAsciiArt(asciiObject);
        startDragging(e, artDiv);
    });

    // Append to display container
    container.appendChild(artDiv);
}

// Function to select ASCII art and update properties panel
function selectAsciiArt(asciiObject) {
    if (selectedAsciiArt) selectedAsciiArt.element.classList.remove('highlight');
    selectedAsciiArt = asciiObject;
    selectedAsciiArt.element.classList.add('highlight');
    
    // Update properties panel
    document.getElementById('clickable').checked = asciiObject.clickable;
    document.getElementById('color-select').value = asciiObject.color;
}

// Delete selected ASCII art
document.getElementById('delete-item').addEventListener('click', () => {
    if (selectedAsciiArt) {
        selectedAsciiArt.element.remove();
        asciiObjects = asciiObjects.filter(obj => obj !== selectedAsciiArt);
        selectedAsciiArt = null;
        resetPropertiesPanel();
    } else {
        alert("No ASCII art selected for deletion!");
    }
});

// Reset the properties panel
function resetPropertiesPanel() {
    document.getElementById('clickable').checked = false;
    document.getElementById('color-select').value = 'black';
}

// Save the current scene
function saveScene(sceneName) {
    scenes[sceneName] = asciiObjects.map(art => ({
        ascii: art.ascii,
        left: art.element.style.left,
        top: art.element.style.top,
        color: art.color,
        clickable: art.clickable
    }));
    alert(`Scene '${sceneName}' saved!`);
}

// Load a specific scene
function loadScene(sceneName) {
    if (!scenes[sceneName]) {
        alert(`Scene '${sceneName}' does not exist!`);
        return;
    }
    
    document.getElementById('ascii-display').innerHTML = ''; // Clear display
    asciiObjects = []; // Clear current objects

    scenes[sceneName].forEach(({ ascii, left, top, color, clickable }) => {
        addAsciiArt(ascii, parseInt(left), parseInt(top), color);
        const artObject = asciiObjects[asciiObjects.length - 1];
        artObject.clickable = clickable;
    });

    currentScene = sceneName;
    alert(`Scene '${sceneName}' loaded!`);
}

// Update properties for selected ASCII art
document.getElementById('clickable').addEventListener('change', (e) => {
    if (selectedAsciiArt) selectedAsciiArt.clickable = e.target.checked;
});

document.getElementById('color-select').addEventListener('change', (e) => {
    if (selectedAsciiArt) {
        selectedAsciiArt.color = e.target.value;
        selectedAsciiArt.element.style.color = e.target.value;
    }
});

// Dragging functionality
function startDragging(e, element) {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    
    // Add move event listener to the document
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
}

function drag(e) {
    if (!isDragging) return;
    selectedAsciiArt.element.style.left = `${e.clientX - offsetX}px`;
    selectedAsciiArt.element.style.top = `${e.clientY - offsetY}px`;
}

function stopDragging() {
    if (isDragging) {
        isDragging = false;
        selectedAsciiArt.left = selectedAsciiArt.element.style.left;
        selectedAsciiArt.top = selectedAsciiArt.element.style.top;
        
        // Remove move event listeners
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDragging);
    }
}

// Log when page loads
window.addEventListener('load', () => {
    console.log("Page loaded, all functionality is now active.");
});
