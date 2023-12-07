import { Component, Keymap, KeymapEventHandler, PopoverSuggest, SuggestModal, stripHeadingForLink } from "obsidian";

import EnhancedLinkSuggestionsPlugin, { PatchedSuggester, SuggestItem } from "main";
import { QuickPreviewHoverParent } from "hoverParent";
import { getSelectedItem } from "utils";
import { Suggestions } from "typings/obsidian";


export class PopoverManager<T> extends Component {
    currentHoverParent: QuickPreviewHoverParent<T> | null = null;
    currentOpenHoverParent: QuickPreviewHoverParent<T> | null = null;
    handlers: KeymapEventHandler[] = [];
    suggestions: Suggestions<T>;
    itemNormalizer: (item: T) => SuggestItem;

    constructor(private plugin: EnhancedLinkSuggestionsPlugin, private suggest: PatchedSuggester<T>, itemNormalizer?: (item: T) => SuggestItem) {
        super();

        if (suggest instanceof PopoverSuggest) this.suggestions = suggest.suggestions;
        else if (suggest instanceof SuggestModal) this.suggestions = suggest.chooser;

        if (!this.suggestions) throw new Error("No suggestions provided nor can be inferred.");

        this.itemNormalizer = itemNormalizer ?? ((item: T) => item as unknown as SuggestItem);
    }

    onload() {
        this.registerDomEvent(window, 'keydown', (event) => {
            if (this.suggest.isOpen && Keymap.isModifier(event, this.plugin.settings.modifierToPreview)) {
                const item = getSelectedItem(this.suggestions);
                this.spawnPreview(this.itemNormalizer(item));
            }
        });
        this.registerDomEvent(window, 'keyup', (event: KeyboardEvent) => {
            if (event.key === this.plugin.settings.modifierToPreview) this.hide();
        });

        this.handlers.push(
            this.suggest.scope.register([this.plugin.settings.modifierToPreview], 'ArrowUp', (event) => {
                this.suggestions.moveUp(event);
                return false;
            }),
            this.suggest.scope.register([this.plugin.settings.modifierToPreview], 'ArrowDown', (event) => {
                this.suggestions.moveDown(event);
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

    spawnPreview(item: SuggestItem, lazyHide: boolean = false) {
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