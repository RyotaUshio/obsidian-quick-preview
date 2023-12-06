import { Scope } from "obsidian";

declare module "obsidian" {
    interface App {
        plugins: {
            enabledPlugins: Set<string>;
            enablePlugin(id: string): Promise<void>;
            disablePlugin(id: string): Promise<void>;
        }
        internalPlugins: {
            getPluginById(id: string): Plugin & { instance: any };
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