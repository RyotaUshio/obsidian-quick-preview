import { Suggester } from "main";

export interface Suggestions<T> {
    chooser: Suggester<T>;
    selectedItem: number;
    values: T[];
    containerEl: HTMLElement;
    moveUp(event: KeyboardEvent): void;
    moveDown(event: KeyboardEvent): void;
    setSelectedItem(index: number, event: KeyboardEvent | null): void;
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
        hide(): void;
    }
}