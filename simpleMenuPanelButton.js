const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Util = imports.misc.util;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Utils = new Me.imports.utils.Utils();


const SimpleMenuPanelButton = new Lang.Class({
  Name: 'SimpleMenuPanelButton',
  Extends: PanelMenu.Button,

  _terminal: "terminator -x",

  _init: function(config) {
    try {
      this._menuConfig = config.config;
      this._terminal = config.terminal;

      this.parent(0.25, "SimpleMenu", false);
      var iconParams = {
        icon_name: 'system-file-manager-symbolic',
        style_class: 'system-status-icon'
      };
      if (St.IconType) {
        iconParams.icon_type = St.IconType.SYMBOLIC
      }
      this._icon = new St.Icon(iconParams);
      this.actor.add_actor(this._icon);

      this._dynamicMenu = this._createEntries()
      this.menu.addMenuItem(this._dynamicMenu);

      let sep = new PopupMenu.PopupSeparatorMenuItem()
      this.menu.addMenuItem(sep);

      // add link to settings dialog
      // Thanks to https://github.com/philipphoffmann/gnome3-jenkins-indicator
      let settingsItem  = new PopupMenu.PopupMenuItem(_("Settings"));
      settingsItem.connect("activate", function(){
        let app = Shell.AppSystem.get_default().lookup_app("gnome-shell-extension-prefs.desktop");
        if( app!=null ) {
          app.launch(global.display.get_current_time_roundtrip(), ['extension:///' + Me.uuid], -1, null);
        }
      });
      this.menu.addMenuItem(settingsItem);

      Main.panel.menuManager.addMenu(this.menu);

    }catch (err) {
      global.log("Error creating SimpleMenu: " + err);
      Main.notifyError("Error creating menuitems", err.message);
    }
  },

  // create the dynamic menu entries defined in simpleMenu.json
  _createEntries: function() {
    let section = new PopupMenu.PopupMenuSection()

    var entries = Object.getOwnPropertyNames(this._menuConfig);
    let size = entries.length;

    // sort entries by _menuconfig.foobar.position
    for (let i=0; i<size; i++) {
      entries[i] = {
        name: entries[i],
        position: this._menuConfig[entries[i]].position
      };
    }

    entries.sort(Utils.sortMenuEntries)

    this.first = null;
    for (let i=0; i<size; i++) {
      let add = new PopupMenu.PopupMenuItem(_(this._menuConfig[entries[i].name].display));

      if (this.first == null) {
        this.first = add;
      }

      let term = this._menuConfig[entries[i].name].terminal;
      let com = this._menuConfig[entries[i].name].command;
      add.connect('activate',
        Lang.bind(this, function() {
          this._startTerminal(term, com);
        })
      );

      section.addMenuItem(add);
    }
    return section;
  },

  _startTerminal: function(terminal, command) {
    if (terminal == true) {
      Util.spawnCommandLine(this._terminal +" "+ command);
    } else {
      if (command instanceof Array) {
        Util.spawn(command);
      } else {
        Util.spawn([command]);
      }

    }
  },

  rebuildMenu: function() {
    /*
    this.menu._getMenuItems()[0].destroy();
    this._menuConfig = _readFile();
    _dynamicMenu = this._createEntries()
    this.menu.addMenuItem(_dynamicMenu, 0);
    Main.notify("Rebuild done", "");
    */
  },

  focusFirstElement: function() {
    this.first.setActive(true);
  }
});
