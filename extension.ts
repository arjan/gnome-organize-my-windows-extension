import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { showToastMessage } from "./util.js";

type WindowInfo = {
  monitorIndex: number;
  workspaceIndex: number;
  maximized: number;
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

  windows: WindowInfo[] = [];

  enable() {
    this.gsettings = this.getSettings();

    global.windowManager.connect("switch-workspace", () => console.log("a"));

    Main.wm.addKeybinding(
      "restore-shortcut-key",
      this.gsettings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL,
      this._restore_layout.bind(this),
    );

    Main.wm.addKeybinding(
      "save-shortcut-key",
      this.gsettings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL,
      this._save_layout.bind(this),
    );

    this._gather();
  }

  disable() {
    this.gsettings = undefined;

    Main.wm.removeKeybinding("save-shortcut-key");
  }

  _restore_layout() {
    showToastMessage("Restoring...");

    const n = global.workspaceManager.get_n_workspaces();
    for (let i = 0; i < n; i++) {
      const ws = global.workspaceManager.get_workspace_by_index(i);
      if (!ws) continue;

      for (const win of ws.list_windows()) {
        const info = findWindowMatch(this.windows, win);
        if (info) {
          console.log("match:", JSON.stringify(info));

          if (win.get_workspace().index() !== info.workspaceIndex) {
            const ws = global.workspaceManager.get_workspace_by_index(
              info.workspaceIndex,
            );
            if (ws) {
              win.change_workspace(ws);
            }
          }

          if (win.get_maximized() != info.maximized) {
            win.maximize(info.maximized);
          }

          win.move_resize_frame(false, info.x, info.y, info.width, info.height);
        }
      }
    }
  }

  _gather() {
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
          workspaceIndex: i,
          title: win.get_title(),
          maximized: win.get_maximized(),
          wmClass: win.get_wm_class(),
          wmClassInstance: win.get_wm_class_instance(),
          x,
          y,
          width,
          height,
        });
      }
    }
    this.windows = info;
  }

  _save_layout() {
    this._gather();

    let file = Gio.File.new_for_path(this._filepath());
    let outputStream = file.replace(
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null,
    );

    // Convert the content string to bytes and write it to the file
    const content = JSON.stringify(this.windows, null, 2);
    outputStream.write_all(new TextEncoder().encode(content), null);

    // Close the stream
    outputStream.close(null);

    console.log("written!", this._filepath());

    showToastMessage("Window configuration saved!");
  }

  _filepath() {
    return GLib.build_filenamev([
      GLib.get_user_config_dir(),
      "organize-my-windows.json",
    ]);
  }
}

function findWindowMatch(
  windows: WindowInfo[],
  win: Meta.Window,
): WindowInfo | null {
  for (const info of windows) {
    if (info.title === win.get_title()) {
      return info;
    }
    if (info.wmClassInstance === win.get_wm_class_instance()) {
      return info;
    }
    if (info.wmClass === win.get_wm_class()) {
      return info;
    }
  }
  return null;
}
