import { Modifier, Platform } from "obsidian";
import { Suggestions } from "typings/obsidian";


export function getModifierNameInPlatform(mod: Modifier): string {
    if (mod === "Mod") {
        return Platform.isMacOS || Platform.isIosApp ? "Command" : "Ctrl";
    }
    if (mod === "Shift") {
        return "Shift";
    }
    if (mod === "Alt") {
        return Platform.isMacOS || Platform.isIosApp ? "Option" : "Alt";
    }
    if (mod === "Meta") {
        return Platform.isMacOS || Platform.isIosApp ? "Command" : Platform.isWin ? "Win" : "Meta";
    }
    return "Ctrl";
}

export function getSelectedItem<T>(suggestions: Suggestions<T>): T | undefined {
    return suggestions.values[suggestions.selectedItem];
}
