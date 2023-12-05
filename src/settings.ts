import { Modifier, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';


// https://stackoverflow.com/a/50851710/13613783
export type BooleanKeys<T> = { [k in keyof T]: T[k] extends boolean ? k : never }[keyof T];
export type NumberKeys<T> = { [k in keyof T]: T[k] extends number ? k : never }[keyof T];


export interface MyPluginSettings {
	math: boolean;
	// code: boolean;
	callout: boolean;
	dev: boolean;
	modifierToPreview: Modifier;
	compactPreview: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	math: true,
	// code: true,
	callout: true,
	dev: false,
	modifierToPreview: 'Alt',
	compactPreview: false,
}

export class SampleSettingTab extends PluginSettingTab {
	constructor(public plugin: MyPlugin) {
		super(plugin.app, plugin);
	}

	addToggleSetting(name: string, settingName: BooleanKeys<MyPluginSettings>) {
		return new Setting(this.containerEl)
			.setName(name)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings[settingName])
				toggle.onChange(async (value) => {
					this.plugin.settings[settingName] = value;
					await this.plugin.saveSettings();
				});
			});
	}

	addEnableSetting(name: string, settingName: BooleanKeys<MyPluginSettings>) {
		return this.addToggleSetting(name, settingName).setHeading();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.addEnableSetting('Math blocks', 'math');
		this.addEnableSetting('Callouts', 'callout');
		this.addToggleSetting('Compact hover preview', 'compactPreview');
		this.addToggleSetting('Dev mode', 'dev');
	}
}
