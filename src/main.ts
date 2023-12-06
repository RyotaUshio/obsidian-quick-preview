import { Component, MarkdownRenderer, EditorSuggest, HoverParent, Keymap, Plugin, stripHeadingForLink } from 'obsidian';
import { around } from 'monkey-around';

import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from 'settings';
import { BlockLinkInfo, FileLinkInfo, HeadingLinkInfo } from 'typings/items';
import { extractFirstNLines, render } from 'utils';
import { KeyEventAwareHoverParent } from 'hoverParent';

type Item = FileLinkInfo | HeadingLinkInfo | BlockLinkInfo;
export type BuiltInAutocompletion = EditorSuggest<Item> & { component: Component };

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	#originalOnLinkHover: (hoverParent: HoverParent, targetEl: HTMLElement | null, linktext: string, sourcePath: string, state?: any) => any;

	async onload() {
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new SampleSettingTab(this));

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

		this.app.workspace.onLayoutReady(() => {
			this.patch();
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** Call the core Page Preview plugin's (potentially) original onLinkHover method. */
	onLinkHover(...args: any[]) {
		const self = this.app.internalPlugins.getPluginById('page-preview').instance;
		return this.#originalOnLinkHover.call(self, ...args);
	}

	patch() {
		// @ts-ignore
		const suggest = this.app.workspace.editorSuggest.suggests[0] as BuiltInAutocompletion;
		const prototype = suggest.constructor.prototype;
		const plugin = this;
		const app = this.app;

		this.addChild(suggest.component = new Component());
		suggest.isOpen ? suggest.component.load() : suggest.component.unload();

		this.register(around(prototype, {
			open(old) {
				return function () {
					old.call(this);
					const self = this as BuiltInAutocompletion;
					self.component.load();
					self.component.registerDomEvent(window, 'keydown', (event) => {
						if (suggest.isOpen && Keymap.isModifier(event, plugin.settings.modifierToPreview)) {
							const item = suggest.suggestions.values[suggest.suggestions.selectedItem];
							const parent = new KeyEventAwareHoverParent(plugin, suggest);
							self.component.addChild(parent);
							if (item.type === 'file') {
								plugin.onLinkHover(parent, null, item.file.path, "")
							} else if (item.type === 'heading') {
								plugin.onLinkHover(parent, null, item.file.path + '#' + stripHeadingForLink(item.heading), "")
							} else if (item.type === 'block') {
								plugin.onLinkHover(parent, null, item.file.path, "", { scroll: item.node.position.start.line })
							}
						}
					});
				}
			},
			close(old) {
				return function () {
					old.call(this);
					this.component.unload();
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
								app, text, containerEl, item.file.path, this.component
							);
							containerEl.querySelectorAll('.copy-code-button').forEach((el) => el.remove());
						});
					}
				}
			}
		}));
	}
}
