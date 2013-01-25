const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = new Me.imports.utils.Utils();

const SimpleMenuSettingsWidget = new GObject.Class({
  Name: 'SimpleMenu.Prefs.SimpleMenuSettingsWidget',
  GTypeName: 'SimpleMenuSettingsWidget',
  Extends: Gtk.Grid,

  _init: function(params) {
    this.parent(params);
    this.orientation = Gtk.Orientation.VERTICAL;
    this.expand = true;

    let hideButtons = new Gtk.Expander();
    hideButtons.set_label("Panel Buttons");
    hideButtons.add(this._generatePanelButtonSettings());
    this.attach(hideButtons, 0, 0, 1, 9);

  },

  _addLabeledSwitch: function(container, row, label, settingsName, labelWidth, buttonWidth) {
    if (!labelWidth) {
      labelWidth = 4;
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

  _generatePanelButtonSettings: function() {
    let ret = new Gtk.Grid();
    ret.width = 6;
    ret.column_homogeneous = true;
    this.set_margin_left(5);
    this.set_margin_right(5);

    let row = 0;
    this._addLabeledSwitch(ret, row, "Enable development tools (LoogkinGlass, shell reload..)", Utils.DEV_TOOLS);
    row++;
    this._addLabeledSwitch(ret, row, "Hide Bluetooth  icon", Utils.HIDE_BLUETOOTH);
    row++;
    this._addLabeledSwitch(ret, row, "Hide Volume icon", Utils.HIDE_VOLUME);
    row++;
    this._addLabeledSwitch(ret, row, "Hide A11y icon", Utils.HIDE_A11Y);
    return ret;
  }
});

function init() {

}

function buildPrefsWidget() {
    let widget = new SimpleMenuSettingsWidget();
    widget.show_all();
    return widget;
};

