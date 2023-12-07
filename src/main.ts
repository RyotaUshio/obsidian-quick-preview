import { Component, MarkdownRenderer, EditorSuggest, HoverParent, Keymap, Plugin } from 'obsidian';
import { around } from 'monkey-around';

import { DEFAULT_SETTINGS, EnhancedLinkSuggestionsSettings, EnhancedLinkSuggestionsSettingTab } from 'settings';
import { BlockLinkInfo, FileLinkInfo, HeadingLinkInfo } from 'typings/items';
import { extractFirstNLines, getSelectedItem, render } from 'utils';
import { PopoverManager } from 'popoverManager';


export type Item = FileLinkInfo | HeadingLinkInfo | BlockLinkInfo;
export type BuiltInAutocompletion = EditorSuggest<Item> & { manager: PopoverManager };

export default class EnhancedLinkSuggestionsPlugin extends Plugin {
	settings: EnhancedLinkSuggestionsSettings;
	#originalOnLinkHover: (hoverParent: HoverParent, targetEl: HTMLElement | null, linktext: string, sourcePath: string, state?: any) => any;

	async onload() {
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new EnhancedLinkSuggestionsSettingTab(this));

		/**
		 * Hover Editor completely replaces the core Page Preview plugin's onLinkHover method with its own.
		 * But Hover Editor's version is incompatible with this plugin, so we need to store the original method
		 * and call it instead.
		 */
		if (this.app.plugins.enabledPlugins.has('obsidian-hover-editor')) {
			await this.app.plugins.disablePlugin('obsidian-hover-editor');
			this.#originalOnLinkHover = this.app.internalPlugins.getPluginById('page-preview').instance.onLinkHover
			await this.app.plugins.enablePlugin('obsidian-hover-editor');
		} else {
			this.#originalOnLinkHover = this.app.internalPlugins.getPluginById('page-preview').instance.onLinkHover
		}

		this.app.workspace.onLayoutReady(() => this.patch());
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

	getSuggest(): BuiltInAutocompletion {
		// @ts-ignore
		return this.app.workspace.editorSuggest.suggests[0];
	}

	patch() {
		const suggest = this.getSuggest();
		const prototype = suggest.constructor.prototype;
		const plugin = this;
		const app = this.app;

		this.register(around(prototype, {
			open(old) {
				return function () {
					old.call(this);
					const self = this as BuiltInAutocompletion;
					if (!self.manager) self.manager = new PopoverManager(plugin, self);
					self.manager.load();
				}
			},
			close(old) {
				return function () {
					if (plugin.settings.disableClose) return;
					old.call(this);
					this.manager.unload();
				}
			},
			renderSuggestion(old) {
				return function (item: Item, el: HTMLElement) {
					old.call(this, item, el);

					if (plugin.settings.dev) console.log(item);

					el.setAttribute('data-item-type', item.type);

					if (item.type === "block") {
						el.setAttribute('data-item-node-type', item.node.type);

						if (plugin.settings[item.node.type] === false) return;

						let text = item.content.slice(item.node.position.start.offset, item.node.position.end.offset);
						let limit: number | undefined = (plugin.settings as any)[item.node.type + 'Lines'];
						if (limit) text = extractFirstNLines(text, limit);

						if (item.node.type === "comment") {
							render(el, (containerEl) => {
								containerEl.setText(text);
							});
							return;
						}

						render(el, async (containerEl) => {
							containerEl.setAttribute('data-line', item.node.position.start.line.toString());
							await MarkdownRenderer.render(
								app, text, containerEl, item.file.path, this.manager
							);
							containerEl.querySelectorAll('.copy-code-button').forEach((el) => el.remove());
						});
					}
				}
			}
		}));


		this.register(around(suggest.suggestions.constructor.prototype, {
			setSelectedItem(old) {
				return function (index: number, event: KeyboardEvent | null) {
					old.call(this, index, event);

					if (this.chooser !== plugin.getSuggest()) return;

					if (event && Keymap.isModifier(event, plugin.settings.modifierToPreview)) {
						const item = getSelectedItem(this.chooser as BuiltInAutocompletion);
						(this.chooser as BuiltInAutocompletion).manager.spawnPreview(item);
					}
				}
			}
		}))
	}
}
