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

    interface Component {
        _loaded: boolean;
    }

    interface EditorSuggest<T> {
        scope: Scope;
        suggestions: {
            chooser: EditorSuggest<T>;
            selectedItem: number;
            values: T[];
            containerEl: HTMLElement;
            moveUp(event: KeyboardEvent): void;
            moveDown(event: KeyboardEvent): void;
            setSelectedItem(index: number, event: KeyboardEvent | null): void;
        };
        suggestEl: HTMLElement;
        isOpen: boolean;
    }

    interface HoverPopover {
        hide(): void;
    }
}