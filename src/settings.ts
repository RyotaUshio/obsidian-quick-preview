import { PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';


export interface MyPluginSettings {
	math: boolean;
	// code: boolean;
	// callout: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	math: true,
	// code: true,
	// callout: true,
}

export class SampleSettingTab extends PluginSettingTab {
	constructor(public plugin: MyPlugin) {
		super(plugin.app, plugin);
	}

	addSetting(name: string, settingName: keyof MyPluginSettings) {
		new Setting(this.containerEl)
		.setName(name)
		.addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.math)
			toggle.onChange(async (value) => {
				this.plugin.settings[settingName] = value;
				await this.plugin.saveSettings();
			});
		});
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.addSetting('Math', 'math');
	}
}
