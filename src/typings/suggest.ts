import { EditorSuggest, Loc, PopoverSuggest, SearchMatches, SuggestModal, TFile } from "obsidian";
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
