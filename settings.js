// file: settings.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("settings.js is loaded and DOM is ready!");

    // Event listener for saving export settings
    const saveExportSettings = document.getElementById('saveExportSettings');
    if (saveExportSettings) {
        saveExportSettings.addEventListener('click', () => {
            const exportFormat = document.getElementById('exportFormat').value;
            if (exportFormat) {
                console.log(`Export format saved as: ${exportFormat}`);
                localStorage.setItem('exportFormat', exportFormat);
                alert('Export format saved!');
            } else {
                alert('Please select a valid export format.');
            }
        });
    }

    // Event listener for exporting project
    const exportProject = document.getElementById('exportProject');
    if (exportProject) {
        exportProject.addEventListener('click', () => {
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
    }

    // Event listener for importing a project
    const importProject = document.getElementById('importProject');
    if (importProject) {
        importProject.addEventListener('click', () => {
            const fileInput = document.getElementById('importFile');
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const projectData = JSON.parse(e.target.result);
                        console.log('Project imported:', projectData);
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
    }

    // Event listener for saving screen size settings
    const saveScreenSize = document.getElementById('saveScreenSize');
    if (saveScreenSize) {
        saveScreenSize.addEventListener('click', () => {
            const screenWidth = parseInt(document.getElementById('screenWidth').value, 10);
            const screenHeight = parseInt(document.getElementById('screenHeight').value, 10);

            if (Number.isInteger(screenWidth) && Number.isInteger(screenHeight) && screenWidth > 0 && screenHeight > 0) {
                const settings = { screenWidth, screenHeight };
                localStorage.setItem('editorSettings', JSON.stringify(settings));
                alert('Screen size settings saved!');
            } else {
                alert('Please enter valid screen dimensions (positive numbers).');
            }
        });
    }

    // Reload settings on page load
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
        document.getElementById('screenWidth').value = '800';
        document.getElementById('screenHeight').value = '600';
    }

    // Home button navigation
    const homeButton = document.getElementById('home-button');
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            console.log("Navigating back to index.html");
            window.location.href = 'index.html'; 
        });
    } else {
        console.error("Home button not found");
    }
});
