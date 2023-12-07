import { Component, Keymap, KeymapEventHandler, stripHeadingForLink } from "obsidian";

import EnhancedLinkSuggestionsPlugin, { BuiltInSuggest, Item } from "main";
import { QuickPreviewHoverParent } from "hoverParent";
import { getSelectedItem } from "utils";


export class PopoverManager extends Component {
    currentHoverParent: QuickPreviewHoverParent | null = null;
    currentOpenHoverParent: QuickPreviewHoverParent | null = null;
    handlers: KeymapEventHandler[] = [];

    constructor(private plugin: EnhancedLinkSuggestionsPlugin, private suggest: BuiltInSuggest) {
        super();
    }

    onload() {
        this.registerDomEvent(window, 'keydown', (event) => {
            if (this.suggest.isOpen && Keymap.isModifier(event, this.plugin.settings.modifierToPreview)) {
                const item = getSelectedItem(this.suggest);
                this.spawnPreview(item);
            }
        });
        this.registerDomEvent(window, 'keyup', (event: KeyboardEvent) => {
            if (event.key === this.plugin.settings.modifierToPreview) this.hide();
        });

        this.handlers.push(
            this.suggest.scope.register([this.plugin.settings.modifierToPreview], 'ArrowUp', (event) => {
                this.suggest.suggestions.moveUp(event);
                return false;
            }),
            this.suggest.scope.register([this.plugin.settings.modifierToPreview], 'ArrowDown', (event) => {
                this.suggest.suggestions.moveDown(event);
                return false;
            })
        );
    }

    onunload() {
        this.handlers.forEach((handler) => this.suggest.scope.unregister(handler));
    }

    hide(lazy: boolean = false) {
        if (!lazy) this.currentHoverParent?.hide();
        this.currentHoverParent = null;
    }

    spawnPreview(item: Item, lazyHide: boolean = false) {
        this.hide(lazyHide);

        this.currentHoverParent = new QuickPreviewHoverParent(this.suggest);
        if (item.type === 'file') {
            this.plugin.onLinkHover(this.currentHoverParent, null, item.file.path, "");
        } else if (item.type === 'heading') {
            this.plugin.onLinkHover(this.currentHoverParent, null, item.file.path + '#' + stripHeadingForLink(item.heading), "");
        } else if (item.type === 'block') {
            this.plugin.onLinkHover(this.currentHoverParent, null, item.file.path, "", { scroll: item.node.position.start.line });
        }
    };
}