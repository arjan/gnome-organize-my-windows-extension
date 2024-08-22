import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class GnomeRectanglePreferences extends ExtensionPreferences {
  _settings?: Gio.Settings;

  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    this._settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _("General"),
      iconName: "dialog-information-symbolic",
    });

    const shortcutGroup = new Adw.PreferencesGroup({
      title: _("Shortcut key"),
      description: _("Configure shortcut key"),
    });

    const shortcutLabel = new Gtk.ShortcutLabel({
      disabledText: _("Select a shortcut"),
      accelerator: this._settings.get_strv("shortcut-key")[0] || "",
      valign: Gtk.Align.CENTER,
      halign: Gtk.Align.CENTER,
    });

    this._settings.connect("changed::shortcut-key", () => {
      shortcutLabel.set_accelerator(
        this._settings?.get_strv("shortcut-key")[0] || "",
      );
    });

    let rowShortcut = new Adw.ActionRow({
      title: _("Shortcut Key"),
      subtitle: _("Shortcut to organize the windows"),
    });

    rowShortcut.connect("activated", () => {
      const ctl = new Gtk.EventControllerKey();
      const content = new Adw.StatusPage({
        title: _("New Shortcut"),
        description: _(
          "The shortcut will be accepted only if it is not already in use.",
        ),
        iconName: "preferences-desktop-keyboard-shortcuts-symbolic",
      });
      const editor = new Adw.Window({
        modal: true,
        hideOnClose: true,
        widthRequest: 320,
        heightRequest: 240,
        resizable: false,
        content,
      });
      editor.add_controller(ctl);
      ctl.connect("key-pressed", (_, keyval, keycode, state) => {
        let mask = state & Gtk.accelerator_get_default_mod_mask();
        mask &= ~Gdk.ModifierType.LOCK_MASK;
        if (!mask && keyval === Gdk.KEY_Escape) {
          editor.close();
          return Gdk.EVENT_STOP;
        }
        if (!isValidBinding$1(mask, keyval) || !isValidAccel$1(mask, keyval)) {
          return Gdk.EVENT_STOP;
        }
        this._settings?.set_strv("shortcut-key", [
          Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask) || "",
        ]);
        editor.destroy();
        return Gdk.EVENT_STOP;
      });
      editor.present();
    });

    rowShortcut.add_suffix(shortcutLabel);
    rowShortcut.activatableWidget = shortcutLabel;
    shortcutGroup.add(rowShortcut);
    page.add(shortcutGroup);

    window.add(page);

    this._settings!.bind(
      "shortcut-key",
      shortcutLabel,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }
}

const isValidAccel$1 = (mask: number, keyval: number) => {
  return (
    Gtk.accelerator_valid(keyval, mask) ||
    (keyval === Gdk.KEY_Tab && mask !== 0)
  );
};

const isValidBinding$1 = (mask: number, keyval: number) => {
  return !(
    mask === 0 ||
    (mask === Gdk.ModifierType.SHIFT_MASK &&
      ((keyval >= Gdk.KEY_a && keyval <= Gdk.KEY_z) ||
        (keyval >= Gdk.KEY_A && keyval <= Gdk.KEY_Z) ||
        (keyval >= Gdk.KEY_0 && keyval <= Gdk.KEY_9) ||
        (keyval >= Gdk.KEY_kana_fullstop &&
          keyval <= Gdk.KEY_semivoicedsound) ||
        (keyval >= Gdk.KEY_Arabic_comma && keyval <= Gdk.KEY_Arabic_sukun) ||
        (keyval >= Gdk.KEY_Serbian_dje &&
          keyval <= Gdk.KEY_Cyrillic_HARDSIGN) ||
        (keyval >= Gdk.KEY_Greek_ALPHAaccent &&
          keyval <= Gdk.KEY_Greek_omega) ||
        (keyval >= Gdk.KEY_hebrew_doublelowline &&
          keyval <= Gdk.KEY_hebrew_taf) ||
        (keyval >= Gdk.KEY_Thai_kokai && keyval <= Gdk.KEY_Thai_lekkao) ||
        (keyval >= Gdk.KEY_Hangul_Kiyeog &&
          keyval <= Gdk.KEY_Hangul_J_YeorinHieuh) ||
        (keyval === Gdk.KEY_space && mask === 0)))
  );
};
