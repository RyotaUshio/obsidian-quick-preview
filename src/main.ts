import { MarkdownRenderer, finishRenderMath } from 'obsidian';
import { Component, EditorSuggest, HoverParent, HoverPopover, Keymap, MarkdownView, Plugin, SearchMatches, TFile, renderMath, stripHeadingForLink } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from './settings';
import { around } from 'monkey-around';
import { BlockLinkInfo, CalloutLinkInfo, FileLinkInfo, HeadingLinkInfo, MathLinkInfo, MathNode } from 'typings/items';

type Item = FileLinkInfo | HeadingLinkInfo | MathLinkInfo | CalloutLinkInfo | BlockLinkInfo;
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
					this.component.load();
					(this.component as Component).registerDomEvent(window, 'keydown', (event) => {
						if (suggest.isOpen && Keymap.isModifier(event, plugin.settings.modifierToPreview)) {
							const item = suggest.suggestions.values[suggest.suggestions.selectedItem];
							const parent = new KeyupHandlingHoverParent(plugin, suggest);
							this.component.addChild(parent);
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
						if (plugin.settings.math && item.node?.type === "math") {
							renderInSuggestionTitleEl(el, (titleEl) => {
								titleEl.replaceChildren(renderMath((item.node as MathNode).value, true));
							});
							finishRenderMath();
							return;
						}

						if (plugin.settings.callout && item.node?.type === "callout") {
							renderInSuggestionTitleEl(el, async (titleEl) => {
								await MarkdownRenderer.render(
									app,
									extractCalloutTitle(item.content.slice(item.node.position.start.offset, item.node.position.end.offset)),
									titleEl,
									item.file.path,
									plugin
								);
							});
							return;
						}
					}
				}
			}
		}));
	}
}

export class KeyupHandlingHoverParent extends Component implements HoverParent {
	#hoverPopover: HoverPopover | null;

	constructor(private plugin: MyPlugin, private suggest: BuiltInAutocompletion) {
		super();
		this.#hoverPopover = null;
	}

	onunload() {
		super.onunload();
		this.hideChild();
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

	hideChild() {
		/// @ts-ignore
		this.#hoverPopover?.hide();
	}
}


function extractCalloutTitle(text: string) {
	const lineBreak = text.indexOf('\n');
	return lineBreak === -1 ? text : text.slice(0, lineBreak + 1);
}

function renderInSuggestionTitleEl(el: HTMLElement, cb: (suggestionTitleEl: HTMLElement) => void) {
	const suggestionTitleEl = el.querySelector<HTMLElement>('.suggestion-title');
	if (suggestionTitleEl) {
		suggestionTitleEl.replaceChildren();
		cb(suggestionTitleEl)
	};
}