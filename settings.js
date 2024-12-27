// settings.js

// Event listener for saving export settings
document.getElementById('saveExportSettings').addEventListener('click', () => {
    const exportFormat = document.getElementById('exportFormat').value;
    console.log(`Export format saved as: ${exportFormat}`);
    // You can add logic here to save export settings to local storage or send them to a server.
});

document.getElementById('exportProject').addEventListener('click', () => {
    const savedState = localStorage.getItem('gameState');

    if (savedState) {
        const blob = new Blob([savedState], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'gameProject.json';
        link.click();
    } else {
        alert('No project data available to export.');
    }
});




// Event listener for importing a project
document.getElementById('importProject').addEventListener('click', () => {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const projectData = e.target.result;
            console.log('Project imported:', projectData);
            // Process the imported project data here
        };
        reader.readAsText(file);
    } else {
        alert('Please select a file to import.');
    }
});

// Event listener for saving screen size settings
document.getElementById('saveScreenSize').addEventListener('click', () => {
    const screenWidth = document.getElementById('screenWidth').value;
    const screenHeight = document.getElementById('screenHeight').value;

    if (screenWidth && screenHeight) {
        const settings = {
            screenWidth,
            screenHeight,
        };

        localStorage.setItem('editorSettings', JSON.stringify(settings));
        alert('Screen size settings saved!');
    } else {
        alert('Please enter valid screen dimensions.');
    }
});

// Used to reload settings on reload
window.addEventListener('load', () => {
    const savedSettings = localStorage.getItem('editorSettings');

    if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        document.getElementById('screenWidth').value = settings.screenWidth || '';
        document.getElementById('screenHeight').value = settings.screenHeight || '';
    }
});


// Event listener for navigating back to the editor
document.getElementById('home-button').addEventListener('click', () => {
    window.location.href = 'index.html'; // Adjust the path if necessary
});
