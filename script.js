// script.js

// Global variables
let selectedAsciiArt = null; // Track selected ASCII art for context menu
let scenes = {  }; // Initialize with default scene
let currentScene = ''; // Default scene
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
        saveScene(sceneName); // Save the current scene
        currentScene = sceneName; // Update current scene name global variable
       
        //may need this later to just copy the objects and not the references
        // let asciiObjectsCopy = JSON.parse(JSON.stringify(asciiObjects));

        //set textbox input with id scene-name to empty string
        document.getElementById('scene-name').value = '';
        
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
        document.getElementById('scene-name').value = ''; // Clear the input after loading
        saveGameState() // Serialize and save the current scenes and game state
        refreshItemsInSceneBox(); // Update the list of objects in the scene
    } else {
        alert('Please enter a scene name to load!');
    }
});

// Using this to handle scene changes
const sceneManager = {
    currentScene: 'default', // Keep track of the current scene

    switchToScene(sceneName) {
        loadScene(sceneName); // Load the specified scene
    },

    getAllScenes() {
        // Collect scene data (you can customize this further)
        // detect if there are no scenes return empty array
        if (!document.querySelectorAll('.scene').length) { 
            console.log('No scenes detected');
            return {};
        }
        log('Scenes detected');

        //return a dictionary of scenes {"sceneName": [list of asciiObjects]}
        return Object.fromEntries(
            Array.from(document.querySelectorAll('.scene')).map(scene => {
                return [scene.id, Array.from(scene.querySelectorAll('.ascii-art')).map(art => {
                    return {
                        id: art.id,
                        content: art.innerText,
                        style: art.style.cssText
                    };
                })];
            })
        );
    },

    loadScenes(scenesInput) {
        // Load scene data it is in the form of a dictionary of scenes, the layout is scenesInput: {"sceneName": [list of asciiObjects], "sceneName2": [list of asciiObjects], etc}
        // Loop through the scenes and load them into the document adding them to global scenes object
        //only save the scenes to the global scenes, do not actually load a specific scene here, we will call switchToScene to load the scene not in this function
        //gets scenes from scenesInput from the local Storage and saves them to global scenes object
        // the variable is layed out scenesInput: {"sceneName": [list of asciiObjects], "sceneName2": [list of asciiObjects], etc}
        for (const [sceneName, asciiArtList] of Object.entries(scenesInput)) {
            scenes[sceneName] = asciiArtList;
        }   
    }
};



// === New Function to Generate Unique Item Names === //
function generateUniqueName() {
  const baseName = "Object ";
  let counter = 1;

  // Collect existing names
  const existingNames = asciiObjects.map(obj => obj.itemName);

  // Find the first available name
  while (existingNames.includes(baseName + counter)) {
    counter++;
  }

  return baseName + counter;
}


