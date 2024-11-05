// Global variables
let selectedAsciiArt = null; // Track selected ASCII art for context menu
const scenes = { default: [] }; // Initialize with default scene
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
function addAsciiArt(asciiArt, left = null, top = null) {
    const artDiv = document.createElement('div');
    artDiv.classList.add('ascii-art');
    artDiv.innerText = asciiArt;
    artDiv.style.cursor = 'pointer';
    artDiv.style.position = 'absolute'; // Allow positioning

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

    container.appendChild(artDiv);
}

// Function to save the current scene
function saveScene(sceneName) {
    const artItems = document.querySelectorAll('.ascii-art');
    const artArray = Array.from(artItems).map(art => {
        const rect = art.getBoundingClientRect();
        const containerRect = document.getElementById('ascii-display').getBoundingClientRect();
        return {
            ascii: art.innerText,
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top
        };
    });
    scenes[sceneName] = artArray; // Save the scene with its ASCII art
    alert(`Scene '${sceneName}' saved!`);
}

// Function to load a specific scene
function loadScene(sceneName) {
    if (scenes[sceneName]) {
        document.getElementById('ascii-display').innerHTML = ''; // Clear display

        // Load each art object with its saved left/top positions
        scenes[sceneName].forEach(({ ascii, left, top }) => {
            addAsciiArt(ascii, left, top);
        });
        
        currentScene = sceneName; // Update current scene after loading
        alert(`Scene '${sceneName}' loaded!`);
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
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

// Event listener to hide the context menu on canvas click
document.getElementById('ascii-display').addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none'; // Hide context menu
});
