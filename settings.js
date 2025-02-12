// Event listener for saving export settings
document.getElementById('saveExportSettings').addEventListener('click', () => {
    const exportFormat = document.getElementById('exportFormat').value;

    if (exportFormat) {
        console.log(`Export format saved as: ${exportFormat}`);
        // Save export format to local storage for later use
        localStorage.setItem('exportFormat', exportFormat);
        alert('Export format saved!');
    } else {
        alert('Please select a valid export format.');
    }
});

// Event listener for exporting project
document.getElementById('exportProject').addEventListener('click', () => {
    const savedState = localStorage.getItem('gameState');

    if (savedState) {
        try {
            const blob = new Blob([savedState], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'gameProject.json';
            link.click();
        } catch (error) {
            console.error('Error exporting project:', error);
            alert('An error occurred while exporting the project.');
        }
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
            try {
                const projectData = JSON.parse(e.target.result);
                console.log('Project imported:', projectData);

                // Save the imported data to localStorage
                localStorage.setItem('gameState', JSON.stringify(projectData));
                alert('Project imported successfully!');
            } catch (error) {
                console.error('Error processing imported file:', error);
                alert('The selected file is not a valid project file.');
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please select a file to import.');
    }
});

// Event listener for saving screen size settings
document.getElementById('saveScreenSize').addEventListener('click', () => {
    const screenWidth = parseInt(document.getElementById('screenWidth').value, 10);
    const screenHeight = parseInt(document.getElementById('screenHeight').value, 10);

    if (Number.isInteger(screenWidth) && Number.isInteger(screenHeight) && screenWidth > 0 && screenHeight > 0) {
        const settings = {
            screenWidth,
            screenHeight,
        };

        localStorage.setItem('editorSettings', JSON.stringify(settings));
        alert('Screen size settings saved!');
    } else {
        alert('Please enter valid screen dimensions (positive numbers).');
    }
});

// Reload settings on page load
window.addEventListener('load', () => {
    const savedSettings = localStorage.getItem('editorSettings');

    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            document.getElementById('screenWidth').value = settings.screenWidth || '';
            document.getElementById('screenHeight').value = settings.screenHeight || '';
        } catch (error) {
            console.error('Error loading saved settings:', error);
        }
    } else {
        // Set default values if no settings are saved
        document.getElementById('screenWidth').value = '800';
        document.getElementById('screenHeight').value = '600';
    }
});

// Event listener for navigating back to the editor
document.getElementById('home-button').addEventListener('click', () => {
    window.location.href = 'index.html'; // Adjust the path if necessary
});
