import { Loc, SearchMatches, TFile } from "obsidian";

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

export interface HeadingLinkInfo extends LinkInfo {
    type: "heading";
    heading: string;
    level: number;
    subpath: string;
}

interface BlockLinkInfo extends LinkInfo {
    type: "block";
    idMatch: SearchMatches | null;
    subpath: string;
    node: Node; // CalloutNode | MathNode;
    display: string;
    content: string;
}

interface Node {
    type: 'code' | 'blockquote' | 'heading' | 'paragraph' | 'callout' | 'math' | 'listItem' | 'footnoteDefinition' | 'element' | 'table' | 'comment';
    children: Node[];
    position: {
        start: Loc;
        end: Loc;
        indent: number[];
    }
}

interface CalloutNode extends Node {
    type: "callout",
    callout: {
        data: string;
        type: string;
        fold: string;
    },
    children: [CalloutTitleNode, CalloutContentNode]
}

interface CalloutTitleNode extends Node {}

interface CalloutContentNode extends Node {}

interface CalloutLinkInfo extends BlockLinkInfo {
    node: CalloutNode;
}


interface MathNode extends Node {
    type: "math";
    value: string;
}

interface MathLinkInfo extends BlockLinkInfo {
    node: MathNode;
}