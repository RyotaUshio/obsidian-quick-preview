import { EditorSuggest, Plugin, SearchMatches, TFile, renderMath } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from './settings';
import { around } from 'monkey-around';





interface LinkInfo {
	file: TFile;
	matches: SearchMatches | null;
	path: string;
	score: number;
	subpath?: string;
};

interface FileLinkInfo extends LinkInfo {
	type: "file";
}

interface HeadingLinkInfo extends LinkInfo {
	type: "heading";
	heading: string;
	level: number;
	subpath: string;
}

interface BlockLinkInfo extends LinkInfo {
	type: "block";
	idMatch: SearchMatches | null;
	subpath: string;
	node?: any;
	display: string;
	content: string;
}

type Item = FileLinkInfo | HeadingLinkInfo | BlockLinkInfo;
type BuiltInAutocompletion = EditorSuggest<Item>;

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	prototype: BuiltInAutocompletion | null = null;

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
		const prototype = this.app.workspace.editorSuggest.suggests[0].constructor.prototype as BuiltInAutocompletion;
		const plugin = this;

		const uninstaller = around(prototype, {
			renderSuggestion(old) {
				return function (item: Item, el: HTMLElement) {
					if (item.type === "block") {
						if (plugin.settings.math && item.node?.type === "math") {
							el.appendChild(renderMath(item.node.value, true))
							return;
						}
					}
					old.call(this, item, el);
				}
			}
		});
		this.register(uninstaller);
	}
}
