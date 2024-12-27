// settings.js

// Event listener for saving export settings
document.getElementById('saveExportSettings').addEventListener('click', () => {
    const exportFormat = document.getElementById('exportFormat').value;
    console.log(`Export format saved as: ${exportFormat}`);
    // You can add logic here to save export settings to local storage or send them to a server.
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
        console.log(`Screen size saved as: ${screenWidth}x${screenHeight}`);
        // Add logic to validate and save the screen size settings
    } else {
        alert('Please enter both width and height.');
    }
});

// Event listener for navigating back to the editor
document.getElementById('home-button').addEventListener('click', () => {
    window.location.href = 'index.html'; // Adjust the path if necessary
});