// Add ASCII Art to Display
function addAsciiArt(asciiArt, left = null, top = null, color = null) {
    const artDiv = document.createElement('div');
    artDiv.classList.add('ascii-art');
    artDiv.innerText = asciiArt;
    artDiv.style.cursor = 'pointer';
    artDiv.style.position = 'absolute';
    artDiv.style.whiteSpace = 'pre';
    artDiv.style.color = color || 'black';

    const container = document.getElementById('ascii-display');
    if (left !== null && top !== null) { // If left and top are provided
        artDiv.style.left = `${left}px`; 
        artDiv.style.top = `${top}px`;
    } else { // Center the object if no position is provided
        const containerRect = container.getBoundingClientRect();
        artDiv.style.left = `${(containerRect.width - 100) / 2}px`;
        artDiv.style.top = `${(containerRect.height - 50) / 2}px`;
    }

    // === Use the unique name generator to set itemName ===
    const uniqueName = generateUniqueName();

    const asciiObject = {
        id: Date.now(),
        element: artDiv,
        ascii: asciiArt,
        left: artDiv.style.left,
        top: artDiv.style.top,
        colors: {
            default: color || '#000000',
            hover: { enabled: false, color: '#000000' },
            click: { enabled: false, color: '#000000' }
        },
        clickable: false,
        visible:true,
        mainCharacter: false,
        collision: true,
        switchScene: {
            enabled: false,
            trigger: "click",
            target: null
        },
        giveCurrency: {
            enabled: false,
            trigger: "click",
            currency: null,
            amount: 0,
            deleteAfter: true
        },
        giveObject: {
            enabled: false,
            trigger: "click",
            object: null,
            deleteAfter: true
        },
        targetScene: null,
        targetObjectName: null,
        itemName: uniqueName  // <--- Here it is assigned
    };

    asciiObjects.push(asciiObject); // Add the object to the global array of objects in current scene

    // Hover effect (Change color on hover)
    artDiv.addEventListener('mouseenter', () => {
        if (asciiObject.colors?.hover?.enabled) {
            artDiv.style.color = asciiObject.colors.hover.color;
        }
    });
    // Reset color on mouse leave
    artDiv.addEventListener('mouseleave', () => {
        artDiv.style.color = asciiObject.colors?.default || '#000000'; // Reset to original color
    });

    // Handle clicks to open context menu and select the object also delete objects
    artDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        selectAsciiObject(asciiObject);
        showContextMenu(e.clientX, e.clientY, asciiObject); // For the context menu

        // Change color on click if a clickColor is set and clickable is true
        if (asciiObject.clickable && asciiObject.colors?.click?.enabled) {
            artDiv.style.color = asciiObject.colors.click.color;
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

    refreshItemsInSceneBox(); // Update the panel
}



function saveScene(sceneName) {
    scenes[sceneName] = asciiObjects.map(obj => ({
        ascii: obj.ascii,
        left: parseInt(obj.element.style.left),
        top: parseInt(obj.element.style.top),
        colors: {
          default: obj.colors.default,
          hover: {
            enabled: obj.colors.hover.enabled,
            color: obj.colors.hover.color
          },
          click: {
            enabled: obj.colors.click.enabled,
            color: obj.colors.click.color
          }
        },
        clickable: obj.clickable,
        visible:obj.visible,
        mainCharacter: obj.mainCharacter,
        collision: obj.collision,
        giveCurrency: obj.giveCurrency,
        switchScene: obj.switchScene,
        giveObject: obj.giveObject,
        targetScene: obj.targetScene,
        targetObjectName: obj.targetObjectName,
        itemName: obj.itemName
    }));
      
    alert(`Scene '${sceneName}' saved!`);
    updateSceneList(); // Updates the scene list on save scene
}

function loadScene(sceneName) {
    if (scenes[sceneName]) {
        document.getElementById('ascii-display').innerHTML = '';
        asciiObjects = []; // Clear existing objects

        scenes[sceneName].forEach(obj => {
            // Backward compatibility for old color structure
            const colors = obj.colors || {
                default: obj.color || '#000000',
                hover: { enabled: !!obj.hoverColor, color: obj.hoverColor || '#ff0000' },
                click: { enabled: !!obj.clickColor, color: obj.clickColor || '#00ff00' }
            };

            // Add ASCII art to the scene using modular color.default
            addAsciiArt(obj.ascii, obj.left, obj.top, colors.default);

            const artObject = asciiObjects[asciiObjects.length - 1];
            const artDiv = artObject.element;

            // Assign the full color system and other properties
            artObject.colors = colors;
            artObject.clickable = obj.clickable;
            artObject.mainCharacter = obj.mainCharacter;
            artObject.visible = obj.visible;
            artObject.collision = obj.collision ?? true;
            artObject.switchScene = obj.switchScene ?? { enabled: false, trigger: "click", target: null };
            artObject.giveCurrency = obj.giveCurrency ?? { enabled: false, trigger: "click", currency: null, amount: 0, deleteAfter: true };
            artObject.giveObject = obj.giveObject ?? { enabled: false, trigger: "click", object: null, deleteAfter: true };
            artObject.itemName = obj.itemName;
            artObject.targetScene = obj.targetScene;
            artObject.targetObjectName = obj.targetObjectName;

            // Set initial color
            artDiv.style.color = colors.default;

            // Clear previous events and apply new ones using modular structure
            artDiv.onmouseenter = colors.hover.enabled ? () => {
                artDiv.style.color = colors.hover.color;
            } : null;

            artDiv.onmouseleave = () => {
                artDiv.style.color = colors.default;
            };

            artDiv.onmousedown = colors.click.enabled ? () => {
                artDiv.style.color = colors.click.color;
            } : null;

            artDiv.onmouseup = () => {
                artDiv.style.color = colors.default;
            };
        });

        currentScene = sceneName; // Update global scene state
    } else {
        alert(`Scene '${sceneName}' does not exist!`);
    }
    updateSceneList(); // Updates the scene list on load scene
}


document.getElementById('delete-selected-item').addEventListener('click', () => {
    if (selectedAsciiArt) {
        deleteAsciiArt(selectedAsciiArt);
        selectedAsciiArt = null; // Clear the selection after deletion
        clearPropertyBox();
        refreshItemsInSceneBox();
    } else {
        alert('No ASCII art selected to delete!');
    }
});

// This is a context menu function that is not used in this project currently
// pops up a box with options like delete at the object clicked
function showContextMenu(x, y, asciiObject) { 
    const contextMenu = document.getElementById('context-menu');
    const artDiv = asciiObject.element; // Reference to the clicked object
    const artRect = artDiv.getBoundingClientRect(); // Get the position of the clicked object

    // Adjust the menu position relative to the object
    const offsetX = 10; // Optional offset to prevent overlap
    const offsetY = 10; // Optional offset to prevent overlap

    // Set the position of the context menu relative to the clicked object
    contextMenu.style.left = `${artRect.left + offsetX}px`; // Adjust the position from the left
    contextMenu.style.top = `${artRect.top + offsetY}px`; // Adjust the position from the top
    contextMenu.style.display = 'block';  


    // Set the context menu options based on the clicked object, this does the updating
    document.getElementById('prop-clickable').checked = asciiObject.clickable;
    document.getElementById('prop-invisible').checked = !asciiObject.visible;
    document.getElementById('prop-main-player').checked = asciiObject.mainCharacter;

    document.getElementById('prop-collision').checked = asciiObject.collision;

    document.getElementById('prop-switch-scene-enabled').checked = asciiObject.switchScene.enabled;
    document.getElementById('switch-scene-trigger').value = asciiObject.switchScene.trigger;
    document.getElementById('switch-scene-list').value = asciiObject.switchScene.target;

    document.getElementById('prop-give-currency-enabled').checked = asciiObject.giveCurrency.enabled;
    document.getElementById('give-currency-trigger').value = asciiObject.giveCurrency.trigger;
    document.getElementById('give-currency-list').value = asciiObject.giveCurrency.currency;
    document.getElementById('give-currency-amount').value = asciiObject.giveCurrency.amount;
    document.getElementById('give-currency-delete-after').checked = asciiObject.giveCurrency.deleteAfter;

    document.getElementById('prop-give-object-enabled').checked = asciiObject.giveObject.enabled;
    document.getElementById('give-object-trigger').value = asciiObject.giveObject.trigger;
    document.getElementById('give-object-list').value = asciiObject.giveObject.object;
    document.getElementById('give-object-delete-after').checked = asciiObject.giveObject.deleteAfter;


    // Disable interaction if no object is selected
    selectedAsciiArt = asciiObject;


}

// Hide the context menu when clicking outside
document.getElementById('close-context-menu').addEventListener('click', function() {
    document.getElementById('context-menu').style.display = 'none';
    refreshItemsInSceneBox(); // Refresh the items in the scene box and everything
  });
  

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

    // highlightSelectedListItem(asciiObject);  //Uncommenting removes highlight on panel box but causes error
}

