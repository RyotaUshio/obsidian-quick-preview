import { stripHeadingForLink } from 'obsidian';
import { HoverParent, Keymap, Plugin, UserEvent } from 'obsidian';
import { around } from 'monkey-around';

import { DEFAULT_SETTINGS, QuickPreviewSettings, QuickPreviewSettingTab } from 'settings';
import { PopoverManager } from 'popoverManager';
import { getSelectedItem } from 'utils';
import { BuiltInSuggest, BuiltInSuggestItem, PatchedSuggester, QuickSwitcherItem, Suggester, PreviewInfo, QuickSwitcherPlusHeadingItem, QuickSwitcherPlusSymbolItem, QuickSwitcherPlusFileBookmarkItem } from 'typings/suggest';
import { ReloadModal } from 'reload';
import { Suggestions } from 'typings/obsidian';


export default class QuickPreviewPlugin extends Plugin {
	settings: QuickPreviewSettings;
	#originalOnLinkHover: (hoverParent: HoverParent, targetEl: HTMLElement | null, linktext: string, sourcePath: string, state?: any) => any;

	async onload() {
		/**
		 * Hover Editor completely replaces the core Page Preview plugin's onLinkHover method with its own
		 * when the workspace's layout gets ready.
		 * But Hover Editor's version is incompatible with this plugin, so we need to store the original method
		 * before it's modified by Hover Editor and call it instead.
		 */
		if (this.app.workspace.layoutReady && this.app.plugins.enabledPlugins.has('obsidian-hover-editor')) {
			new ReloadModal(this.app).open();
		}
		this.#originalOnLinkHover = this.app.internalPlugins.getPluginById('page-preview').instance.onLinkHover;

		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new QuickPreviewSettingTab(this));

		this.app.workspace.onLayoutReady(() => {
			this.patchSetSelectedItem();
			// @ts-ignore
			this.patchSuggester(this.getBuiltInSuggest().constructor, (item: BuiltInSuggestItem): PreviewInfo | null => {
				if (!item.file) return null;
				const info: PreviewInfo = { linktext: item.file.path, sourcePath: '' };
				if (item.type === 'heading') info.linktext += '#' + stripHeadingForLink(item.heading);
				else if (item.type === 'block') info.line = item.node.position.start.line;
				return info;
			});
			this.patchSuggester(
				this.app.internalPlugins.getPluginById('switcher').instance.QuickSwitcherModal,
				(item: QuickSwitcherItem | QuickSwitcherPlusHeadingItem | QuickSwitcherPlusSymbolItem | QuickSwitcherPlusFileBookmarkItem): PreviewInfo | null => {
					if (!item.file) return null;
					const info: PreviewInfo = { linktext: item.file.path, sourcePath: '' };
					// For Quick Switcher++
					if (item.type === 'headingsList') info.linktext += '#' + stripHeadingForLink(item.item.heading);
					else if (item.type === 'symbolList') info.line = item.item.symbol.position.start.line;
					else if (item.type === 'bookmark' && item.item.type === 'file') info.linktext = item.item.path + (item.item.subpath ?? '');
					return info;
				}
			);
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
				return function (index: number, event: UserEvent | null) {
					old.call(this, index, event);

					if (this.chooser.popoverManager instanceof PopoverManager) {
						const manager = this.chooser.popoverManager as PopoverManager<any>;

						if (plugin.settings.log) console.log(getSelectedItem(this));

						if (event && Keymap.isModifier(event, plugin.settings.modifier)) {
							const item = getSelectedItem(this as Suggestions<any>);
							if (item) manager.spawnPreview(item, plugin.settings.lazyHide, event);
						}
					}
				}
			}
		}));
	}

	patchSuggester<T>(suggestClass: new (...args: any[]) => Suggester<T>, itemNormalizer: (item: T) => PreviewInfo | null) {
		const prototype = suggestClass.prototype;
		const plugin = this;

		const uninstaller = around(prototype, {
			open(old) {
				return function () {
					old.call(this);
					const self = this as PatchedSuggester<T>;
					if (!self.popoverManager) self.popoverManager = new PopoverManager<T>(plugin, self, itemNormalizer);
					self.popoverManager.load();
				}
			},
			close(old) {
				return function () {
					if (plugin.settings.disableCloseSuggest) return;
					old.call(this);
					this.popoverManager?.unload(); // close() can be called before open() at startup, so we need the optional chaining (?.)
				}
			}
		});

		this.register(uninstaller);

		return uninstaller;
	}
}
