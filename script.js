// Global variables
let selectedAsciiArt = null; // Track selected ASCII art for context menu
const scenes = {}; // Object to hold scenes and their ASCII art, including color and position
let currentScene = 'default'; // Default scene
let asciiContainer = document.getElementById('ascii-display');

// Function to add ASCII art to the display
function addAsciiArt(asciiArt, x = null, y = null, color = 'black') {
    const artDiv = document.createElement('div');
    artDiv.classList.add('ascii-art');
    artDiv.innerText = asciiArt;
    artDiv.style.cursor = 'pointer';
    artDiv.style.position = 'absolute'; // Allow positioning
    artDiv.style.color = color; // Set color of ASCII art
    artDiv.style.left = x ? `${x}px` : `${asciiContainer.clientWidth / 2}px`;
    artDiv.style.top = y ? `${y}px` : `${asciiContainer.clientHeight / 2}px`;

    // Mouse events for dragging
    artDiv.addEventListener('mousedown', (e) => {
        const offsetX = e.clientX - artDiv.getBoundingClientRect().left;
        const offsetY = e.clientY - artDiv.getBoundingClientRect().top;

        const mouseMoveHandler = (event) => {
            artDiv.style.left = `${event.clientX - offsetX}px`;
            artDiv.style.top = `${event.clientY - offsetY}px`;
        };

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });

    artDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY, artDiv); 
        selectedAsciiArt = artDiv;
    });

    document.getElementById('ascii-display').appendChild(artDiv);
}

// Event listeners for scene functions
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
        document.getElementById('scene-name').value = ''; // Clear the scene name after saving
    } else {
        alert('Please enter a scene name!');
    }
});

document.getElementById('load-scene').addEventListener('click', () => {
    const sceneName = document.getElementById('scene-name').value;
    if (sceneName) {
        loadScene(sceneName);
    } else {
        alert('Please enter a scene name to load!');
    }
});

// Function to save the current scene
function saveScene(sceneName) {
    const artItems = document.querySelectorAll('.ascii-art');
    const artArray = Array.from(artItems).map(art => ({
        text: art.innerText,
        x: parseFloat(art.style.left),
        y: parseFloat(art.style.top),
        color: art.style.color
    }));
    scenes[sceneName] = artArray; // Save scene with ASCII art, positions, and colors
    alert(`Scene '${sceneName}' saved!`);
}

// Function to load a specific scene
function loadScene(sceneName) {
    if (scenes[sceneName]) {
        currentScene = sceneName;
        document.getElementById('ascii-display').innerHTML = ''; // Clear display

        scenes[sceneName].forEach(art => {
            addAsciiArt(art.text, art.x, art.y, art.color); // Re-add ASCII art with saved position and color
        });
        alert(`Scene '${sceneName}' loaded!`);
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
    }
}

// Context menu functions
function showContextMenu(x, y, artDiv) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;

    // Hide context menu when clicking outside
    document.addEventListener('click', hideContextMenu, { once: true });

    // Context menu options
    document.getElementById('delete-item').onclick = () => {
        artDiv.remove();
        hideContextMenu();
    };
    document.getElementById('change-color').onclick = () => {
        const color = prompt("Enter a color (name or hex):");
        if (color) {
            artDiv.style.color = color;
        }
        hideContextMenu();
    };
    document.getElementById('change-scene').onclick = () => {
        const sceneName = prompt("Enter the name of the scene to change to:");
        if (sceneName) {
            loadScene(sceneName);
        }
        hideContextMenu();
    };
}

function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'none';
}
