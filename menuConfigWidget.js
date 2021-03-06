/*jshint indent: 2*/
/*jshint camelcase: true*/
/*jshint immed: true*/
/*jshint curly: true*/

const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = new Me.imports.utils.Utils();

const MenuConfigWidget = new GObject.Class({
  Name: 'SimpleMenu.Prefs.MenuConfigWidget',
  GTypeName: 'SimpleMenuMenuConfigWidget',
  Extends: Gtk.Grid,

  _menuConfig: {},
  _entries: [],
  _selectedEntry: null,

  _init: function(params) {
    this.parent({margin_left: 20, margin_right: 5, column_homogeneous: true });


    this._menuConfig = Utils.getParameter(Utils.SIMPLE_MENU_ENTRY);

    let row = 0;

    // Keybinding
    this.attach(this._getKeybindingEntry(), 0, row, 5, 1);
    row++;

    // position combo
    this.attach(new Gtk.Label({
      halign: Gtk.Align.START,
      label: "PanelButton position",
    }), 0, row, 2, 1);

    let cb = this._getComboBox([GObject.TYPE_STRING], [["left"], ["center left"], ["center right"], ["right"]], Utils.getString(Utils.SIMPLE_MENU_POSITION, "right"));
    cb.connect('changed',
      Lang.bind(this, function(combo) {
        let [success, iter]  = combo.get_active_iter();
        if (!success) {
          return;
        }
        Utils.setParameter(Utils.SIMPLE_MENU_POSITION, combo.get_model().get_value(iter, 0));
      })
    );
    this.attach(cb, 3, row, 2, 1);
    row++;

    // terminal to execute
    this.attach(new Gtk.Label({
      halign: Gtk.Align.START,
      label: "Terminal command",
    }), 0, row, 2, 1);

    let terminalName = new Gtk.Entry({ text: Utils.getString(Utils.SIMPLE_MENU_TERMINAL, "gnome-terminal" ) });
    terminalName.connect("changed",
      Lang.bind(this, function(input) {
        Utils.setParameter(Utils.SIMPLE_MENU_TERMINAL, input.text);
      })
    );
    this.attach(terminalName, 3, row, 2, 1);
    row++;

    // menu entries
    this.attach(this._generateMenuEntryList(), 0, row, 5, 1);
    row++;
  },


  _getComboBox: function( types, values, selectedValue) {
    let model = new Gtk.ListStore();
    model.set_column_types(types);

    let ret = new Gtk.ComboBox({
      model: model,
      hexpand: true,
      margin_top: 6,
      margin_bottom: 6
    });
    ret.get_style_context().add_class(Gtk.STYLE_CLASS_RAISED);

    let renderer = new Gtk.CellRendererText();
    ret.pack_start(renderer, true);
    ret.add_attribute(renderer, 'text', 0);

    let numValues =  values.length;

    //[GObject.TYPE_STRING, GObject.TYPE_INT]);
    let valueDefinition = [];
    for (let i = 0; i < types.length; i++) {
      valueDefinition.push(i);
    }
    for (let i = 0; i < numValues; i++ ) {
      let iter = model.append();
      model.set(iter, [0], values[i]);
      if (values[i][0] == selectedValue) {
        ret.set_active_iter(iter);
      }
    }
    return ret;
  },

  _getKeybindingEntry: function() {
    let model = new Gtk.ListStore();
    model.set_column_types([ GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_INT, GObject.TYPE_INT ]);

    let [key, mods] = Gtk.accelerator_parse(Utils.get_strv(Utils.SIMPLE_MENU_KEY_BINDING, null)[0]);
    let iter = model.insert(10);
    model.set(iter, [0, 1, 2, 3], [Utils.SIMPLE_MENU_KEY_BINDING, "Key binding", mods, key ]);
    let treeView = new Gtk.TreeView({
      model: model,
      headers_visible: false
    });
    let cellrend = new Gtk.CellRendererText();
    let col = new Gtk.TreeViewColumn({ 'title': 'Action', 'expand': true });
    col.pack_start(cellrend, true);
    col.add_attribute(cellrend, 'text', 1);
    treeView.append_column(col);

    // keybinding column
    cellrend = new Gtk.CellRendererAccel({
      'editable': true,
      'accel-mode': Gtk.CellRendererAccelMode.GTK
    });

    cellrend.connect('accel-edited', function(rend, iter, key, mods) {
      let value = Gtk.accelerator_name(key, mods);
      let [succ, iterator ] = model.get_iter_from_string(iter);

      if(!succ) {
        throw new Error("Error updating Keybinding");
      }

      let name = model.get_value(iterator, 0);

      model.set(iterator, [ 2, 3], [ mods, key ]);
      Utils.set_strv(name, [value]);
    });

    col = new Gtk.TreeViewColumn({'title': 'Modify'});

    col.pack_end(cellrend, false);
    col.add_attribute(cellrend, 'accel-mods', 2);
    col.add_attribute(cellrend, 'accel-key', 3);
    treeView.append_column(col);
    return treeView;
  },

  _addEntry: function(name) {
    let iter = this._treeModel.append();
    this._treeModel.set(iter, [0], [ name ]);
    let entry = {name: name, listElement: iter};
    this._entries.push(entry);
    return entry;
  },

  _generateMenuEntryList: function() {
    this._entries = [];
    // list all entries
    this._treeModel = new Gtk.ListStore();
    this._treeModel.set_column_types([GObject.TYPE_STRING]);

    let treeView = new Gtk.TreeView({model: this._treeModel, headers_visible: false});
    treeView.get_style_context().add_class(Gtk.STYLE_CLASS_RAISED);

    let column = new Gtk.TreeViewColumn({ min_width: 150 });
    let renderer = new Gtk.CellRendererText();
    column.pack_start(renderer, true);
    column.add_attribute(renderer, 'text', 0);

    treeView.append_column(column);

    treeView.get_selection().connect("changed",
      Lang.bind(this, function(selection) {
        let s = selection.get_selected();
        if (!s[0]) {
          return;
        }
        let selectedValue = s[1].get_value(s[2], 0);
        if (this._selectedEntry !== null && this._selectedEntry == selectedValue) {
          return;
        }
        this._selectedEntry = selectedValue;

        this._removeButton.set_sensitive(true);
        this._updateEntryContainer(this._createEntryWidget(selectedValue));
      })
    );


    // sort the menu entries by position
    var entries = Object.getOwnPropertyNames(this._menuConfig);
    let size = entries.length;

    // sort entries by _menuconfig.foobar.position
    for (let i=0; i < size; i++) {
      entries[i] = {
        name: entries[i],
        position: this._menuConfig[entries[i]].position
      };
    }
    entries.sort(Utils.sortMenuEntries);

    for(let i=0; i < entries.length; i++) {
      this._addEntry(entries[i].name);
    }

    // toolbar to add/remove entries
    let toolbar = new Gtk.Toolbar({});
    toolbar.set_icon_size(Gtk.IconSize.MENU);
    toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);

    this._removeButton = new Gtk.ToolButton( {stock_id: Gtk.STOCK_REMOVE} );
    this._removeButton.set_sensitive(false);
    this._removeButton.set_tooltip_text("Remove an existing application");

    this._removeButton.connect("clicked",
      Lang.bind(this, function() {
        let delme = this._selectedEntry;
        let dialog = new Gtk.MessageDialog({
          modal: true,
          message_type: Gtk.MessageType.QUESTION,
          title: "Delete entry '" + delme + "'?",
          text: "Are you sure to delete the configuration for  '" + delme  + "'?"
        });

        dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        dialog.add_button(Gtk.STOCK_DELETE, Gtk.ResponseType.DELETE_EVENT);

        dialog.connect("response",
          Lang.bind(this, function(dialog, responseType) {
            if (responseType != Gtk.ResponseType.DELETE_EVENT) {
              return;
            }
            // remove the widget
            if (this._entryContainer.get_child()) {
              this._entryContainer.get_child().destroy();
            }
            // remove the list entry
            let entryObject = this._findListEntryByName(delme);
            if (entryObject == null) {
              global.log("can not find listEntry by name " + delme);
              return;
            }
            this._treeModel.remove(entryObject.listElement);
            // unset the parameter
            Utils.unsetParameter(Utils.SIMPLE_MENU_ENTRY + "." + delme);
            // remove the entry from _apps array
            this._entries.pop(entryObject);
          })
        );
        dialog.run();
        dialog.destroy();
      })
    );

    let addButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_ADD });
    addButton.connect("clicked",
      Lang.bind(this, function() {
        let obj = this._addEntry( "Entry " + this._entries.length);
        this._selectedEntry = obj.name;
        treeView.get_selection().select_iter(obj.listElement);
        this._updateEntryContainer(this._createEntryWidget(this._selectedEntry));
      })
    );

    this._saveButton = new Gtk.ToolButton({stock_id: Gtk.STOCK_SAVE});
    //this._saveButton.set_use_stock(true);
    this._saveButton.set_tooltip_text("'Entries' config is not saved automatically.");
    this._saveButton.connect("clicked", function() {
      Utils.saveSettings();
    });

    toolbar.insert(this._removeButton, 0);
    toolbar.insert(addButton, 1);
    toolbar.insert(this._saveButton, 2);

    let leftPanel = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_right: 5});
    leftPanel.pack_start(toolbar, false, false, 0);
    leftPanel.pack_start(treeView, true, true, 0);

    // entry details
    this._entryContainer = new Gtk.Frame({ hexpand: true});
    this._entryContainer.add(new Gtk.Label({label: "Select an application to configure using the list on the left side." }));
    let scroll = new Gtk.ScrolledWindow({
      'vexpand': true
    });
    scroll.add_with_viewport(this._entryContainer);

    let ret = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5, margin_bottom: 5 });
    ret.add(leftPanel);
    ret.add(scroll);

    return ret;
  },

  _findListEntryByName: function(name) {
    for (let i=0; i<this._entries.length; i++) {
      if (this._entries[i].name == name) {
        return this._entries[i];
      }
    }
    return null;
  },

  _updateEntryContainer: function(widget) {
    if (this._entryContainer.get_child()) {
      this._entryContainer.get_child().destroy();
    }
    this._entryContainer.add(widget);
    this._entryContainer.show_all();
  },

  _createEntryWidget: function(name) {

    let configBase = Utils.SIMPLE_MENU_ENTRY + "." + name;
    let config = Utils.getParameter(configBase);

    if (typeof config == "undefined") {
      config = {display: name, command: "", terminal: false, position: 1};
    } else {
      if (!config.display) {
        config.display = name;
      }
      if (!config.command) {
        config.command = "";
      }
      if (typeof config.terminal == "undefined") {
        config.terminal = false;
      }
      if (typeof config.position == "undefined") {
        config.position = 1;
      }
    }


    let grid = new Gtk.Grid({ column_homogeneous: true, margin: 5});
    let row = 0;
    grid.attach(new Gtk.Label({ label: "Display name", xalign: 0}), 0, row, 1, 1);
    let displayEntry = new Gtk.Entry({ text: config.display });
    displayEntry.connect("changed", Lang.bind(this, function(input) {
      let value = input.text;
      if (value.indexOf(".") != -1) {
        value = value.replace(/\./g,"-");
      }
      Utils.setParameter(configBase + ".display", input.text);
      let entry = this._findListEntryByName(this._selectedEntry);
      entry.name = value;
      this._selectedEntry = value;
      this._treeModel.set(entry.listElement, [0], [ value ]);
    }));
    grid.attach(displayEntry, 2, row, 2, 1);
    row++;

    grid.attach(new Gtk.Label({ label: "Command", xalign: 0}), 0, row, 1, 1);
    let commandEntry = new Gtk.Entry({ text: config.command });
    commandEntry.connect("changed", Lang.bind(this, function(input) {
      Utils.setParameter(configBase + ".command", input.text);
    }));
    grid.attach(commandEntry, 2, row, 2, 1);
    row++;

    // position inside the created menu
    grid.attach(new Gtk.Label({ label: "Position", xalign: 0}), 0, row, 1, 1);

    let position = new Gtk.Scale({digits: 0, sensitive: true, orientation: Gtk.Orientation.HORIZONTAL, margin_right: 6, margin_left: 6});
    position.set_range(0, 20);

    position.set_value(config.position);
    position.connect("value_changed", Lang.bind(position, function() {
      Utils.setParameter(configBase + ".position", this.get_value());
    }));
    grid.attach(position, 2, row, 2, 1);
    row++;

    grid.attach(new Gtk.Label({ label: "Run in terminal", xalign: 0}), 0, row, 1, 1);
    let sw = new Gtk.Switch({ sensitive: true, halign: Gtk.Align.END });
    sw.set_active(config.terminal);
    sw.connect("notify::active",
      function(obj) {
        Utils.setParameter(configBase + ".terminal", obj.get_active());
     });
    grid.attach(sw, 2, row, 2, 1);
    row++;

    let ret = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    ret.pack_start(grid, false, false, 0);
    return ret;
  }
});

