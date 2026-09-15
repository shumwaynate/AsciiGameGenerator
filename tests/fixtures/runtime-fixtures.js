(function (global) {
  'use strict';

  function object(overrides) {
    return Object.assign({
      ascii: '@',
      itemName: '',
      left: 0,
      top: 0,
      visible: true,
      mainCharacter: false,
      clickable: false,
      collision: false,
      colors: {
        default: '#000000',
        hover: { enabled: false, color: '#000000' },
        click: { enabled: false, color: '#000000' }
      },
      switchScene: { enabled: false, trigger: 'click', target: null },
      giveCurrency: { enabled: false, trigger: 'click', currency: null, amount: 0, deleteAfter: false },
      giveObject: { enabled: false, trigger: 'click', object: null, deleteAfter: false }
    }, overrides || {});
  }

  function project(sceneList, currentScene, persistentSettings) {
    return {
      sceneList: sceneList,
      saveCurrentScene: currentScene,
      saveCustomKeyBindings: { i: 'toggleInventory' },
      persistentSettings: Object.assign({
        inventoryEnabled: true,
        inventory: [],
        currencies: {}
      }, persistentSettings || {})
    };
  }

  global.RuntimeFixtures = {
    object: object,
    project: project,
    empty: project({ empty: [] }, 'empty'),
    oneMain: project({ room: [object({ itemName: 'player', mainCharacter: true })] }, 'room'),
    twoMain: project({
      room: [
        object({ ascii: '1', itemName: 'first', mainCharacter: true }),
        object({ ascii: '2', itemName: 'second', left: 40, mainCharacter: true })
      ]
    }, 'room')
  };
})(window);
