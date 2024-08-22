import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

type WindowInfo = {
  monitorIndex: number;
  title: string;
  wmClass: string | null;
  wmClassInstance: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default class MyExtension extends Extension {
  gsettings?: Gio.Settings;

  enable() {
    this.gsettings = this.getSettings();

    global.windowManager.connect("switch-workspace", () => console.log("a"));

    Main.wm.addKeybinding(
      "shortcut-key",
      this.gsettings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL,
      this._organize.bind(this),
    );
  }

  disable() {
    this.gsettings = undefined;
  }

  _organize() {
    const info: WindowInfo[] = [];

    const n = global.workspaceManager.get_n_workspaces();
    for (let i = 0; i < n; i++) {
      const ws = global.workspaceManager.get_workspace_by_index(i);
      if (!ws) continue;

      for (const win of ws.list_windows()) {
        const rect = win.get_frame_rect();
        const { x, y, width, height } = rect;
        const monitorIndex = global.display.get_monitor_index_for_rect(rect);

        info.push({
          monitorIndex,
          title: win.get_title(),
          wmClass: win.get_wm_class(),
          wmClassInstance: win.get_wm_class_instance(),
          x,
          y,
          width,
          height,
        });
      }
    }

    let file = Gio.File.new_for_path(this._filepath());
    let outputStream = file.replace(
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null,
    );

    // Convert the content string to bytes and write it to the file
    const content = JSON.stringify(info, null, 2);
    outputStream.write_all(new TextEncoder().encode(content), null);

    // Close the stream
    outputStream.close(null);

    console.log("written!", this._filepath());
  }

  _filepath() {
    return GLib.build_filenamev([
      GLib.get_user_config_dir(),
      "organize-my-windows.json",
    ]);
  }
}
