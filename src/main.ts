import { HoverParent, HoverPopover, Keymap, Plugin, PopoverSuggest, UserEvent } from 'obsidian';
import { around } from 'monkey-around';

import { DEFAULT_SETTINGS, QuickPreviewSettings, QuickPreviewSettingTab } from 'settings';
import { PopoverManager } from 'popoverManager';
import { getSelectedItem } from 'utils';
import { BuiltInSuggest, BuiltInSuggestItem, PatchedSuggester, QuickSwitcherItem, Suggester, SuggestItem } from 'typings/suggest';
import { ReloadModal } from 'reload';
import { QuickPreviewHoverParent } from 'hoverParent';
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
			const itemNormalizer = (item: BuiltInSuggestItem | QuickSwitcherItem): SuggestItem => {
				if (item.type === "alias") {
					return { type: "file", file: item.file };
				} else if (item.type === "block") {
					return {
						type: "block",
						file: item.file,
						line: item.node.position.start.line,
					};
				}
				return item;
			};
			// @ts-ignore
			this.patchSuggester(this.getBuiltInSuggest().constructor, itemNormalizer);
			this.patchSuggester(this.app.internalPlugins.getPluginById('switcher').instance.QuickSwitcherModal, itemNormalizer);
			this.patchHoverPopover();
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

					if (this.chooser.manager instanceof PopoverManager) {
						const manager = this.chooser.manager as PopoverManager<any>;

						if (plugin.settings.log) console.log(getSelectedItem(this));

						if (event && Keymap.isModifier(event, plugin.settings.modifier)) {
							const item = getSelectedItem(this as Suggestions<any>);
							manager.spawnPreview(item, plugin.settings.lazyHide, event);
						}
					}
				}
			}
		}));
	}

	patchSuggester<T>(suggestClass: new (...args: any[]) => Suggester<T>, itemNormalizer: (item: T) => SuggestItem) {
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
					if (plugin.settings.disableCloseSuggest) return;
					old.call(this);
					this.manager.unload();
				}
			}
		});

		this.register(uninstaller);

		return uninstaller;
	}

	patchHoverPopover() {
		this.register(around(HoverPopover.prototype, {
			position(old) {
				return function (pos: { x: number, y: number, doc: Document } | null) {
					const self = this as HoverPopover;

					if (!(self.parent instanceof QuickPreviewHoverParent)) {
						old.call(this, pos);
						return;
					}

					const shownPos = self.parent.manager.getShownPos();
					old.call(self, self.shownPos = { ...shownPos, doc: pos?.doc ?? document });
				}
			}
		}));
	}
}
