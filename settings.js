// file: settings.js
// Function to save both editor settings and the full game state
function readEditorSettingsForm() {
    return {
        screenWidth: parseInt(document.getElementById('screenWidth').value, 10),
        screenHeight: parseInt(document.getElementById('screenHeight').value, 10),
        position: Number(document.getElementById('positionSelect').value),
        allowDrag: document.getElementById('allowDragCheckbox').checked
    };
}

function showEditorSettings(settings) {
    document.getElementById('screenWidth').value = settings.screenWidth || '';
    document.getElementById('screenHeight').value = settings.screenHeight || '';
    document.getElementById('positionSelect').value = settings.position || 9;
    document.getElementById('allowDragCheckbox').checked = settings.allowDrag === true;
}

function saveEditorSettings() {
    const settings = readEditorSettingsForm();

    // Get saved game data (scenes, objects, toolbar settings)
    const gameState = JSON.parse(localStorage.getItem('gameState')) || {};
    
    const exportData = {
        editorSettings: settings,
        gameState: gameState
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'exported_project.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert('Project exported successfully!');
}

// Attach event listener to the export button
document.getElementById('saveExportSettings')?.addEventListener('click', saveEditorSettings);

// Function to import editor settings and game state
function importEditorSettings(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a file to import.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importData = JSON.parse(e.target.result);

            // Restore editor settings
            if (importData.editorSettings) {
                showEditorSettings(importData.editorSettings);
                localStorage.setItem('editorSettings', JSON.stringify(importData.editorSettings));
            }

            // Restore game state
            if (importData.gameState) {
                localStorage.setItem('gameState', JSON.stringify(importData.gameState));
            }

            alert('Project imported successfully! Click "Return to Editor" to see the restored game.');
        } catch (error) {
            console.error('Error importing settings:', error);
            alert('Invalid file format. Please select a valid exported project file.');
        }
    };

    reader.readAsText(file);
}

// Attach event listener to import file input
document.getElementById('importFile')?.addEventListener('change', importEditorSettings);

// Make the import project button import an example save
const exampleSave = 'Example Saves/DemoTest-103125.json';
document.getElementById('importProject').addEventListener('click', () => {
    fetch(exampleSave)
        .then(res => res.json())
        .then(importData => {
            if (importData.editorSettings) {
                showEditorSettings(importData.editorSettings);
                localStorage.setItem('editorSettings', JSON.stringify(importData.editorSettings));
            }
            if (importData.gameState) {
                localStorage.setItem('gameState', JSON.stringify(importData.gameState));
            }
            alert('Project imported successfully! Click "Return to Editor" to see the restored game.');
        })
        .catch(err => {
            console.error('Error importing example save:', err);
            alert('Failed to load example project.');
        });
});

// Function to save screen size settings
document.getElementById('saveScreenSize')?.addEventListener('click', () => {
    const screenWidth = parseInt(document.getElementById('screenWidth').value, 10);
    const screenHeight = parseInt(document.getElementById('screenHeight').value, 10);

    if (Number.isInteger(screenWidth) && Number.isInteger(screenHeight) && screenWidth > 0 && screenHeight > 0) {
        const settings = readEditorSettingsForm();
        localStorage.setItem('editorSettings', JSON.stringify(settings));
        alert('Screen size and placement saved!');
    } else {
        alert('Please enter valid screen dimensions.');
    }
});

// Load saved settings on page load
const savedSettings = localStorage.getItem('editorSettings');
if (savedSettings) {
    try {
        const settings = JSON.parse(savedSettings);
        showEditorSettings(settings);
    } catch (error) {
        console.error('Error loading saved settings:', error);
    }
}

// Home button navigation
document.getElementById('home-button')?.addEventListener('click', () => {
    console.log("Navigating back to index.html");
    window.location.href = 'index.html'; 
});
