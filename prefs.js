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
const MenuConfigWidget = Me.imports.menuConfigWidget;

const SimpleMenuSettingsWidget = new GObject.Class({
  Name: 'SimpleMenu.Prefs.SimpleMenuSettingsWidget',
  GTypeName: 'SimpleMenuSettingsWidget',
  Extends: Gtk.Notebook,


  _init: function(params) {
    this.parent(params);
    this.orientation = Gtk.Orientation.VERTICAL;
    this.expand = true;
    this.tab_pos = Gtk.PositionType.LEFT;

    this.append_page(this._generateMainSettings(), new Gtk.Label({
      label: "<b>Main</b>", halign:Gtk.Align.START, margin_left: 4, use_markup: true}));

    this.append_page(this._generateAutohideSettings(), new Gtk.Label({
      label: "<b>AutoHide TopBar</b>", halign:Gtk.Align.START, margin_left: 4, use_markup: true}));

    this.append_page(new MenuConfigWidget.MenuConfigWidget(), new Gtk.Label({
      label: "<b>Menu settings</b>", halign:Gtk.Align.START, margin_left: 4, use_markup: true}));

  },

  _addLabeledSwitch: function(container, row, label, settingsName, labelWidth , buttonWidth) {
    if (!labelWidth) {
      labelWidth = 3;
    }
    if (!buttonWidth) {
      buttonWidth = 1;
    }

    container.attach(new Gtk.Label({
      halign: Gtk.Align.START,
      label: label,
    }), 0, row, labelWidth, 1);

    let sw = new Gtk.Switch({ sensitive: true, halign: Gtk.Align.END });
    sw.set_active(Utils.getBoolean(settingsName, false));
    sw.connect("notify::active",
      function(obj) {
        Utils.setParameter(settingsName, obj.get_active());
     });

    container.attach(sw, (labelWidth + 1), row, buttonWidth, 1);
  },

  _generateMainSettings: function() {
    let grid = new Gtk.Grid({margin_left: 20, column_homogeneous: true, })

    let row = 0;
    this._addLabeledSwitch(grid, row, "Avoid oveview", Utils.AVOID_OVERVIEW);
    row++
    this._addLabeledSwitch(grid, row, "Enable development tools (LoogkinGlass, shell reload..)", Utils.DEV_TOOLS);
    row++;
    this._addLabeledSwitch(grid, row, "Disable animation", Utils.DISABLE_ANIMATION);
    row++;
    this._addLabeledSwitch(grid, row, "Hide Bluetooth  icon", Utils.HIDE_BLUETOOTH);
    row++;
    this._addLabeledSwitch(grid, row, "Hide Volume icon", Utils.HIDE_VOLUME);
    row++;
    this._addLabeledSwitch(grid, row, "Hide A11y icon", Utils.HIDE_A11Y);
    row++;

    return grid;
  },

  _generateAutohideSettings: function() {
    let grid = new Gtk.Grid({margin_left: 20, column_homogeneous: true, })
    let row = 0;
    this._addLabeledSwitch(grid, row, "Auto hide top bar", Utils.HIDE_TOP_BAR, 4, 1);
    row++;

    grid.attach( new Gtk.Label({
      halign: Gtk.Align.START,  label: "Double-click timeout [sec]"
    }), 0, row, 3, 1);

    let timeDelta = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 1, 10, 1 );
    timeDelta.set_value(Utils.getNumber(Utils.HIDE_TOP_TIME_DELTA, 1));
    timeDelta.connect("value_changed", Lang.bind(timeDelta, function() {
      Utils.setParameter(Utils.HIDE_TOP_TIME_DELTA, this.get_value());
    }));
    grid.attach(timeDelta, 4, row, 2, 1);
    row++;

    grid.attach( new Gtk.Label({
      halign: Gtk.Align.START,  label: "Mouse over show time [100ms]"
    }), 0, row, 3, 1);

    let showDelay = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 1, 10, 1 );
    showDelay.set_value(Utils.getNumber(Utils.HIDE_TOP_SHOW_DELAY, 3));
    showDelay.connect("value_changed", Lang.bind(showDelay, function() {
      Utils.setParameter(Utils.HIDE_TOP_SHOW_DELAY, this.get_value());
    }));
    grid.attach(showDelay, 4, row, 2, 1);
    row++;

    grid.attach( new Gtk.Label({
      halign: Gtk.Align.START,  label: "Animation time [strange factor]"
    }), 0, row, 3, 1);
    let animationTime = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 1, 10, 1 );
    animationTime.set_value(Utils.getNumber(Utils.HIDE_TOP_ANIMATION_TIME, 4));
    animationTime.connect("value_changed", Lang.bind(animationTime, function() {
      Utils.setParameter(Utils.HIDE_TOP_ANIMATION_TIME, this.get_value());
    }));
    grid.attach(animationTime, 4, row, 2, 1);
    row++;

    return grid;
  }
});

function init() {

}

function buildPrefsWidget() {
    let widget = new SimpleMenuSettingsWidget();
    widget.show_all();
    return widget;
};
