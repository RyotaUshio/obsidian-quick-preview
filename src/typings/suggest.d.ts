import { Scope } from "obsidian";

declare module "obsidian" {
    interface App {
        plugins: {
            enabledPlugins: Set<string>;
        }
    }

    interface EditorSuggest<T> {
        scope: Scope;
        suggestions: {
            selectedItem: number;
            values: T[];
            containerEl: HTMLElement;
            moveUp(event: KeyboardEvent): void;
            moveDown(event: KeyboardEvent): void;    
        };
        suggestEl: HTMLElement;
        isOpen: boolean;
    }
}