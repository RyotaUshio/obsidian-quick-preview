import { BuiltInAutocompletion } from "main";
import { HoverParent, HoverPopover } from "obsidian";
import { PopoverManager } from "popoverManager";

export class QuickPreviewHoverParent implements HoverParent {
    #hoverPopover: HoverPopover | null = null;
    hidden: boolean;
    manager: PopoverManager;

    constructor(private suggest: BuiltInAutocompletion) {
        this.hidden = false;
        this.manager = this.suggest.manager;
    }

    hide() {
        this.hoverPopover?.hide();
        this.hidden = true;
        if (this.manager.currentOpenHoverParent === this) {
            this.manager.currentOpenHoverParent = null;
        }
    }

    get hoverPopover() {
        return this.#hoverPopover;
    }

    set hoverPopover(hoverPopover: HoverPopover | null) {
        this.#hoverPopover = hoverPopover;
        if (this.#hoverPopover) {
            this.manager.addChild(this.#hoverPopover);
            this.manager.currentOpenHoverParent?.hide();
            this.manager.currentOpenHoverParent = this;
            if (this.hidden) this.hide();
            else this.#hoverPopover.hoverEl.addClass('enhanced-link-suggestions');
        }
    }
}
