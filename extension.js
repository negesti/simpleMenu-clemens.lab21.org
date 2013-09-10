/*jshint indent: 2*/
/*jshint camelcase: true*/
/*jshint immed: true*/
/*jshint curly: true*/

const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Overview = imports.ui.overview;
const Shell = imports.gi.Shell;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const HideTopBar = Me.imports.hideTopBar;
const SimpleMenuPanelButton = Me.imports.simpleMenuPanelButton;

const Utils = new Me.imports.utils.Utils();

let _defaultCheckWorkspacesFunction;
let _defaultShowFunction;
let _checkingWorkspaces;

function SimpleMenu() {
  this._init();
}

SimpleMenu.prototype = {
  _settingsChangedListeners: [],
  _originalSyncVisibility: null,

  _init: function() {

    this._hideTopBar = new HideTopBar.HideTopBar({
      enabled: Utils.getBoolean(Utils.HIDE_TOP_BAR),
      timeDelta: Utils.getNumber(Utils.HIDE_TOP_TIME_DELTA, 1000),
      showDelay: Utils.getNumber(Utils.HIDE_TOP_SHOW_DELAY, 300),
      animationTime: Utils.getNumber(Utils.HIDE_TOP_ANIMATION_TIME, Overview.Overview.ANIMATION_TIME * 10)
    });

    var buttonPosition = Utils.getString(Utils.SIMPLE_MENU_POSITION, "center");

    this._myPanelButton = new SimpleMenuPanelButton.SimpleMenuPanelButton({
      config : Utils.getParameter(Utils.SIMPLE_MENU_ENTRY, {}),
      terminal : Utils.getString(Utils.SIMPLE_MENU_TERMINAL, "gnome-terminal")
    });

    // index inside the left/center/right box. 0 == left, 100 == right
    let position = 100;
    if (buttonPosition == "left") {
      position = 100;
    } else if (buttonPosition == "center left") {
      position = 0;
    }  else if (buttonPosition == "center right") {
      position = 100;
    } else if (buttonPosition == "right") {
      position = 0;
    }
    Main.panel.addToStatusArea("SimpleMenu", this._myPanelButton, position, buttonPosition);
    this._addKeyBinding();

    if (Utils.getBoolean(Utils.HIDE_A11Y)) {
      this._toggleSymbol("a11y", true);
    }

    if(Utils.getBoolean(Utils.HIDE_BLUETOOTH)) {
      this._toggleSymbol("bluetooth", true);
    }

    if(Utils.getBoolean(Utils.HIDE_VOLUME)) {
      this._toggleSymbol("volume", true);
    }

    this._oldShouldAnimate = Main.wm._shouldAnimate;
    if (Utils.getBoolean(Utils.DISABLE_ANIMATION, false)) {
      Main.wm._shouldAnimate = function(actor) {
        return false;
      };
    }

    _defaultCheckWorkspacesFunction = Main._checkWorkspaces;
    _defaultShowFunction = Main.overview.show;
    _checkingWorkspaces=false;

    if (Utils.getBoolean(Utils.AVOID_OVERVIEW, false)) {
      this._enableAvoidOverview();
    }

    this._addSettingsListeners();
  }, // _init

  _disableAvoidOverview: function() {
    Main._checkWorkspaces = _defaultCheckWorkspacesFunction;
    Main.overview.show = _defaultShowFunction;
  },

  _enableAvoidOverview: function() {
    Main.overview.show=function() {
        if(_checkingWorkspaces==false) {
            _defaultShowFunction.call(Main.overview);
        }
    };

    Main._checkWorkspaces = function() {
        _checkingWorkspaces = true;
        _defaultCheckWorkspacesFunction.call(Main);
        _checkingWorkspaces = false;
    };
  },

  /**
   * Helper functions to set custom handler for keybindings
   */
  _addKeyBinding: function() {
    let key = Utils.SIMPLE_MENU_KEY_BINDING;
    let handler = Lang.bind(this, function(){
      this._myPanelButton.menu.toggle();
      this._myPanelButton.focusFirstElement();
    });

    if (Main.wm.addKeybinding && Shell.KeyBindingMode) { // introduced in 3.7.5
      // Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.MESSAGE_TRAY,
      Main.wm.addKeybinding(key,
        Utils.getSettingsObject(), Meta.KeyBindingFlags.NONE,
        Shell.KeyBindingMode.NORMAL,
        handler
      );
    } else {
      global.display.add_keybinding(
        key,
        Utils.getSettingsObject(),
        Meta.KeyBindingFlags.NONE,
        handler
      );
    }
  },

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

    this._settingsChangedListeners.push({
      name: Utils.AVOID_OVERVIEW,
      fn: Lang.bind(this, function() {
        if (Utils.getBoolean(Utils.AVOID_OVERVIEW, false)) {
          this._enableAvoidOverview();
        } else {
          this._disableAvoidOverview();
        }
      })
    });

    this._settingsChangedListeners.push({
      name: Utils.DISABLE_ANIMATION,
      fn: Lang.bind(this, function() {
        if (Utils.getBoolean(Utils.DISABLE_ANIMATION, false)) {
          Main.wm._shouldAnimate = function(actor) {
            return false;
          };
        } else {
          Main.wm._shouldAnimate = this._oldShouldAnimate;
        }
      })
    });

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

    this._settingsChangedListeners.push({
      name: Utils.SIMPLE_MENU_ENTRY,
      fn: Lang.bind(this, function() {
        Utils.reloadMenuSettings();
        this._myPanelButton.recreateMenu(Utils.getParameter(Utils.SIMPLE_MENU_ENTRY, {}));
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
    try {
      var symbol = null;
      if (Main.panel.statusArea) {
        symbol = Main.panel.statusArea[name];
      } else {
        symbol = Main.panel._statusArea[name];
      }
      if (symbol !== null) {
        if (hide) {
          symbol.actor.hide();
        } else {
          symbol.actor.show();
        }
        if (name == "volume" ) {
          this._toggleVolumeButton(symbol, hide);
        }

      } else {
        global.log("Error: Can not resolve symbol by name " + name );
      }
    } catch(e) {
      global.log("Error hidding " + name +"  " +e+ " " + " "  +e.Message);
    }
  },

  _toggleVolumeButton: function(symbol, hide) {
    if (this._originalSyncVisibility === null) {
      this._originalSyncVisibility = symbol._syncVisibility;
    }

    if (hide) {
      symbol._syncVisibility = function() {
        return;
      };
      symbol.actor.hide();
    } else {
      symbol._syncVisibility = this._originalSyncVisibility;
      symbol.actor.show();
    }


  },

  destroy: function() {
    for (let i=0; i < this._settingsChangedListeners.length; i++) {
      try {
        Utils.getSettingsObject().disconnect(this._settingsChangedListeners[i].handlerId);
      } catch (e) {
        global.log("Error disconnecting signal for " + this._settingsChangesListeners[i].name);
      }
    }

    if (Main.wm.removeKeybinding) {// introduced in 3.7.2
      Main.wm.removeKeybinding(Utils.SIMPLE_MENU_KEY_BINDING);
    } else {
      global.display.remove_keybinding(Utils.SIMPLE_MENU_KEY_BINDING);
    }

    this._myPanelButton.destroy();

    this._hideTopBar.disable();
    this._disableAvoidOverview();
  } // destroy
}; // SimpleMenu

function init(meta) {

}

function enable() {
  this.simpleMenu = new SimpleMenu();
}

function disable() {
  this.simpleMenu.destroy();
}

