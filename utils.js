
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Me = imports.misc.extensionUtils.getCurrentExtension();

function Utils() {
  this._init();
}

Utils.prototype = {

  _settingsObject: { },
  _settings: "",

  HIDE_A11Y: "hide-a11y",
  HIDE_VOLUME: "hide-volume",
  HIDE_BLUETOOTH: "hide-bluetooth",
  DEV_TOOLS: 'enable-dev-tools',
  DISABLE_ANIMATION: 'disable-animation',

  HIDE_TOP_BAR: 'hide-top-bar',
  HIDE_TOP_TIME_DELTA: 'hide-top-time-delta',
  HIDE_TOP_SHOW_DELAY: 'hide-top-show-delay',
  HIDE_TOP_ANIMATION_TIME: 'hide-top-animation-time',

  SIMPLE_MENU_POSITION: 'simple-menu-position',
  SIMPLE_MENU_TERMINAL: 'simple-menu-terminal',
  SIMPLE_MENU_KEY_BINDING: 'simple-menu-key-binding',
  SIMPLE_MENU_ENTRY: 'simple-menu-entry',

  _init: function() {
    this._loadSettings();
  },

  destroy: function() {
  },

  getSettingsObject: function() {
    return this._settingsObject;
  },

  saveSettings: function() {
    let saveMe = {};

    let entries = this._settings["simple-menu-entry"];

    let names = Object.getOwnPropertyNames(entries);
    names.sort();
    for (let i=0; i<names.length; i++) {
      saveMe[entries[names[i]].display] = entries[names[i]];
    }

    this._settingsObject.set_string(this.SIMPLE_MENU_ENTRY, JSON.stringify(saveMe));
  },

  _loadSettings: function() {
    let schema = Me.metadata['settings-schema'];

    const GioSSS = Gio.SettingsSchemaSource;

    let schemaDir = Me.dir.get_child('schemas');
    let schemaSource;
    if (schemaDir.query_exists(null)) {
      schemaSource = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
    } else {
      schemaSource = GioSSS.get_default();
    }

    schema = schemaSource.lookup(schema, true);
    if (!schema) {
        throw new Error('Schema ' + schema + ' could not be found for extension '
                        + Me.metadata.uuid + '. Please check your installation.');
    }

    this._settingsObject = new Gio.Settings({ settings_schema: schema });

    // load dev tools enabled from global settings

    let devEnabled = false;
    if (global.settings) {
      devEnabled = global.settings.get_boolean('development-tools');
    } else {
      devEnabled = new Gio.Settings({ schema: "org.gnome.shell" }).get_boolean('development-tools');
    }
    if (this.getBoolean(this.DEV_TOOLS) != devEnabled) {
      this.setParameter(this.DEV_TOOLS, devEnabled);
    }

    this._settings = {
      "simple-menu-entry": JSON.parse(this._settingsObject.get_string("simple-menu-entry"))
    }
  },

  _addToArray: function(array, value) {
    if (array.indexOf(value) == -1) {
      array.push(value);
    }
    return array;
  },

  getBoolean: function(name, defaultValue) {
    let ret = this._settingsObject.get_int(name);
    if (typeof ret == "undefined") {
      return defaultValue;
    }
    return ret == "true" || ret == "1";
  },

  getNumber: function(name, defaultValue) {
    let ret = this._settingsObject.get_int(name);
    if (typeof ret == "undefined") {
      return defaultValue;
    }
    return ret;
  },

  get_strv: function(name) {
    return this._settingsObject.get_strv(name);
  },

  getString: function(name, defaultValue) {
    let ret = this._settingsObject.get_string(name);
    if (typeof ret == "undefined") {
      return defaultValue;
    }
    return ret;
  },

  getParameter: function(name, defaultValue) {
    try {
      let path = name.split("."),
        value = this._settings[path[0]],
        pathLength = path.length;
      for (let i=1; i < pathLength; i++) {
        value = value[path[i]];
      }

      return value;
    } catch (e) {
      this.showErrorMessage("Error getting parameter!", "Can not get config by name '" + name + "' defaulting to '" + defaultValue + "' " + e.message);
      return defaultValue;
    }
  },

  unsetParameter: function(name) {
    let path = name.split("."),
      conf = this._settings[path[0]],
      pathLength = path.length - 1;

    for (let i=1; i < pathLength; i++) {
      conf = conf[path[i]];
    }

    if (isNaN(path[pathLength])) {
      // normal object
      delete conf[ path[pathLength] ];
    } else {
      // an array
      conf.pop(path[pathLength]);
    }
  },

  setParameter: function(name, value) {
    try {
      if (name.indexOf(this.SIMPLE_MENU_ENTRY) == -1) {
        if (isNaN(value)) {
          this._settingsObject.set_string(name, value);
        } else {
          this._settingsObject.set_int(name, value);
        }
        return;
      }

      let path = name.split("."),
        conf = this._settings,
        pathLength = path.length - 1;

      for (let i=0; i < pathLength; i++) {
        if (!conf[path[i]]) {
          conf[path[i]] = {};
        }
        conf = conf[path[i]];
      }

      conf[ path[pathLength] ] = value;
    } catch (e) {
      this.showErrorMessage("Error setting parameter!", "Can not set config parameter " + name + " " + e.message);
    }
  },

  _toNumber: function(value, defaultValue) {
    let valueType = typeof(value);

    if (valueType == "undefined") {
      return defaultValue;
    }

    if (isNaN(defaultValue)) {
      defaultValue = 0;
    }

    return !isNaN(value)
      ? new Number(value)
      : defaultValue;
  },

  sortMenuEntries: function(a, b) {
    let ret = a.position - b.position;
    if (ret != 0) {
      return ret;
    }

    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return -1;
    }
    return 0;
  },

  showErrorMessage: function(title, text) {
    global.log("ERROR Title: " + title);
    global.log("ERROR Text: " + text);
  }
};
