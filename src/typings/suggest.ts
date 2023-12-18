import { EditorSuggest, HeadingCache, Loc, PopoverSuggest, Pos, SearchMatches, SuggestModal, TFile } from "obsidian";
import { PopoverManager } from "popoverManager";

export type BuiltInSuggestItem = FileLinkSuggestItem | AliasLinkSuggestItem | LinkTextSuggestItem | HeadingLinkSuggestItem | BlockLinkSuggestItem;
export type BuiltInSuggest = EditorSuggest<BuiltInSuggestItem> & { manager: PopoverManager<BuiltInSuggestItem> };
export type Suggester<T> = PopoverSuggest<T> | SuggestModal<T>;
export type PatchedSuggester<T> = Suggester<T> & { popoverManager: PopoverManager<T> };

export interface PreviewInfo {
    linktext: string;
    sourcePath: string;
    line?: number;
}

export interface QuickSwitcherItem {
    type: "file";
    file: TFile;
    match: any;
    downranked?: boolean;
}

export interface QuickSwitcherPlusItem {
    file: TFile;
    type: string;
    item: any;
}

export interface QuickSwitcherPlusHeadingItem extends QuickSwitcherPlusItem {
    type: "headingsList";
    item: HeadingCache;
}

export interface QuickSwitcherPlusSymbolItem extends QuickSwitcherPlusItem {
    type: "symbolList";
    item: {
        type: "symbolInfo";
        symbol: {
            position: Pos;
        }
    }
}

export interface QuickSwitcherPlusBookmarkItem extends QuickSwitcherPlusItem {
    type: "bookmark";
    item: {
        type: string;
    }
}

export interface QuickSwitcherPlusFileBookmarkItem extends QuickSwitcherPlusBookmarkItem {
    item: {
        type: "file",
        path: string;
        subpath?: string;
    }
}

export interface LinkSuggestItem {
    matches: SearchMatches | null;
    file?: TFile;
    path: string;
    score: number;
    subpath?: string;
}

export interface FileLinkSuggestItem extends LinkSuggestItem {
    type: "file";
    file: TFile;
}

export interface AliasLinkSuggestItem extends LinkSuggestItem {
    type: "alias";
    file: TFile;
}

/** Link to a file that has not been created yet */
export interface LinkTextSuggestItem extends LinkSuggestItem {
    type: "linktext";
    file: undefined;
}

export interface HeadingLinkSuggestItem extends LinkSuggestItem {
    type: "heading";
    file: TFile;
    heading: string;
    level: number;
}

interface BlockLinkSuggestItem extends LinkSuggestItem {
    type: "block";
    file: TFile;
    node: Node;
}

interface Node {
    position: {
        start: Loc;
        end: Loc;
        indent: number[];
    }
}
