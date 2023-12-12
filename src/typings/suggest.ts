import { EditorSuggest, Loc, PopoverSuggest, SearchMatches, SuggestModal, TFile } from "obsidian";
import { PopoverManager } from "popoverManager";

export type BuiltInSuggestItem = FileLinkSuggestItem | AliasLinkSuggestItem | HeadingLinkSuggestItem | BlockLinkSuggestItem;
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

export interface LinkSuggestItem {
    file: TFile;
    matches: SearchMatches | null;
    path: string;
    score: number;
    subpath?: string;
}

export interface FileLinkSuggestItem extends LinkSuggestItem {
    type: "file";
}

export interface AliasLinkSuggestItem extends LinkSuggestItem {
    type: "alias";
}

export interface HeadingLinkSuggestItem extends LinkSuggestItem {
    type: "heading";
    heading: string;
    level: number;
}

interface BlockLinkSuggestItem extends LinkSuggestItem {
    type: "block";
    node: Node;
}

interface Node {
    position: {
        start: Loc;
        end: Loc;
        indent: number[];
    }
}