// Update the highlight in the "Items in Scene" panel
function updateScenePanelHighlight(asciiObject) {
    const sceneItems = document.querySelectorAll('.scene-item');
    sceneItems.forEach(item => {
        item.classList.remove('selected-panel-item'); // Remove highlight from all items
    });

    // Find the corresponding item for the selected object
    const targetItem = Array.from(sceneItems).find(item => item.dataset.id === asciiObject.id);
    if (targetItem) {
        targetItem.classList.add('selected-panel-item'); // Highlight the corresponding item
    }
}

// Event listener for document click to close the context menu
document.addEventListener('click', function(event) {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu.style.display === 'block' && !contextMenu.contains(event.target)) {
      contextMenu.style.display = 'none';
    }
  });

// Update the property box with selected object's properties
function updatePropertyBox(asciiObject) {
    // Update Name Text Box
    const nameInput = document.getElementById('item-name');

    // Color Inputs
    const defaultColorInput = document.getElementById('default-color');
    const hoverColorInput = document.getElementById('hover-color');
    const clickColorInput = document.getElementById('click-color');

    // Enable Color Checkboxes
    const hoverEnabledCheckbox = document.getElementById('enable-hover-color');
    const clickEnabledCheckbox = document.getElementById('enable-click-color');

    // === Remove old event listeners by cloning elements ===
    const newDefaultColorInput = defaultColorInput.cloneNode(true);
    const newHoverColorInput = hoverColorInput.cloneNode(true);
    const newClickColorInput = clickColorInput.cloneNode(true);
    const newNameInput = nameInput.cloneNode(true);
    const newHoverEnabledCheckbox = hoverEnabledCheckbox.cloneNode(true);
    const newClickEnabledCheckbox = clickEnabledCheckbox.cloneNode(true);

    defaultColorInput.replaceWith(newDefaultColorInput);
    hoverColorInput.replaceWith(newHoverColorInput);
    clickColorInput.replaceWith(newClickColorInput);
    nameInput.replaceWith(newNameInput);
    hoverEnabledCheckbox.replaceWith(newHoverEnabledCheckbox);
    clickEnabledCheckbox.replaceWith(newClickEnabledCheckbox);

    // === Set initial values ===
    newDefaultColorInput.value = asciiObject.colors?.default || '#000000';
    newHoverColorInput.value = asciiObject.colors?.hover?.color || '#000000';
    newClickColorInput.value = asciiObject.colors?.click?.color || '#000000';

    newHoverEnabledCheckbox.checked = asciiObject.colors?.hover?.enabled || false;
    newClickEnabledCheckbox.checked = asciiObject.colors?.click?.enabled || false;

    newNameInput.value = asciiObject.itemName || '';

    // === Add new event listeners ===

    // Update default color
    newDefaultColorInput.addEventListener('input', function () {
        asciiObject.colors.default = this.value;
        asciiObject.element.style.color = this.value;
    });

    // Update hover color and flag
    newHoverColorInput.addEventListener('input', function () {
        asciiObject.colors.hover.color = this.value;
    });

    newHoverEnabledCheckbox.addEventListener('change', function () {
        asciiObject.colors.hover.enabled = this.checked;
    });

    // Update click color and flag
    newClickColorInput.addEventListener('input', function () {
        asciiObject.colors.click.color = this.value;
    });

    newClickEnabledCheckbox.addEventListener('change', function () {
        asciiObject.colors.click.enabled = this.checked;
    });

    // Update name
    newNameInput.addEventListener('input', function () {
        asciiObject.itemName = this.value;
        refreshItemsInSceneBox();
    });

    // Clickable checkbox (if you decide to keep it for debugging or dev)
    const clickableCheckbox = document.getElementById('clickable');
    if (clickableCheckbox) {
        clickableCheckbox.checked = asciiObject.clickable || false;
        clickableCheckbox.addEventListener('change', () => {
            asciiObject.clickable = clickableCheckbox.checked;
            if (clickableCheckbox.checked) {
                enableClickable(asciiObject);
            } else {
                disableClickable(asciiObject);
            }
        });
    }
}

