document.addEventListener("DOMContentLoaded", () => {
    const gameContainer = document.getElementById("game-container");
    const playButton = document.getElementById("play-button");
    const pauseButton = document.getElementById("pause-button");
    const resetButton = document.getElementById("reset-button");
    
    let isPaused = false;
    let keysPressed = {};
    const startingScene = 1;
    let currentScene = startingScene;
    
    gameContainer.style.position = "relative";
    
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
    
    function updateCharacterSize() {
        return { width: character.offsetWidth || 20, height: character.offsetHeight || 40 };
    }
    
    function centerCharacter() {
        let charSize = updateCharacterSize();
        position.x = (gameContainer.clientWidth - charSize.width) / 2;
        position.y = (gameContainer.clientHeight - charSize.height) / 2;
        character.style.left = `${position.x}px`;
        character.style.top = `${position.y}px`;
    }
    
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
    
    function loadScene(scene) {
        gameContainer.innerHTML = "";
        gameContainer.appendChild(character);
        
        obstacles = [];
        if (scene === 1) {
            obstacles.push(createObstacle(200, 150, 50, 50));
            obstacles.push(createObstacle(400, 250, 75, 50));
            
            sceneSwitcher = createObstacle(600, 50, 40, 40, "green");
            sceneSwitcher.element.addEventListener("click", () => switchScene(2));
        } else if (scene === 2) {
            centerCharacter();
            obstacles.push(createObstacle(150, 200, 40, 60, "brown"));
            
            sceneSwitcher = createObstacle(600, 50, 40, 40, "green");
            sceneSwitcher.element.addEventListener("click", () => switchScene(1));
        }
    }
    
    function switchScene(scene) {
        currentScene = scene;
        loadScene(scene);
    }
    
    function checkCollision(newX, newY, charSize) {
        return obstacles.some(obs => 
            newX < obs.x + obs.width &&
            newX + charSize.width > obs.x &&
            newY < obs.y + obs.height &&
            newY + charSize.height > obs.y
        );
    }
    
    function updateMovement() {
        if (!isPaused) {
            let dx = 0, dy = 0;
            if (keysPressed["w"]) dy -= speed;
            if (keysPressed["s"]) dy += speed;
            if (keysPressed["a"]) dx -= speed;
            if (keysPressed["d"]) dx += speed;
            
            let charSize = updateCharacterSize();
            let newX = position.x + dx;
            let newY = position.y + dy;
            
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
    
    updateMovement();
    loadScene(startingScene);
    
    document.addEventListener("keydown", (event) => {
        keysPressed[event.key] = true;
    });

    document.addEventListener("keyup", (event) => {
        delete keysPressed[event.key];
    });
    
    playButton.addEventListener("click", () => {
        isPaused = false;
    });

    pauseButton.addEventListener("click", () => {
        isPaused = true;
    });

    resetButton.addEventListener("click", () => {
        position = { x: 0, y: 0 };
        centerCharacter();
        switchScene(startingScene);
    }); 
});
