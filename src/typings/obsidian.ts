import { UserEvent } from "obsidian";
import { Suggester } from "./suggest";

export interface Suggestions<T> {
    chooser: Suggester<T>;
    selectedItem: number;
    values: T[];
    containerEl: HTMLElement;
    moveUp(event: KeyboardEvent): void;
    moveDown(event: KeyboardEvent): void;
    setSelectedItem(index: number, event: UserEvent | null): void;
}

declare module "obsidian" {
    interface App {
        plugins: {
            enabledPlugins: Set<string>;
            enablePlugin(id: string): Promise<void>;
            disablePlugin(id: string): Promise<void>;
            getPlugin(id: string): Plugin;
        }
        internalPlugins: {
            getPluginById(id: string): Plugin & { instance: any };
        }
        commands: {
            executeCommandById(id: string): boolean;
        }
    }

    interface Workspace {
        editorSuggest: {
            suggests: EditorSuggest<any>[];
            currentSuggest: EditorSuggest<any> | null;
            close(): void;
            addSuggest(suggest: EditorSuggest<any>): void;
            removeSuggest(suggest: EditorSuggest<any>): void;
            reposition(): void;
        }
    }

    interface PopoverSuggest<T> {
        suggestions: Suggestions<T>;
        suggestEl: HTMLElement;
        isOpen: boolean;
    }

    interface SuggestModal<T> {
        chooser: Suggestions<T>;
        isOpen: boolean;
    }

    interface HoverPopover {
        parent: HoverParent;
        targetEl: HTMLElement | null;
        shownPos: { x: number, y: number } | null;
        hide(): void;
        position(pos: { x: number, y: number } | null): void;
    }
}