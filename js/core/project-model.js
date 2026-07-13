(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};

  function deepClone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function finiteNumber(value, fallback) {
    const number = typeof value === 'string' ? parseFloat(value) : Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function createDefaultPersistentSettings() {
    return {
      rpgEnabled: false,
      inventory: [],
      currencies: {},
      objects: [],
      objectEffects: {},
      toolbar: { enabled: false, statsToDisplay: [] },
      playerStats: {
        health: 100,
        mana: 50,
        strength: 10,
        agility: 8
      },
      inventoryEnabled: false
    };
  }

  function normalizePersistentSettings(input) {
    const defaults = createDefaultPersistentSettings();
    const source = input && typeof input === 'object' ? input : {};
    return {
      rpgEnabled: source.rpgEnabled === true,
      inventory: Array.isArray(source.inventory) ? deepClone(source.inventory) : defaults.inventory,
      currencies: source.currencies && typeof source.currencies === 'object'
        ? deepClone(source.currencies)
        : defaults.currencies,
      objects: Array.isArray(source.objects) ? source.objects.slice() : defaults.objects,
      objectEffects: source.objectEffects && typeof source.objectEffects === 'object'
        ? deepClone(source.objectEffects)
        : defaults.objectEffects,
      toolbar: {
        enabled: source.toolbar && source.toolbar.enabled === true,
        statsToDisplay: source.toolbar && Array.isArray(source.toolbar.statsToDisplay)
          ? source.toolbar.statsToDisplay.slice()
          : defaults.toolbar.statsToDisplay
      },
      playerStats: Object.assign({}, defaults.playerStats,
        source.playerStats && typeof source.playerStats === 'object' ? deepClone(source.playerStats) : {}),
      inventoryEnabled: source.inventoryEnabled === true
    };
  }

  function defaultColors() {
    return {
      default: '#000000',
      hover: { enabled: false, color: '#000000' },
      click: { enabled: false, color: '#000000' }
    };
  }

  function defaultSwitchScene() {
    return { enabled: false, trigger: 'click', target: null };
  }

  function defaultGiveCurrency() {
    return { enabled: false, trigger: 'click', currency: null, amount: 0, deleteAfter: true };
  }

  function defaultGiveObject() {
    return { enabled: false, trigger: 'click', object: null, deleteAfter: true };
  }

  function normalizeObject(input) {
    const source = input && typeof input === 'object' ? input : {};
    const colors = source.colors && typeof source.colors === 'object' ? source.colors : {};
    const hover = colors.hover && typeof colors.hover === 'object' ? colors.hover : {};
    const click = colors.click && typeof colors.click === 'object' ? colors.click : {};
    const switchScene = source.switchScene && typeof source.switchScene === 'object'
      ? source.switchScene
      : {};
    const giveCurrency = source.giveCurrency && typeof source.giveCurrency === 'object'
      ? source.giveCurrency
      : {};
    const giveObject = source.giveObject && typeof source.giveObject === 'object'
      ? source.giveObject
      : {};
    const colorDefaults = defaultColors();
    const switchDefaults = defaultSwitchScene();
    const currencyDefaults = defaultGiveCurrency();
    const objectDefaults = defaultGiveObject();

    const normalized = {
      ascii: typeof source.ascii === 'string' ? source.ascii : '',
      left: finiteNumber(source.left, 0),
      top: finiteNumber(source.top, 0),
      colors: {
        default: typeof colors.default === 'string' ? colors.default : colorDefaults.default,
        hover: {
          enabled: hover.enabled === true,
          color: typeof hover.color === 'string' ? hover.color : colorDefaults.hover.color
        },
        click: {
          enabled: click.enabled === true,
          color: typeof click.color === 'string' ? click.color : colorDefaults.click.color
        }
      },
      clickable: source.clickable === true,
      visible: source.visible !== false,
      mainCharacter: source.mainCharacter === true,
      collision: source.collision !== false,
      switchScene: {
        enabled: switchScene.enabled === true,
        trigger: switchScene.trigger === 'touch' ? 'touch' : switchDefaults.trigger,
        target: typeof switchScene.target === 'string' ? switchScene.target : switchDefaults.target
      },
      giveCurrency: {
        enabled: giveCurrency.enabled === true,
        trigger: giveCurrency.trigger === 'touch' ? 'touch' : currencyDefaults.trigger,
        currency: typeof giveCurrency.currency === 'string' ? giveCurrency.currency : currencyDefaults.currency,
        amount: finiteNumber(giveCurrency.amount, currencyDefaults.amount),
        deleteAfter: giveCurrency.deleteAfter !== false
      },
      giveObject: {
        enabled: giveObject.enabled === true,
        trigger: giveObject.trigger === 'touch' ? 'touch' : objectDefaults.trigger,
        object: typeof giveObject.object === 'string' ? giveObject.object : objectDefaults.object,
        deleteAfter: giveObject.deleteAfter !== false
      },
      targetScene: typeof source.targetScene === 'string' ? source.targetScene : null,
      targetObjectName: typeof source.targetObjectName === 'string' ? source.targetObjectName : null,
      itemName: typeof source.itemName === 'string' ? source.itemName : ''
    };

    if (typeof source._editorId === 'string') normalized._editorId = source._editorId;
    return normalized;
  }

  function createDefaultObject(overrides) {
    return normalizeObject(overrides || {});
  }

  function normalizeScene(objects) {
    let mainCharacterFound = false;
    return (Array.isArray(objects) ? objects : []).map(function (input) {
      const object = normalizeObject(input);
      if (object.mainCharacter) {
        object.mainCharacter = !mainCharacterFound;
        mainCharacterFound = true;
      }
      return object;
    });
  }

  function serializeObject(input) {
    const object = normalizeObject(input);
    return {
      ascii: object.ascii,
      left: object.left,
      top: object.top,
      colors: deepClone(object.colors),
      clickable: object.clickable,
      visible: object.visible,
      mainCharacter: object.mainCharacter,
      collision: object.collision,
      giveCurrency: deepClone(object.giveCurrency),
      switchScene: deepClone(object.switchScene),
      giveObject: deepClone(object.giveObject),
      targetScene: object.targetScene,
      targetObjectName: object.targetObjectName,
      itemName: object.itemName
    };
  }

  function serializeScene(objects) {
    return normalizeScene(objects).map(serializeObject);
  }

  function cloneScene(objects) {
    return normalizeScene(deepClone(Array.isArray(objects) ? objects : []));
  }

  namespace.ProjectModel = {
    createDefaultObject: createDefaultObject,
    createDefaultPersistentSettings: createDefaultPersistentSettings,
    normalizePersistentSettings: normalizePersistentSettings,
    normalizeObject: normalizeObject,
    normalizeScene: normalizeScene,
    cloneScene: cloneScene,
    serializeObject: serializeObject,
    serializeScene: serializeScene,
    deepClone: deepClone
  };
})(window);
