// Global variables
let selectedAsciiArt = null; // Track selected ASCII art for context menu
const scenes = {}; // Object to hold scenes and their ASCII art
let currentScene = 'default'; // Default scene

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
    loadScene(currentScene); // Load the current scene
});

// Function to add ASCII art to the display
function addAsciiArt(asciiArt) {
    const artDiv = document.createElement('div');
    artDiv.classList.add('ascii-art');
    artDiv.innerText = asciiArt;
    artDiv.style.cursor = 'pointer';
    artDiv.style.position = 'absolute'; // Allow positioning

    // Set position at center of canvas
    artDiv.style.left = `${(document.getElementById('ascii-container').clientWidth / 2) - (asciiArt.length / 2 * 8)}px`; // Adjust for ASCII width
    artDiv.style.top = `calc(50% - 10px)`; // Center vertically

    artDiv.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering document click
        showContextMenu(e.clientX, e.clientY, asciiArt); // Show context menu
        selectedAsciiArt = asciiArt; // Track the selected art
    });

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

    document.getElementById('ascii-display').appendChild(artDiv);
}

// Function to save the current scene
function saveScene(sceneName) {
    const artItems = document.querySelectorAll('.ascii-art');
    const artArray = Array.from(artItems).map(art => ({
        content: art.innerText,
        left: art.style.left,
        top: art.style.top
    }));
    scenes[sceneName] = artArray; // Save the scene with its ASCII art
    alert(`Scene '${sceneName}' saved!`);
}

// Function to load a specific scene
function loadScene(sceneName) {
    if (scenes[sceneName]) {
        currentScene = sceneName; // Update current scene
        document.getElementById('ascii-display').innerHTML = ''; // Clear display
        scenes[sceneName].forEach(art => {
            addAsciiArt(art.content); // Re-add ASCII art from the scene
            const artDiv = document.querySelectorAll('.ascii-art:last-child')[0]; // Get the last added element
            artDiv.style.left = art.left; // Set saved position
            artDiv.style.top = art.top; // Set saved position
        });
        alert(`Scene '${sceneName}' loaded!`);
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
    }
}

// Function to change scene
function changeScene() {
    const sceneName = prompt("Enter the name of the scene you want to change to:");
    if (sceneName) {
        loadScene(sceneName); // Load the selected scene
    }
}

// Function to show context menu
function showContextMenu(x, y, asciiArt) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
}

// Function to delete ASCII art
function deleteAsciiArt(asciiArt) {
    const artItems = document.querySelectorAll('.ascii-art');
    artItems.forEach(item => {
        if (item.innerText === asciiArt) {
            item.remove(); // Remove the ASCII art from display
        }
    });
}

// Add event listener for context menu options
document.getElementById('context-menu').addEventListener('click', (event) => {
    const targetId = event.target.id;
    if (targetId === 'delete-item') {
        deleteAsciiArt(selectedAsciiArt); // Assuming you have selectedAsciiArt tracked
        document.getElementById('context-menu').style.display = 'none'; // Hide the context menu after action
    } else if (targetId === 'change-color') {
        changeAsciiColor(selectedAsciiArt); // Assuming you have selectedAsciiArt tracked
        document.getElementById('context-menu').style.display = 'none'; // Hide the context menu after action
    } else if (targetId === 'change-scene') {
        changeScene(); // Change the scene based on user selection
        document.getElementById('context-menu').style.display = 'none'; // Hide the context menu after action
    }
});

// Function to change the color of the ASCII art
function changeAsciiColor(asciiArt) {
    const color = prompt("Enter a color (name or hex):");
    const artItems = document.querySelectorAll('.ascii-art');
    artItems.forEach(item => {
        if (item.innerText === asciiArt) {
            item.style.color = color; // Change the color of the ASCII art
        }
    });
}

// Hide context menu when clicking elsewhere
document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none'; // Hide the context menu
});
