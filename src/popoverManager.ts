import { Component, Keymap, KeymapEventHandler, PopoverSuggest, UserEvent } from "obsidian";

import QuickPreviewPlugin from "main";
import { QuickPreviewHoverParent } from "hoverParent";
import { getSelectedItem } from "utils";
import { Suggestions } from "typings/obsidian";
import { PatchedSuggester, PreviewInfo } from "typings/suggest";


export class PopoverManager<T> extends Component {
    suggestions: Suggestions<T>;
    currentHoverParent: QuickPreviewHoverParent<T> | null = null;
    currentOpenHoverParent: QuickPreviewHoverParent<T> | null = null;
    lastEvent: MouseEvent | PointerEvent | null = null;
    handlers: KeymapEventHandler[] = [];
    popoverHeight: number | null = null;
    popoverWidth: number | null = null;

    constructor(private plugin: QuickPreviewPlugin, public suggest: PatchedSuggester<T>, private itemNormalizer: (item: T) => PreviewInfo | null) {
        super();

        if (suggest instanceof PopoverSuggest) this.suggestions = suggest.suggestions;
        else this.suggestions = suggest.chooser;
    }

    onload() {
        this.registerDomEvent(window, 'keydown', (event) => {
            if (this.suggest.isOpen && Keymap.isModifier(event, this.plugin.settings.modifier)) {
                if (this.currentOpenHoverParent) this.hide();
                else {
                    const item = getSelectedItem(this.suggestions);
                    if (item) this.spawnPreview(item);    
                }
            }
        });
        this.registerDomEvent(window, 'keyup', (event: KeyboardEvent) => {
            if (event.key === this.plugin.settings.modifier) this.hide();
        });
        // This is a workaround for the problem that the keyup event is not fired when command key is released on macOS.
        // cf.) https://blog.bitsrc.io/keyup-event-and-cmd-problem-88f4038c5ed2
        this.registerDomEvent(window, 'mousemove', (event: MouseEvent) => {
            if (!Keymap.isModifier(event, this.plugin.settings.modifier)) this.hide();
        });

        this.handlers.push(
            this.suggest.scope.register([this.plugin.settings.modifier], 'ArrowUp', (event) => {
                this.suggestions.moveUp(event);
                return false;
            }),
            this.suggest.scope.register([this.plugin.settings.modifier], 'ArrowDown', (event) => {
                this.suggestions.moveDown(event);
                return false;
            })
        );
    }

    onunload() {
        this.handlers.forEach((handler) => {
            this.suggest.scope.unregister(handler);
        });
        this.handlers.length = 0;

        this.currentHoverParent?.hide();
        this.currentHoverParent = null;
        this.currentOpenHoverParent?.hide();
        this.currentOpenHoverParent = null;
        this.lastEvent = null;
    }

    hide(lazy = false) {
        if (!lazy) this.currentHoverParent?.hide();
        this.currentHoverParent = null;
    }

    spawnPreview(item: T, lazyHide = false, event: UserEvent | null = null) {
        this.hide(lazyHide);

        if (event instanceof MouseEvent || event instanceof PointerEvent) this.lastEvent = event;

        this.currentHoverParent = new QuickPreviewHoverParent(this.suggest);

        const info = this.itemNormalizer(item);
        if (info) this.plugin.onLinkHover(this.currentHoverParent, null, info.linktext, info.sourcePath, { scroll: info.line });
    }

    getShownPos(): { x: number, y: number } {
        if (this.plugin.settings.stickToMouse && this.lastEvent) return { x: this.lastEvent.clientX, y: this.lastEvent.clientY };

        const position = this.plugin.settings.position;

        if (position === 'Auto') {
            return this.getShownPosAuto();
        } else if (position === 'Custom') {
            return { x: this.plugin.settings.customPositionX, y: this.plugin.settings.customPositionY };
        }
        return this.getShownPosCorner(position);
    }

    getShownPosCorner(position: 'Top left' | 'Top right' | 'Bottom left' | 'Bottom right') {
        if (position === 'Top left') {
            return { x: 0, y: 0 };
        } else if (position === 'Top right') {
            return { x: window.innerWidth, y: 0 };
        } else if (position === 'Bottom left') {
            return { x: 0, y: window.innerHeight };
        }
        return { x: window.innerWidth, y: window.innerHeight };
    }

    getShownPosAuto(): { x: number, y: number } {
        const el = this.suggestions.containerEl;
        const { top, bottom, left, right, width, height } = el.getBoundingClientRect();

        const popover = this.currentHoverParent?.hoverPopover;
        this.popoverWidth = popover?.hoverEl.offsetWidth ?? this.popoverWidth ?? null;
        this.popoverHeight = popover?.hoverEl.offsetHeight ?? this.popoverHeight ?? null;

        if (this.popoverWidth && this.popoverHeight) {
            // show the popover next to the suggestion box if possible
            let offsetX = width * 0.1;
            let offsetY = height * 0.1;
            if (right - offsetX + this.popoverWidth < window.innerWidth) return { x: right - offsetX, y: top + offsetY };
            offsetX = width * 0.03;
            offsetY = height * 0.05;
            if (left > this.popoverWidth + offsetX) return { x: left - this.popoverWidth - offsetX, y: top + offsetY };
        }

        // if the popover size is not available, show it on the opposite side of the suggestion box
        const x = (left + right) * 0.5;
        const y = (top + bottom) * 0.5;

        if (x >= window.innerWidth * 0.6) { // not a typo. suggestion text tends to be on the left side. avoid covering it
            if (y >= window.innerHeight * 0.5) return this.getShownPosCorner('Top left');
            return this.getShownPosCorner('Bottom left');
        }
        if (y >= window.innerHeight * 0.5) return this.getShownPosCorner('Top right');
        return this.getShownPosCorner('Bottom right');
    }
}
