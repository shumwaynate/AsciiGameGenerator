// Settings and imports use the same project API as the editor.
const projectStorage = window.AsciiGameGenerator.projectStorage;
let importRequestId = 0;

function readEditorSettingsForm() {
  return {
    screenWidth: Number(document.getElementById('screenWidth').value),
    screenHeight: Number(document.getElementById('screenHeight').value),
    position: Number(document.getElementById('positionSelect').value),
    allowDrag: document.getElementById('allowDragCheckbox').checked
  };
}

function showEditorSettings(settings) {
  document.getElementById('screenWidth').value = settings.screenWidth;
  document.getElementById('screenHeight').value = settings.screenHeight;
  document.getElementById('positionSelect').value = settings.position;
  document.getElementById('allowDragCheckbox').checked = settings.allowDrag;
}

function reportSettings(message) {
  const status = document.getElementById('settings-status');
  status.textContent = message;
  status.hidden = false;
}

function refreshBackupButton() {
  try { document.getElementById('restore-backup').disabled = !projectStorage.hasBackup(); }
  catch (error) { document.getElementById('restore-backup').disabled = true; }
}

function saveEditorSettings() {
  try {
    const blob = new Blob([projectStorage.exportProject()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AsciiGameGenerator-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    reportSettings('Exported the saved project. Use Save Screen Size / Location before exporting changes to those fields.');
  } catch (error) { reportSettings(error.message); }
}

function acceptProject(text) {
  const result = projectStorage.importProject(text);
  showEditorSettings(result.project.editorSettings);
  refreshBackupButton();
  reportSettings('Project imported. Return to Editor to open it. ' + result.warnings.join(' '));
}

function importEditorSettings(event) {
  const file = event.target.files[0];
  if (!file) return;
  const requestId = ++importRequestId;
  const reader = new FileReader();
  reader.onload = function () {
    if (requestId !== importRequestId) return;
    try { acceptProject(reader.result); } catch (error) { reportSettings(error.message); }
    event.target.value = '';
  };
  reader.onerror = function () { if (requestId === importRequestId) reportSettings('The selected file could not be read. The current project is unchanged.'); };
  reader.readAsText(file);
}

document.getElementById('saveExportSettings').addEventListener('click', saveEditorSettings);
document.getElementById('importFile').addEventListener('change', importEditorSettings);
document.getElementById('importProject').addEventListener('click', async function () {
  const requestId = ++importRequestId;
  try {
    const response = await fetch('Example Saves/Garden-Trail.json');
    if (!response.ok) throw new Error('The example project could not be loaded. Try again from a local web server or the hosted editor.');
    const text = await response.text();
    if (requestId === importRequestId) acceptProject(text);
  } catch (error) { if (requestId === importRequestId) reportSettings(error.message); }
});
document.getElementById('restore-backup').addEventListener('click', function () {
  if (!confirm('Restore the project saved just before the latest import? This replaces the current saved project.')) return;
  importRequestId += 1;
  try {
    const result = projectStorage.restoreBackup();
    showEditorSettings(result.project.editorSettings);
    reportSettings('Pre-import backup restored. Return to Editor to open it.');
  } catch (error) { reportSettings(error.message); }
});
document.getElementById('saveScreenSize').addEventListener('click', function () {
  const settings = readEditorSettingsForm();
  if (![settings.screenWidth, settings.screenHeight].every(function (value) { return Number.isInteger(value) && value > 0 && value <= 10000; })) {
    reportSettings('Enter whole-number screen dimensions from 1 to 10000 pixels.');
    return;
  }
  try {
    projectStorage.updateEditorSettings(settings);
    reportSettings('Screen size and placement saved.');
  } catch (error) { reportSettings(error.message); }
});
document.getElementById('home-button').addEventListener('click', function () { window.location.href = 'index.html'; });

// Shared launch validation; neither adapter ever reads storage directly.
window.AsciiGameGenerator.prepareGameLaunch = function () {
  const project = projectStorage.playableProject();
  project.editorSettings = window.AsciiGameGenerator.ProjectStorage.normalizeEditorSettings(readEditorSettingsForm());
  return project;
};
try {
  const result = projectStorage.readProject();
  showEditorSettings(result.project.editorSettings);
  projectStorage.writeProject(result.project);
  if (result.warnings.length) reportSettings(result.warnings.join(' '));
} catch (error) {
  showEditorSettings(window.AsciiGameGenerator.ProjectStorage.normalizeEditorSettings());
  reportSettings(error.message + ' Import a valid project to recover.');
}
refreshBackupButton();
document.querySelectorAll('[data-app-version]').forEach(function (element) { element.textContent = window.AsciiGameGenerator.AppInfo.version; });
