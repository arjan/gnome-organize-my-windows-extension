import * as Main from "resource:///org/gnome/shell/ui/main.js";
import GLib from "gi://GLib";
import St from "gi://St";

export function showToastMessage(message: string) {
  // Create a new label for the message
  let label = new St.Label({
    styleClass: "notification-banner",
    text: message,
    style: "text-align: center; padding: 20px; height: 50px",
  });

  // Add the label to the UI
  Main.layoutManager.uiGroup.add_child(label);

  // Position the label at the bottom center of the screen
  label.set_position(
    Math.floor((global.stage.width - label.width) / 2),
    global.stage.height - label.height - 50,
  );

  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
    label.destroy();
    return GLib.SOURCE_REMOVE;
  });
}
