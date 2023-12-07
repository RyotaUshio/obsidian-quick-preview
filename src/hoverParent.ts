import { BuiltInAutocompletion } from "main";
import { HoverParent, HoverPopover } from "obsidian";

export class KeyboardEventAwareHoverParent implements HoverParent {
    #hoverPopover: HoverPopover | null = null;
    hidden: boolean;

    constructor(private suggest: BuiltInAutocompletion) {
        this.hidden = false;
    }

    hide() {
        this.hoverPopover?.hide();
        this.hidden = true;
        if (this.suggest.manager.currentOpenHoverParent === this) {
            this.suggest.manager.currentOpenHoverParent = null;
        }
    }

    get hoverPopover() {
        return this.#hoverPopover;
    }

    set hoverPopover(hoverPopover: HoverPopover | null) {
        this.#hoverPopover = hoverPopover;
        if (this.#hoverPopover) {
            this.suggest.manager.addChild(this.#hoverPopover);
            this.suggest.manager.currentOpenHoverParent?.hide();
            this.suggest.manager.currentOpenHoverParent = this;
            if (this.hidden) this.hide();
            else this.#hoverPopover.hoverEl.addClass('enhanced-link-suggestions');
        }
    }
}
