import { Modifier, PluginSettingTab, Setting } from 'obsidian';
import EnhancedLinkSuggestionsPlugin from './main';
import { getModifierNameInPlatform } from 'utils';


// Inspired by https://stackoverflow.com/a/50851710/13613783
export type KeysOfType<Obj, Type> = { [k in keyof Obj]: Obj[k] extends Type ? k : never }[keyof Obj];


export interface EnhancedLinkSuggestionsSettings {
	code: boolean;
	blockquote: boolean;
	heading: boolean;
	paragraph: boolean;
	callout: boolean;
	math: boolean;
	listItem: boolean;
	footnoteDefinition: boolean;
	element: boolean;
	table: boolean;
	comment: boolean;
	codeLines: number;
	blockquoteLines: number;
	paragraphLines: number;
	calloutLines: number;
	listItemLines: number;
	footnoteDefinitionLines: number;
	elementLines: number;
	tableLines: number;
	commentLines: number;
	modifierToPreview: Modifier;
	lazyHide: boolean;
	dev: boolean;
	disableClose: boolean;
}

export const DEFAULT_SETTINGS: EnhancedLinkSuggestionsSettings = {
	code: true,
	blockquote: true,
	heading: true,
	paragraph: true,
	callout: true,
	math: true,
	listItem: true,
	footnoteDefinition: true,
	element: true,
	table: true,
	comment: true,
	codeLines: 0,
	blockquoteLines: 0,
	paragraphLines: 0,
	calloutLines: 0,
	listItemLines: 0,
	footnoteDefinitionLines: 0,
	elementLines: 0,
	tableLines: 0,
	commentLines: 0,
	modifierToPreview: 'Alt',
	lazyHide: true,
	dev: false,
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
			.setDesc('Hold down this key to preview the link without clicking.');
		this.addToggleSetting('lazyHide')
			.setName("Don't close the preview until the new preview is ready")
			.setDesc('If turned on, pressing arrow keys or hovering the mouse over the suggestions while holding the modifier key will not immediately close the preview, but instead wait for the preview for the newly selected suggestion to load.');

		new Setting(this.containerEl).setName('Block markdown rendering').setHeading();
		this.addToggleSetting('paragraph').setName('Render paragraphs');
		this.addSliderSetting('paragraphLines', 0, 10, 1)
			.setName('Paragraph line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('heading').setName('Render headings');
		this.addToggleSetting('callout').setName('Render callouts');
		this.addSliderSetting('calloutLines', 0, 10, 1)
			.setName('Callout line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('blockquote').setName('Render blockquotes');
		this.addSliderSetting('blockquoteLines', 0, 10, 1)
			.setName('Blockquote line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('code').setName('Render code blocks');
		this.addSliderSetting('codeLines', 0, 10, 1)
			.setName('Code block line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('math').setName('Render math blocks');
		this.addToggleSetting('listItem').setName('Render list items');
		this.addSliderSetting('listItemLines', 0, 10, 1)
			.setName('List item line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('table').setName('Render tables');
		this.addSliderSetting('tableLines', 0, 10, 1)
			.setName('Table line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('footnoteDefinition').setName('Render footnote definitions');
		this.addSliderSetting('footnoteDefinitionLines', 0, 10, 1)
			.setName('Footnote definition line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('element').setName('Render elements');
		this.addSliderSetting('elementLines', 0, 10, 1)
			.setName('Element line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');
		this.addToggleSetting('comment').setName('Render comments');
		this.addSliderSetting('commentLines', 0, 10, 1)
			.setName('Comment line limit')
			.setDesc('Maximum number of lines to render. Set to 0 to disable line limit.');

		new Setting(this.containerEl).setName('Debug mode (advanced)').setHeading();

		this.addToggleSetting('dev')
			.setName('Log suggestion items to console')
			.setDesc('Show metadata about suggestion items in the dev console.');
		this.addToggleSetting('disableClose', (disable) => {
			const suggest = this.plugin.getSuggest();
			if (!disable && suggest.isOpen) suggest.close();
		}).setName('Prevent the suggestion box from closing')
			.setDesc('Useful for inspecting the suggestion box.');
	}
}
