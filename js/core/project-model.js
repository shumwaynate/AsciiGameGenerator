(function (global) {
  'use strict';

  const namespace = global.AsciiGameGenerator = global.AsciiGameGenerator || {};

  function deepClone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function finiteNumber(value, fallback) {
    if (typeof value !== 'number' && typeof value !== 'string') return fallback;
    const number = typeof value === 'string' ? parseFloat(value) : Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function safeName(name) {
    return !['__proto__', 'prototype', 'constructor'].includes(name);
  }

  function stringList(value) {
    return Array.isArray(value) ? value.filter(function (entry) { return typeof entry === 'string'; }) : [];
  }

  function resolveSceneName(scenes, current) {
    return typeof current === 'string' && Object.prototype.hasOwnProperty.call(scenes, current)
      ? current : (Object.keys(scenes)[0] || null);
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
    const source = isRecord(input) ? input : {};
    const currencies = {};
    Object.entries(isRecord(source.currencies) ? source.currencies : {}).forEach(function (entry) {
      if (safeName(entry[0])) currencies[entry[0]] = finiteNumber(entry[1], 0);
    });
    const playerStats = Object.assign({}, defaults.playerStats);
    Object.entries(isRecord(source.playerStats) ? source.playerStats : {}).forEach(function (entry) {
      if (safeName(entry[0])) playerStats[entry[0]] = finiteNumber(entry[1], defaults.playerStats[entry[0]] || 0);
    });
    const objectEffects = {};
    Object.entries(isRecord(source.objectEffects) ? source.objectEffects : {}).forEach(function (entry) {
      if (safeName(entry[0]) && isRecord(entry[1])) {
        objectEffects[entry[0]] = { stat: typeof entry[1].stat === 'string' ? entry[1].stat : 'health', amount: finiteNumber(entry[1].amount, 0) };
      }
    });
    return {
      rpgEnabled: source.rpgEnabled === true,
      inventory: stringList(source.inventory),
      currencies: currencies,
      objects: stringList(source.objects).filter(safeName),
      objectEffects: objectEffects,
      toolbar: {
        enabled: source.toolbar && source.toolbar.enabled === true,
        statsToDisplay: stringList(source.toolbar && source.toolbar.statsToDisplay)
      },
      playerStats: playerStats,
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
        currency: typeof giveCurrency.currency === 'string' && safeName(giveCurrency.currency) ? giveCurrency.currency : currencyDefaults.currency,
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
    isRecord: isRecord,
    safeName: safeName,
    resolveSceneName: resolveSceneName,
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
