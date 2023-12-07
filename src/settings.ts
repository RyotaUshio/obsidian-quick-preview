import { Modifier, PluginSettingTab, Setting } from 'obsidian';
import EnhancedLinkSuggestionsPlugin from './main';
import { getModifierNameInPlatform } from 'utils';


// Inspired by https://stackoverflow.com/a/50851710/13613783
export type KeysOfType<Obj, Type> = { [k in keyof Obj]: Obj[k] extends Type ? k : never }[keyof Obj];


export interface EnhancedLinkSuggestionsSettings {
	modifierToPreview: Modifier;
	lazyHide: boolean;
	log: boolean;
	disableClose: boolean;
}

export const DEFAULT_SETTINGS: EnhancedLinkSuggestionsSettings = {
	modifierToPreview: 'Alt',
	lazyHide: true,
	log: false,
	disableClose: false,
}

export class EnhancedLinkSuggestionsSettingTab extends PluginSettingTab {
	constructor(public plugin: EnhancedLinkSuggestionsPlugin) {
		super(plugin.app, plugin);
	}

	addToggleSetting(settingName: KeysOfType<EnhancedLinkSuggestionsSettings, boolean>, extraOnChange?: (value: boolean) => void) {
		return new Setting(this.containerEl)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings[settingName])
					.onChange(async (value) => {
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
						extraOnChange?.(value);
					});
			});
	}

	addDropdowenSetting(settingName: KeysOfType<EnhancedLinkSuggestionsSettings, string>, options: string[], display?: (option: string) => string) {
		return new Setting(this.containerEl)
			.addDropdown((dropdown) => {
				const displayNames = new Set<string>();
				for (const option of options) {
					const displayName = display?.(option) ?? option;
					if (!displayNames.has(displayName)) {
						dropdown.addOption(option, displayName);
						displayNames.add(displayName);
					}
				};
				dropdown.setValue(this.plugin.settings[settingName])
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
					});
			});
	}

	addSliderSetting(settingName: KeysOfType<EnhancedLinkSuggestionsSettings, number>, min: number, max: number, step: number) {
		return new Setting(this.containerEl)
			.addSlider((slider) => {
				slider.setLimits(min, max, step)
					.setValue(this.plugin.settings[settingName])
					.setDynamicTooltip()
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
					});
			});
	}

	display(): void {
		this.containerEl.empty();

		this.addDropdowenSetting('modifierToPreview', ['Mod', 'Ctrl', 'Meta', 'Shift', 'Alt'], getModifierNameInPlatform)
			.setName('Modifier key for quick preview')
			.setDesc('Hold down this key to preview a suggestion before selecting it.');
		this.addToggleSetting('lazyHide')
			.setName("Don't close the current preview until the next preview is ready")
			.setDesc('If turned on, pressing arrow keys or hovering the mouse over the suggestions while holding the modifier key will not immediately close the preview, but instead wait for the preview for the newly selected suggestion to load.');

		new Setting(this.containerEl).setName('Debug mode (advanced)').setHeading();

		this.addToggleSetting('log')
			.setName('Show selected suggestion in console');
		this.addToggleSetting('disableClose', (disable) => {
			const suggest = this.plugin.getBuiltInSuggest();
			if (!disable && suggest.isOpen) suggest.close();
		}).setName('Prevent the suggestion box from closing')
			.setDesc('Useful for inspecting the suggestion box.');
	}
}
