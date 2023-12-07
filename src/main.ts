import { HoverParent, Keymap, Plugin } from 'obsidian';
import { around } from 'monkey-around';

import { DEFAULT_SETTINGS, EnhancedLinkSuggestionsSettings, EnhancedLinkSuggestionsSettingTab } from 'settings';
import { PopoverManager } from 'popoverManager';
import { getSelectedItem } from 'utils';
import { BuiltInSuggest, BuiltInSuggestItem, PatchedSuggester, QuickSwitcherItem, Suggester, SuggestItem } from 'typings/suggest';


export default class EnhancedLinkSuggestionsPlugin extends Plugin {
	settings: EnhancedLinkSuggestionsSettings;
	#originalOnLinkHover: (hoverParent: HoverParent, targetEl: HTMLElement | null, linktext: string, sourcePath: string, state?: any) => any;

	async onload() {
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new EnhancedLinkSuggestionsSettingTab(this));

		/**
		 * Hover Editor completely replaces the core Page Preview plugin's onLinkHover method with its own
		 * when the workspace's layout gets ready.
		 * But Hover Editor's version is incompatible with this plugin, so we need to store the original method
		 * before it's modified by Hover Editor and call it instead.
		 */
		this.#originalOnLinkHover = this.app.internalPlugins.getPluginById('page-preview').instance.onLinkHover;

		this.app.workspace.onLayoutReady(() => {
			this.patchSetSelectedItem();
			const itemNormalizer = (item: BuiltInSuggestItem | QuickSwitcherItem): SuggestItem => {
				if (item.type !== "block") return item as SuggestItem;
				return {
					type: "block",
					file: item.file,
					line: item.node.position.start.line,
				};
			}
			// @ts-ignore
			this.patchSuggester(this.getBuiltInSuggest().constructor, itemNormalizer);
			this.patchSuggester(this.app.internalPlugins.getPluginById('switcher').instance.QuickSwitcherModal, itemNormalizer);
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** Call the core Page Preview plugin's (potentially) original onLinkHover method. */
	onLinkHover(hoverParent: HoverParent, targetEl: HTMLElement | null, linktext: string, sourcePath: string, state?: any) {
		const self = this.app.internalPlugins.getPluginById('page-preview').instance;
		return this.#originalOnLinkHover.call(self, hoverParent, targetEl, linktext, sourcePath, state);
	}

	getBuiltInSuggest(): BuiltInSuggest {
		// @ts-ignore
		return this.app.workspace.editorSuggest.suggests[0];
	}

	patchSetSelectedItem() {
		const plugin = this;

		const suggest = this.getBuiltInSuggest();
		this.register(around(suggest.suggestions.constructor.prototype, {
			setSelectedItem(old) {
				return function (index: number, event: KeyboardEvent | null) {
					old.call(this, index, event);

					if (this.chooser.manager instanceof PopoverManager) {
						if (event && Keymap.isModifier(event, plugin.settings.modifierToPreview)) {
							const item = getSelectedItem(this);
							this.chooser.manager.spawnPreview(item, plugin.settings.lazyHide);
						}
					}
				}
			}
		}))

	}

	patchSuggester<T>(suggestClass: new (...args: any[]) => Suggester<T>, itemNormalizer?: (item: T) => SuggestItem) {
		const prototype = suggestClass.prototype;
		const plugin = this;

		const uninstaller = around(prototype, {
			open(old) {
				return function () {
					old.call(this);
					const self = this as PatchedSuggester<T>;
					if (!self.manager) self.manager = new PopoverManager<T>(plugin, self, itemNormalizer);
					self.manager.load();
				}
			},
			close(old) {
				return function () {
					if (plugin.settings.disableClose) return;
					old.call(this);
					this.manager.unload();
				}
			}
		});

		this.register(uninstaller);

		return uninstaller;
	}
}