// Save properties
document.getElementById('save-properties').addEventListener('click', () => {
    if (selectedAsciiArt) {
        // Save the name
        const itemName = document.getElementById('item-name').value;
        selectedAsciiArt.itemName = itemName;

        // Save the clickable state
        const clickable = document.getElementById('clickable');
        if (clickable) {
            selectedAsciiArt.clickable = clickable.checked;
        }

        // Save default color
        selectedAsciiArt.colors.default = document.getElementById('default-color').value;

        // Save hover color and flag
        selectedAsciiArt.colors.hover.color = document.getElementById('hover-color').value;
        selectedAsciiArt.colors.hover.enabled = document.getElementById('enable-hover-color').checked;

        // Save click color and flag
        selectedAsciiArt.colors.click.color = document.getElementById('click-color').value;
        selectedAsciiArt.colors.click.enabled = document.getElementById('enable-click-color').checked;

        // Immediately apply the default color to the element
        selectedAsciiArt.element.style.color = selectedAsciiArt.colors.default;

        selectedAsciiArt.collision = document.getElementById('prop-collision').checked;

        // save states for the other properties
        selectedAsciiArt.switchScene = {
        enabled: document.getElementById('prop-switch-scene-enabled').checked,
        trigger: document.getElementById('switch-scene-trigger').value,
        target: document.getElementById('switch-scene-list').value
        };

        selectedAsciiArt.giveCurrency = {
        enabled: document.getElementById('prop-give-currency-enabled').checked,
        trigger: document.getElementById('give-currency-trigger').value,
        currency: document.getElementById('give-currency-list').value,
        amount: parseInt(document.getElementById('give-currency-amount').value),
        deleteAfter: document.getElementById('give-currency-delete-after').checked
        };

        selectedAsciiArt.giveObject = {
        enabled: document.getElementById('prop-give-object-enabled').checked,
        trigger: document.getElementById('give-object-trigger').value,
        object: document.getElementById('give-object-list').value,
        deleteAfter: document.getElementById('give-object-delete-after').checked
        };


        // Update the property box and scene panel
        updatePropertyBox(selectedAsciiArt);
        updateScenePanelHighlight(selectedAsciiArt);
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


// Event listener for adding custom keybindings
// Add a new keybinding
document.getElementById('add-global-keybinding').addEventListener('click', () => {
    const key = document.getElementById('global-key-input').value;
    const action = document.getElementById('global-action-select').value;

    if (key && action) {
        keyBindings[key] = action; // Add to keyBindings object
        updateKeybindList(); // Refresh the keybindings list
        document.getElementById('global-key-input').value = ''; // Clear input field
        silentSaveGameState // Save new keybinds to save state
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

            // // Get position of the object on screen to position the context menu when clicked, not currently used
            // const artRect = asciiObject.element.getBoundingClientRect();
            // alert(`Selected: ${asciiObject.itemName || `Object ${index + 1}`} to open context menu, positioning at (${artRect.left}, ${artRect.top})`);
            // showContextMenu(artRect.left, artRect.top, asciiObject);
        });

        objectList.appendChild(listItem);
    });
}

// Update the list of currencies
function updateCurrencyList() {
    const currencyList = document.getElementById('editor-currency-list');
    if (!currencyList) return;
    currencyList.innerHTML = '';

    const currencies = window.persistentSettings?.currencies || {};
    for (const [name, value] of Object.entries(currencies)) {
        const li = document.createElement('li');
        li.textContent = `${name}: `;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = value;
        input.style.width = '50px';

        let inputTimeout;
        input.addEventListener('input', () => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                window.persistentSettings.currencies[name] = parseInt(input.value) || 0;
                silentSaveGameState();
            }, 500);
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = '✖';
        delBtn.classList.add('delete-x');
        delBtn.addEventListener('click', () => {
            if (confirm(`Delete currency '${name}'?`)) {
                delete window.persistentSettings.currencies[name];
                updateCurrencyList();
                silentSaveGameState();
            }
        });

        li.appendChild(input);
        li.appendChild(delBtn);
        currencyList.appendChild(li);
    }
}

