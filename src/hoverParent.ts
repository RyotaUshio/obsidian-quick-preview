import { HoverParent, HoverPopover } from "obsidian";

import { PopoverManager } from "popoverManager";
import { PatchedSuggester } from "typings/suggest";


export class QuickPreviewHoverParent<T> implements HoverParent {
    #hoverPopover: HoverPopover | null = null;
    hidden: boolean;
    manager: PopoverManager<T>;

    constructor(private suggest: PatchedSuggester<T>) {
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
            if (this.hidden) {
                this.hide();
                return;
            };
            this.#hoverPopover.hoverEl.addClass('enhanced-link-suggestions');
        }
    }
}
