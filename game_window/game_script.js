document.addEventListener("DOMContentLoaded", () => {
    const gameContainer = document.getElementById("game-container");
    const playButton = document.getElementById("play-button");
    const pauseButton = document.getElementById("pause-button");
    const resetButton = document.getElementById("reset-button");

    let isPaused = false;
    let keysPressed = {};
    const startingScene = 1; // Define the starting scene
    let currentScene = startingScene; // Track the current scene

    gameContainer.style.position = "relative";

    // Create the character (player)
    const character = document.createElement("div");
    character.classList.add("ascii-art");
    character.innerText = "O\n|\n/\\";
    character.style.position = "absolute";
    character.style.whiteSpace = "pre";
    character.style.textAlign = "center";

    gameContainer.appendChild(character);

    let position = { x: 0, y: 0 };
    centerCharacter();
    const speed = 2;

    // Helper to update character size
    function updateCharacterSize() {
        return { width: character.offsetWidth || 20, height: character.offsetHeight || 40 };
    }

    // Center character in the game area
    function centerCharacter() {
        let charSize = updateCharacterSize();
        position.x = (gameContainer.clientWidth - charSize.width) / 2;
        position.y = (gameContainer.clientHeight - charSize.height) / 2;
        character.style.left = `${position.x}px`;
        character.style.top = `${position.y}px`;
    }

    // Create obstacle helper
    function createObstacle(x, y, width, height, color = "red") {
        const obstacle = document.createElement("div");
        obstacle.classList.add("obstacle");
        obstacle.style.position = "absolute";
        obstacle.style.left = `${x}px`;
        obstacle.style.top = `${y}px`;
        obstacle.style.width = `${width}px`;
        obstacle.style.height = `${height}px`;
        obstacle.style.backgroundColor = color;
        gameContainer.appendChild(obstacle);
        return { x, y, width, height, element: obstacle };
    }

    let obstacles = [];
    let sceneSwitcher;

    // Load scenes
    function loadScene(scene) {
        gameContainer.innerHTML = "";
        gameContainer.appendChild(character);

        obstacles = [];
        if (scene === 1) {
            // Scene 1 objects
            obstacles.push(createObstacle(200, 150, 50, 50));
            obstacles.push(createObstacle(400, 250, 75, 50));

            // Scene switcher to Scene 2 (Green Object)
            sceneSwitcher = createObstacle(600, 50, 40, 40, "green");
            sceneSwitcher.element.addEventListener("click", () => switchScene(2));
        } else if (scene === 2) {
            // Scene 2 objects
            centerCharacter(); // Ensure the character is centered when loading this scene
            obstacles.push(createObstacle(150, 200, 40, 60, "brown"));

            // Scene switcher back to Scene 1 (Green Object)
            sceneSwitcher = createObstacle(600, 50, 40, 40, "green");
            sceneSwitcher.element.addEventListener("click", () => switchScene(1));
        }
    }

    // Switch between scenes
    function switchScene(scene) {
        currentScene = scene;
        position = { x: 0, y: 0 };
        centerCharacter();
        loadScene(scene);
    }

    // Check for collisions between character and obstacles
    function checkCollision(newX, newY, charSize) {
        return obstacles.some(obs =>
            newX < obs.x + obs.width &&
            newX + charSize.width > obs.x &&
            newY < obs.y + obs.height &&
            newY + charSize.height > obs.y
        );
    }

    // Update character movement based on pressed keys
    function updateMovement() {
        if (!isPaused) {
            let dx = 0, dy = 0;

            // Use lowercase to match all key inputs
            if (keysPressed["w"]) dy -= speed;
            if (keysPressed["s"]) dy += speed;
            if (keysPressed["a"]) dx -= speed;
            if (keysPressed["d"]) dx += speed;

            let charSize = updateCharacterSize();
            let newX = position.x + dx;
            let newY = position.y + dy;

            // Movement within bounds and no collision
            if (newX >= 0 && newX + charSize.width <= gameContainer.clientWidth && !checkCollision(newX, position.y, charSize)) {
                position.x = newX;
            }
            if (newY >= 0 && newY + charSize.height <= gameContainer.clientHeight && !checkCollision(position.x, newY, charSize)) {
                position.y = newY;
            }

            character.style.left = `${position.x}px`;
            character.style.top = `${position.y}px`;
        }

        requestAnimationFrame(updateMovement);
    }

    // Start the game loop
    updateMovement();

    // Load the initial scene
    loadScene(startingScene);

    // Handle key press events
    document.addEventListener("keydown", (event) => {
        // console.log("Key Pressed: ", event.key); // Debugging line
        keysPressed[event.key.toLowerCase()] = true; // Ensure lowercase consistency
    });

    document.addEventListener("keyup", (event) => {
        delete keysPressed[event.key.toLowerCase()];
    });

    // Play button: Resume movement
    playButton.addEventListener("click", () => {
        isPaused = false;
    });

    // Pause button: Stop movement
    pauseButton.addEventListener("click", () => {
        isPaused = true;
    });

    // Reset button: Reset character position and scene
    resetButton.addEventListener("click", () => {
        isPaused = false;
        position = { x: 0, y: 0 };
        centerCharacter();
        switchScene(startingScene);
    });
});


// used to swap to settings page
document.getElementById('settings-button').addEventListener('click', () => {
    
    //wait 5 seconds before navigating to settings.html
    setTimeout(() => {
        window.location.href = '/settings.html';
    }, 5000);
    // Navigate to settings.html
    window.location.href = '/settings.html';
});