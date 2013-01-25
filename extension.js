
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = new Me.imports.utils.Utils();

function SimpleMenu() {
  this._init();
};

SimpleMenu.prototype = {
  _settingsChangedListeners: [],

  _init: function() {

    var buttonPosition = Utils.getParameter(Utils.BUTTON_POSITION);
    // TODO check if which positions addToStatusArea supports
    if (buttonPosition == "center") {
      Main.panel.addToStatusArea("SimpleMenu", this._myPanelButton, 1, "center");
    } else if (buttonPosition == "right") {
      Main.panel.addToStatusArea("SimpleMenu", this._myPanelButton);
    }

    // make this a custom keybinding
    Meta.keybindings_set_custom_handler(
      "move-to-workspace-1",
      Lang.bind(this, function(){
        this._myPanelButton.menu.toggle();
        this._myPanelButton.focusFirstElement();
      })
    );

    if (Utils.getBoolean(Utils.HIDE_A11Y)) {
      this._toggleSymbol("a11y", true);
    }

    if(Utils.getBoolean(Utils.HIDE_BLUETOOTH)) {
      this._toggleSymbol("bluetooth", true);
    }

    if(Utils.getBoolean(Utils.HIDE_VOLUME)) {
      this._toggleSymbol("volume", true);
    }

    this._addSettingsListeners();
  }, // _init

  _addSettingsListeners: function() {
    this._settingsChangedListeners = [{
      name: Utils.HIDE_A11Y,
      fn:  Lang.bind(this,
        function() {
          this._toggleSymbol("a11y", Utils.getBoolean(Utils.HIDE_A11Y));
        })
    }, {
      name: Utils.HIDE_VOLUME,
      fn:  Lang.bind(this,
        function() {
          this._toggleSymbol("volume", Utils.getBoolean(Utils.HIDE_VOLUME));
        })
    }, {
      name: Utils.HIDE_BLUETOOTH,
      fn:  Lang.bind(this,
        function() {
          this._toggleSymbol("bluetooth", Utils.getBoolean(Utils.HIDE_BLUETOOTH));
        })
    }, {
      name: Utils.DEV_TOOLS,
      fn:  Lang.bind(this,
        function() {
          global.settings.set_boolean('development-tools', Utils.getBoolean(Utils.DEV_TOOLS));
        })
    }];

    for (let i=0; i < this._settingsChangedListeners.length; i++) {
      this._settingsChangedListeners[i].handlerId = Utils.getSettingsObject().connect(
        'changed::' + this._settingsChangedListeners[i].name ,
        this._settingsChangedListeners[i].fn
      );
    }
  }, // _addSettingsListeners

  _toggleSymbol: function(name, hide) {
    try{
      var symbol = null;
      if (Main.panel.statusArea) {
        symbol = Main.panel.statusArea[name];
      } else {
        symbol = Main.panel._statusArea[name];
      }
      if (symbol != null) {
        if (hide) {
          symbol.actor.hide();
        } else {
          symbol.actor.show();
        }
      } else {
        global.log("Error hiding symbol: Can not resolve symbol by name " + name );
      }
    } catch(e) {
      global.log("error hidding " + name +"  " +e.Message);
    }
  },

  destroy: function() {
    for (let i=0; i < this._settingsChangedListeners.length; i++) {
      Utils.getSettingsObject().disconnect(this._settingsChangedListeners[i].handlerId);
    }
  } // destroy
}; // SimpleMenu

function init(meta) {

};

function enable() {
  this.simpleMenu = new SimpleMenu();
}

function disable() {
  this.simpleMenu.destroy();
};

