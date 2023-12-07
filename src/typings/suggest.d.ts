import { EditorSuggest, Loc, PopoverSuggest, SearchMatches, SuggestModal, TFile } from "obsidian";
import { PopoverManager } from "popoverManager";


export type SuggestItem = FileInfo | HeadingInfo | BlockInfo;
export type BuiltInSuggestItem = FileLinkInfo | AliasLinkInfo | HeadingLinkInfo | BlockLinkInfo;
export type BuiltInSuggest = EditorSuggest<BuiltInSuggestItem> & { manager: PopoverManager<BuiltInSuggestItem> };
export type Suggester<T> = PopoverSuggest<T> | SuggestModal<T>;
export type PatchedSuggester<T> = Suggester<T> & { manager: PopoverManager<T> };

export interface FileInfo {
    type: "file";
    file: TFile;
}

export interface HeadingInfo {
    type: "heading";
    file: TFile;
    heading: string;
}

export interface BlockInfo {
    type: "block";
    file: TFile;
    line: number;
}

export interface QuickSwitcherItem extends FileInfo {
    match: any;
    downranked?: boolean;
}

export interface LinkInfo {
    file: TFile;
    matches: SearchMatches | null;
    path: string;
    score: number;
    subpath?: string;
}

export interface FileLinkInfo extends LinkInfo {
    type: "file";
}

export interface AliasLinkInfo extends LinkInfo {
    type: "alias";
}

export interface HeadingLinkInfo extends LinkInfo {
    type: "heading";
    heading: string;
    level: number;
}

interface BlockLinkInfo extends LinkInfo {
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
