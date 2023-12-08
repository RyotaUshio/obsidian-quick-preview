import { Modifier, PluginSettingTab, Setting } from 'obsidian';
import QuickPreviewPlugin from './main';
import { getModifierNameInPlatform } from 'utils';


// Inspired by https://stackoverflow.com/a/50851710/13613783
export type KeysOfType<Obj, Type> = NonNullable<{ [k in keyof Obj]: Obj[k] extends Type ? k : never }[keyof Obj]>;

const POSITIONS = ['Auto', 'Top left', 'Top right', 'Bottom left', 'Bottom right', 'Custom'] as const;
type Position = typeof POSITIONS[number];

export interface QuickPreviewSettings {
	modifierToPreview: Modifier;
	lazyHide: boolean;
	position: Position;
	customPositionX: number;
	customPositionY: number;
	stickToMouse: boolean;
	log: boolean;
	disableCloseSuggest: boolean;
}

export const DEFAULT_SETTINGS: QuickPreviewSettings = {
	modifierToPreview: 'Alt',
	lazyHide: true,
	position: 'Auto',
	customPositionX: 0,
	customPositionY: 0,
	stickToMouse: true,
	log: false,
	disableCloseSuggest: false,
}

export class QuickPreviewSettingTab extends PluginSettingTab {
	constructor(public plugin: QuickPreviewPlugin) {
		super(plugin.app, plugin);
	}

	addTextSetting(settingName: KeysOfType<QuickPreviewSettings, string>) {
		return new Setting(this.containerEl)
			.addText((text) => {
				text.setValue(this.plugin.settings[settingName])
					.setPlaceholder(DEFAULT_SETTINGS[settingName])
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
					});
			});
	}

	addNumberSetting(settingName: KeysOfType<QuickPreviewSettings, number>) {
		return new Setting(this.containerEl)
			.addText((text) => {
				text.setValue('' + this.plugin.settings[settingName])
					.setPlaceholder('' + DEFAULT_SETTINGS[settingName])
					.then((text) => text.inputEl.type = "number")
					.onChange(async (value) => {
						this.plugin.settings[settingName] = value === '' ? DEFAULT_SETTINGS[settingName] : +value;
						await this.plugin.saveSettings();
					});
			});
	}

	addToggleSetting(settingName: KeysOfType<QuickPreviewSettings, boolean>, extraOnChange?: (value: boolean) => void) {
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

	addDropdowenSetting(settingName: KeysOfType<QuickPreviewSettings, string>, options: readonly string[], display?: (option: string) => string, extraOnChange?: (value: string) => void) {
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
						extraOnChange?.(value);
					});
			});
	}

	addSliderSetting(settingName: KeysOfType<QuickPreviewSettings, number>, min: number, max: number, step: number) {
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
			.setName('Modifier key to toggle quick preview')
			.setDesc('Hold down this key to preview a suggestion before selecting it.');
		this.addDropdowenSetting('position', POSITIONS as unknown as string[], undefined, () => this.display())
			.setName('Quick preview position')
			.setDesc('Where to show the quick preview.');
		if (this.plugin.settings.position === 'Custom') {
			this.addNumberSetting('customPositionX')
				.setName('Custom x coordinate')
				.setDesc('Offset relative to the left edge of the window.');
			this.addNumberSetting('customPositionY')
				.setName('Custom y coordinate')
				.setDesc('Offset relative to the top edge of the window.');;
		}
		this.addToggleSetting('stickToMouse')
			.setName('Stick to mouse position')
			.setDesc('If turned on, the preview popover will follow the mouse pointer.');
		this.addToggleSetting('lazyHide')
			.setName("Don't close the current preview until the next preview is ready")
			.setDesc('If turned on, pressing arrow keys or hovering the mouse pointer over a suggestion while holding the modifier key will not immediately close the preview, but instead wait for the preview for the newly selected suggestion to load.');

		new Setting(this.containerEl).setName('Debug mode (advanced)').setHeading();

		this.addToggleSetting('log')
			.setName('Show selected suggestion in console');
		this.addToggleSetting('disableCloseSuggest', (disable) => {
			const suggest = this.plugin.getBuiltInSuggest();
			if (!disable && suggest.isOpen) suggest.close();
		}).setName('Prevent the suggestion box from closing')
			.setDesc('Useful for inspecting the suggestion box DOM.');
	}
}
