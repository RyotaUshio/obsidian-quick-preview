import MyPlugin, { BuiltInAutocompletion } from "main";
import { Component, HoverParent, HoverPopover } from "obsidian";

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
