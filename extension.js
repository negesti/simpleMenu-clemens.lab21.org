
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const HideTopBar = Me.imports.hideTopBar;

const Utils = new Me.imports.utils.Utils();

function SimpleMenu() {
  this._init();
};

SimpleMenu.prototype = {
  _settingsChangedListeners: [],

  _init: function() {

    this._hideTopBar = new HideTopBar.HideTopBar({
      enabled: Utils.getBoolean(Utils.HIDE_TOP_BAR),
      timeDelta: Utils.getNumber(Utils.HIDE_TOP_TIME_DELTA, 1000),
      showDelay: Utils.getNumber(Utils.HIDE_TOP_SHOW_DELAY, 300),
      animationTime: Utils.getNumber(Utils.HIDE_TOP_ANIMATION_TIME, 4)
    });

    var buttonPosition = Utils.getParameter(Utils.BUTTON_POSITION);
    // TODO create a SimpleMenuButton.js and let it handel all this
    // check  which positions addToStatusArea supports
    if (buttonPosition == "center") {
      Main.panel.addToStatusArea("SimpleMenu", this._myPanelButton, 1, "center");
    } else if (buttonPosition == "right") {
      Main.panel.addToStatusArea("SimpleMenu", this._myPanelButton);
    }

    // TODO make this a custom keybinding
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
      fn:  Lang.bind(this, function() {
          this._toggleSymbol("a11y", Utils.getBoolean(Utils.HIDE_A11Y));
        })
    }, {
      name: Utils.HIDE_VOLUME,
      fn:  Lang.bind(this, function() {
          this._toggleSymbol("volume", Utils.getBoolean(Utils.HIDE_VOLUME));
        })
    }, {
      name: Utils.HIDE_BLUETOOTH,
      fn:  Lang.bind(this, function() {
          this._toggleSymbol("bluetooth", Utils.getBoolean(Utils.HIDE_BLUETOOTH));
        })
    }, {
      name: Utils.DEV_TOOLS,
      fn:  Lang.bind(this, function() {
          global.settings.set_boolean('development-tools', Utils.getBoolean(Utils.DEV_TOOLS));
        })
    }];

    // listeners for the auto hide top bar stuff;
    this._settingsChangedListeners.push({
      name: Utils.HIDE_TOP_BAR,
      fn: Lang.bind(this, function() {
          if (Utils.getBoolean(Utils.HIDE_TOP_BAR)) {
            this._hideTopBar.enable();
          } else {
            this._hideTopBar.disable();
          }
        })
    });

    this._settingsChangedListeners.push({
      name: Utils.HIDE_TOP_TIME_DELTA,
      fn: Lang.bind(this, function() {
        this._hideTopBar.setTimeDelta(Utils.getNumber(Utils.HIDE_TOP_TIME_DELTA));
      })
    });
    this._settingsChangedListeners.push({
      name: Utils.HIDE_TOP_SHOW_DELAY,
      fn: Lang.bind(this, function() {
        this._hideTopBar.setShowDelay(Utils.getNumber(Utils.HIDE_TOP_SHOW_DELAY));
      })
    });
    this._settingsChangedListeners.push({
      name: Utils.HIDE_TOP_ANIMATION_TIME,
      fn: Lang.bind(this, function() {
        this._hideTopBar.setAnimationTime(Utils.getNumber(Utils.HIDE_TOP_ANIMATION_TIME));
      })
    });


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
        global.log("Error symbol: Can not resolve symbol by name " + name );
      }
    } catch(e) {
      global.log("error hidding " + name +"  " +e.Message);
    }
  },

  destroy: function() {
    for (let i=0; i < this._settingsChangedListeners.length; i++) {
      Utils.getSettingsObject().disconnect(this._settingsChangedListeners[i].handlerId);
    }

    this._hideTopBar.disable();
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