// Update the list of stat effects for objects
function updateObjectLibraryEffects() {
    const statList = document.getElementById('object-stat-effects-list');
    if (!statList) return;
    statList.innerHTML = '';

    window.persistentSettings = window.persistentSettings || {};
    window.persistentSettings.objects = window.persistentSettings.objects || [];
    window.persistentSettings.objectEffects = window.persistentSettings.objectEffects || {};
    window.persistentSettings.playerStats = window.persistentSettings.playerStats || {
        health: 100,
        mana: 50,
        strength: 10,
        agility: 8
    };

    const objectEffects = window.persistentSettings.objectEffects;
    const objectNames = window.persistentSettings.objects;
    const stats = Object.keys(window.persistentSettings.playerStats);

    objectNames.forEach(name => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.textContent = name;

        const statDropdown = document.createElement('select');
        stats.forEach(stat => {
            const option = document.createElement('option');
            option.value = stat;
            option.textContent = stat;
            statDropdown.appendChild(option);
        });

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.placeholder = '+/-';
        amountInput.style.width = '50px';

        let amountTimeout;
        amountInput.addEventListener('input', () => {
            clearTimeout(amountTimeout);
            amountTimeout = setTimeout(() => {
                window.persistentSettings.objectEffects[name] = window.persistentSettings.objectEffects[name] || {};
                window.persistentSettings.objectEffects[name].amount = parseInt(amountInput.value) || 0;
                silentSaveGameState();
            }, 500);
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = '✖';
        delBtn.classList.add('delete-x');
        delBtn.addEventListener('click', () => {
            delete window.persistentSettings.objectEffects[name];
            silentSaveGameState();
            updateObjectLibraryEffects();
        });

        statDropdown.addEventListener('change', () => {
            window.persistentSettings.objectEffects[name] = window.persistentSettings.objectEffects[name] || {};
            window.persistentSettings.objectEffects[name].stat = statDropdown.value;
            silentSaveGameState();
        });

        if (objectEffects[name]) {
            const effect = objectEffects[name];
            if (effect.stat && stats.includes(effect.stat)) {
                statDropdown.value = effect.stat;
            }
            if (typeof effect.amount === 'number') {
                amountInput.value = effect.amount;
            }
        }

        li.appendChild(label);
        li.appendChild(statDropdown);
        li.appendChild(amountInput);
        li.appendChild(delBtn);
        statList.appendChild(li);
    });
}

// Highlight the selected object in the list
function highlightSelectedListItem(selectedItem) {
    const listItems = document.querySelectorAll('#object-list li');
    listItems.forEach(item => item.classList.remove('selected'));
    // selectedItem.classList.add('selected'); // for highlighting object in objects in scene
}


// Update the list of keybindings
// function updateKeyBindingsList() {
//     const keyBindingsList = document.getElementById('keybindings-ul');
//     keyBindingsList.innerHTML = ''; // Clear the current list

//     Object.entries(keyBindings).forEach(([key, action]) => {
//         const listItem = document.createElement('li');
//         listItem.textContent = `${key} for ${action}`;
//         keyBindingsList.appendChild(listItem);
//     });
// }

function updateKeybindList() {
    const ul = document.getElementById('keybindings-ul');
    ul.innerHTML = '';

    for (const key in keyBindings) {
        const li = document.createElement('li');
        li.textContent = `${key}: ${keyBindings[key]}`;

        const delBtn = document.createElement('button1');
        delBtn.textContent = '✖';
        delBtn.classList.add('delete-x');
        delBtn.addEventListener('click', () => {
            if (confirm(`Delete keybind for '${key}'?`)) {
                delete keyBindings[key];
                updateKeybindList();
                silentSaveGameState();
            }
        });

        li.appendChild(delBtn);
        ul.appendChild(li);
    }
}

// Update the Scenes in list when called
function updateSceneList() {
    const sceneList = document.getElementById('scene-list');
    const total = document.getElementById('scene-total');

    sceneList.innerHTML = '';
    const sceneKeys = Object.keys(scenes);
    total.textContent = sceneKeys.length;

    sceneKeys.forEach(sceneName => {
        const li = document.createElement('li');
        li.textContent = sceneName;

        // Delete button
        const delBtn = document.createElement('button1');
        delBtn.textContent = '✖';
        delBtn.classList.add('delete-x');
        delBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete scene: "${sceneName}"?`)) {
                delete scenes[sceneName];
                updateSceneList();
                silentSaveGameState();
            }
        });

        li.appendChild(delBtn);
        sceneList.appendChild(li);
    });
}

// Clears canvas of objects
document.getElementById('clear-canvas').addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all ASCII objects from the canvas?")) {
        asciiObjects.forEach(obj => {
            obj.element.remove();
        });
        asciiObjects = [];
        refreshItemsInSceneBox(); // updates sidebar
    }
});



// Call this function whenever an object is added, removed, or updated
function refreshItemsInSceneBox() {
    setTimeout(() => {
        updateItemsInSceneBox();
        updateKeybindList();
        initializeContextMenuEvents();
        updateCurrencyList();
        updateObjectLibraryEffects();
    }, 50); // Ensure DOM has rendered completely
}



// Listen for keydown events globally to trigger actions no longer needed as that will only be used in the final render
// document.addEventListener('keydown', (event) => {
//     const key = event.key;  // Get the key that was pressed
//     if (keyBindings[key]) {
//         const action = keyBindings[key];
//         alert(`Action triggered for '${key}': ${action}`);
//         performAction(action); // Trigger the action associated with the keybinding
//     }
// });

//for making panels open and closable
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".panel-box").forEach(panel => {
      const header = panel.querySelector(".panel-header");
      const content = panel.querySelector(".panel-content");
  
      header.addEventListener("click", () => {
        panel.classList.toggle("collapsed");
        content.style.display = panel.classList.contains("collapsed") ? "none" : "block";
      });
  
      // Set initial visibility
      content.style.display = panel.classList.contains("collapsed") ? "none" : "block";
    });
    setupGlobalSettingsUI(); // Initialize global settings UI
  });
  
  

// used to swap to settings page
document.getElementById('settings-button').addEventListener('click', () => {
    saveGameState(); // Serialize and save the current scenes and game state

    // Check if it is saving correctly
    const savedState = localStorage.getItem('gameState');
    console.log("Saved State Before Navigation:", JSON.parse(savedState));

    // Navigate to settings.html
    setTimeout(() => {
        window.location.href = 'settings.html';
    }, 500);
});

// used to load where left off when returning/loading site
window.addEventListener('load', () => {
    loadGameState() // Load the saved game state from localStorage
    refreshItemsInSceneBox(); // Refresh the items in the scene box
    updateSceneList(); // Updates the scene list on load
    
    console.log("Loaded State After Return:", window.persistentSettings);

    const inventoryCheckbox = document.getElementById('enable-inventory');
    if (window.persistentSettings.inventoryEnabled) {
        console.log("Inventory is enabled!");
        inventoryCheckbox.checked = true;
    } else {
        console.log("Inventory is not enabled.");
        inventoryCheckbox.checked = false;
    }

});

// Setup context menu behavior for object-specific property changes
function initializeContextMenuEvents() {
    populateSceneDropdown();// Populate the scene dropdown with available scenes
    populateGiveDropdowns(); // Populate currency and object dropdowns

    // Clickable toggle
    document.getElementById('prop-clickable').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.clickable = this.checked;
      }
    });
  
    // Main Player toggle
    document.getElementById('prop-main-player').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.mainCharacter = this.checked;
      }
    });
  
    // Collision toggle
    document.getElementById('prop-collision').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.collision = this.checked;
      }
    });
  
    // Invisible toggle
    document.getElementById('prop-invisible').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.visible = !this.checked;
        selectedAsciiArt.element.style.opacity = this.checked ? "0" : "1";
      }
    });
  
    // SWITCH SCENE
    document.getElementById('prop-switch-scene-enabled').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.switchScene.enabled = this.checked;
      }
    });
  
    document.getElementById('switch-scene-trigger').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.switchScene.trigger = this.value;
      }
    });
  
    document.getElementById('switch-scene-list').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.switchScene.target = this.value;
      }
    });
  
    // GIVE CURRENCY
    document.getElementById('prop-give-currency-enabled').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveCurrency.enabled = this.checked;
      }
    });
  
    document.getElementById('give-currency-trigger').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveCurrency.trigger = this.value;
      }
    });
  
    document.getElementById('give-currency-list').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveCurrency.currency = this.value;
      }
    });
  
    document.getElementById('give-currency-amount').addEventListener('input', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveCurrency.amount = parseInt(this.value) || 0;
      }
    });
  
    document.getElementById('give-currency-delete-after').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveCurrency.deleteAfter = this.checked;
      }
    });
  
    // GIVE OBJECT
    document.getElementById('prop-give-object-enabled').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveObject.enabled = this.checked;
      }
    });
  
    document.getElementById('give-object-trigger').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveObject.trigger = this.value;
      }
    });
  
    document.getElementById('give-object-list').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveObject.object = this.value;
      }
    });
  
    document.getElementById('give-object-delete-after').addEventListener('change', function () {
      if (selectedAsciiArt) {
        selectedAsciiArt.giveObject.deleteAfter = this.checked;
      }
    });
}

// Populate the scene dropdown with available scenes
function populateSceneDropdown() {
    const dropdown = document.getElementById('switch-scene-list');
    dropdown.innerHTML = ''; // Clear existing options
  
    // Add a default placeholder
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Scene --';
    dropdown.appendChild(defaultOption);
  
    // Add each scene from the current scenes object
    Object.keys(scenes).forEach(sceneName => {
      const option = document.createElement('option');
      option.value = sceneName;
      option.textContent = sceneName;
      dropdown.appendChild(option);
    });
}

// Populates currency and object dropdowns in the context menu
function populateGiveDropdowns() {
    const currencyList = document.getElementById('give-currency-list');
    const objectList = document.getElementById('give-object-list');

    currencyList.innerHTML = '';
    objectList.innerHTML = '';

    // Populate currencies
    const currencies = window.persistentSettings?.currencies || {};
    for (const key in currencies) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = key;
        currencyList.appendChild(opt);
    }

    // Populate objects
    const objects = window.persistentSettings?.objects || [];
    objects.forEach(obj => {
        const opt = document.createElement('option');
        opt.value = obj;
        opt.textContent = obj;
        objectList.appendChild(opt);
    });
}


  

// function for clearing local storage using button with id clear-storage
document.getElementById('clear-storage').addEventListener('click', () => {
    localStorage.clear();
    alert('Local storage cleared!');
    loadScene('default'); // Load the default scene after clearing local storage
    keyBindings = {}; // Clear keybindings
    window.location.reload();
    refreshItemsInSceneBox(); // Refresh the items in the scene box
});

// function that can be callable to save the game state from anywere.
function saveGameState() {
    const gameState = {
        sceneList: scenes,
        saveCurrentScene: currentScene,
        saveCustomKeyBindings: keyBindings,
        persistentSettings: {
            rpgEnabled: true,
            inventory: [],
            currencies: window.persistentSettings?.currencies || {},
            objects: window.persistentSettings?.objects || [],
            objectEffects: window.persistentSettings?.objectEffects || {},
            toolbar: {
                enabled: window.persistentSettings?.toolbar?.enabled || false,
                statsToDisplay: window.persistentSettings?.toolbar?.statsToDisplay || []
            },
            playerStats: window.persistentSettings?.playerStats || {
                health: 100,
                mana: 50,
                strength: 10,
                agility: 8
            },
            inventoryEnabled: window.persistentSettings?.inventoryEnabled || false // Ensure inventoryEnabled exists
        }
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
    alert(`Saved ${Object.keys(scenes).length} scenes to local storage!`);
}
// Function to silently save the game state without user interaction
function silentSaveGameState() {
    // Ensure inventoryEnabled exists
    if (typeof window.persistentSettings.inventoryEnabled === 'undefined') {
        window.persistentSettings.inventoryEnabled = false;
    }


    const gameState = {
      sceneList: scenes,
      saveCurrentScene: currentScene,
      saveCustomKeyBindings: keyBindings,
      persistentSettings: window.persistentSettings
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }


// Function to load the game state from local storage
function loadGameState() {
    const savedGameState = localStorage.getItem('gameState');
    if (savedGameState) {
        const gameState = JSON.parse(savedGameState);
        sceneManager.loadScenes(gameState.sceneList);
        currentScene = gameState.saveCurrentScene;
        loadScene(currentScene);
        keyBindings = gameState.saveCustomKeyBindings;

        // Handle persistent RPG data
        if (!gameState.persistentSettings) {
            gameState.persistentSettings = {
                rpgEnabled: false,
                inventory: [],
                currencies: {},
                objects: [],
                toolbar: { enabled: false, statsToDisplay: [] },
                playerStats: { health: 100, mana: 50, strength: 10, agility: 8 },
                inventoryEnabled: false  // <-- This is always defined now
            };
        }

        window.persistentSettings = gameState.persistentSettings;

        // Load inventoryEnabled correctly
        if (gameState.persistentSettings.inventoryEnabled) {
            document.getElementById('enable-inventory').checked = true;
        } else {
            document.getElementById('enable-inventory').checked = false;
        }


        console.log('Game state loaded successfully!');
        console.log(`Current Scene: ${currentScene}\nAvailable Scenes: ${Object.keys(scenes).join(', ')}`);
    } else {
        alert('No saved game state found.');
    }
}


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

// Utility Functions for RPG Actions === //

function giveCurrency(currencyName, amount) {
    if (!window.persistentSettings.currencies[currencyName]) {
        window.persistentSettings.currencies[currencyName] = 0;
    }
    window.persistentSettings.currencies[currencyName] += amount;
    renderToolbar();
}

function addItemToInventory(itemName) {
    window.persistentSettings.inventory.push(itemName);
    renderInventoryPopup();
}

function renderToolbar() {
    if (!window.persistentSettings.toolbar.enabled) return;
    // placeholder logic to draw toolbar
    console.log("Toolbar stats:", window.persistentSettings.toolbar.statsToDisplay);
}

function renderInventoryPopup() {
    if (!window.persistentSettings.rpgEnabled) return;
    // placeholder logic to display inventory popup
    console.log("Inventory:", window.persistentSettings.inventory);
}

function setupGlobalSettingsUI() {
    const rpgToggle = document.getElementById('enable-rpg-mechanics');
    const rpgConfig = document.getElementById('rpg-stats-config');
    const currencyNameInput = document.getElementById('new-currency-name');
    const currencyValueInput = document.getElementById('new-currency-value');
    const objectNameInput = document.getElementById('new-object-name');
    const objectList = document.getElementById('object-library-list');

    // Show/hide RPG stat inputs
    rpgToggle?.addEventListener('change', function () {
        rpgConfig.style.display = this.checked ? 'block' : 'none';
        if (window.persistentSettings) {
            window.persistentSettings.rpgEnabled = this.checked;
        }
    });

    // Add currency
    document.getElementById('add-currency')?.addEventListener('click', function () {
        const name = currencyNameInput.value.trim();
        const value = parseInt(currencyValueInput.value);
        if (name && !isNaN(value)) {
            if (!window.persistentSettings.currencies) {
                window.persistentSettings.currencies = {};
            }
            window.persistentSettings.currencies[name] = value;
            currencyNameInput.value = '';
            currencyValueInput.value = '';
            silentSaveGameState();
            updateCurrencyList();
            updateItemsInSceneBox();
            updateContextMenuEvents();
            
            
        } else {
            alert("Enter a valid currency name and value.");
        }
    });

    // Add object
    document.getElementById('add-object-button')?.addEventListener('click', function () {
        const objName = objectNameInput.value.trim();
        if (objName) {
            if (!window.persistentSettings.objects.includes(objName)) {
                window.persistentSettings.objects.push(objName);

                // const li = document.createElement('li');
                // li.textContent = objName;
                // objectList.appendChild(li);
                
                silentSaveGameState();
                updateObjectLibraryEffects();
                updateItemsInSceneBox();
            }
            objectNameInput.value = '';
        } else {
            alert("Please enter a valid object name.");
        }
    });

    // Load toolbar toggle states
    document.getElementById('enable-toolbar')?.addEventListener('change', function () {
        if (window.persistentSettings?.toolbar) {
            window.persistentSettings.toolbar.enabled = this.checked;
        }
    });

    // Enable Inventory Toggle
    document.getElementById('enable-inventory').addEventListener('change', function () {
        // Update the persistent settings with the new state
        window.persistentSettings = window.persistentSettings || {};
        window.persistentSettings.inventoryEnabled = this.checked;
    
        // Call the silent save to update localStorage
        silentSaveGameState();
        
    // Log for verification
    console.log("Inventory Enabled State Saved:", window.persistentSettings.inventoryEnabled);
    });
    
      
}
  


// Refresh items in scene box when the page loads
refreshItemsInSceneBox();