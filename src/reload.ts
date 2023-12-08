import { App, Modal, Setting } from "obsidian"

export class ReloadModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        this.titleEl.setText('Quick Preview');
        this.contentEl.setText('You need to reload the app to be able to use this plugin together with Hover Editor.')
        new Setting(this.contentEl)
            .addButton((button) => {
                button
                    .setButtonText("Reload")
                    .setCta()
                    .onClick(() => this.app.commands.executeCommandById('app:reload'));
            })
            .addButton((button) => {
                button
                    .setButtonText("Not now")
                    .onClick(() => this.close());
            })
    }

    onClose() {
        this.contentEl.empty();
    }
}
