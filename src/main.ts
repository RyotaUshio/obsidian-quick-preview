import { Component, MarkdownRenderer, EditorSuggest, HoverParent, HoverPopover, Keymap, Plugin, stripHeadingForLink } from 'obsidian';
import { around } from 'monkey-around';

import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from 'settings';
import { BlockLinkInfo, FileLinkInfo, HeadingLinkInfo } from 'typings/items';
import { extractFirstNLines, render } from 'utils';

type Item = FileLinkInfo | HeadingLinkInfo | BlockLinkInfo;
type BuiltInAutocompletion = EditorSuggest<Item> & { component: Component };

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new SampleSettingTab(this));

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
								app.workspace.trigger('link-hover', parent, null, item.file.path, "")
							} else if (item.type === 'heading') {
								app.workspace.trigger('link-hover', parent, null, item.file.path + '#' + stripHeadingForLink(item.heading), "")
							} else if (item.type === 'block') {
								app.workspace.trigger('link-hover', parent, null, item.file.path, "", { scroll: item.node.position.start.line })
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

					if (item.type === "block") {
						if (plugin.settings[item.node.type] === false) return;

						let text = item.content.slice(item.node.position.start.offset, item.node.position.end.offset);
						let limit: number | undefined = (plugin.settings as any)[item.node.type + 'Lines'];
						if (limit) text = extractFirstNLines(text, limit);
					
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

export class KeyEventAwareHoverParent extends Component implements HoverParent {
	#hoverPopover: HoverPopover | null;

	constructor(private plugin: MyPlugin, private suggest: BuiltInAutocompletion) {
		super();
		this.#hoverPopover = null;
	}

	onunload() {
		super.onunload();
		this.hideChild();
	}

	hideChild() {
		/// @ts-ignore
		this.#hoverPopover?.hide();
	}

	get hoverPopover() {
		return this.#hoverPopover;
	}

	set hoverPopover(hoverPopover: HoverPopover | null) {
		this.#hoverPopover = hoverPopover;
		if (this.#hoverPopover) {
			this.addChild(this.#hoverPopover);
			this.#hoverPopover.hoverEl.addClass('math-booster');
			this.#hoverPopover.hoverEl.toggleClass('compact-font', this.plugin.settings.compactPreview);
			this.#hoverPopover.registerDomEvent(document.body, 'keydown', (event: KeyboardEvent) => {
				if (event.key === 'ArrowUp') {
					event.preventDefault();
					this.hideChild();
					this.suggest.suggestions.moveUp(event);
				} else if (event.key === 'ArrowDown') {
					event.preventDefault();
					this.hideChild();
					this.suggest.suggestions.moveDown(event);
				}

			})
			this.#hoverPopover.registerDomEvent(window, 'keyup', (event: KeyboardEvent) => {
				if (event.key === this.plugin.settings.modifierToPreview) this.hideChild();
			})
		}
	}
}
