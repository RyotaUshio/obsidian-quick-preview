import { Modifier, Platform } from "obsidian";
import { Suggestions } from "typings/obsidian";


export function getModifierNameInPlatform(mod: Modifier): string {
    if (mod == "Mod") {
        return Platform.isMacOS || Platform.isIosApp ? "command" : "Ctrl";
    }
    if (mod == "Shift") {
        return Platform.isMacOS || Platform.isIosApp ? "shift" : "Shift";
    }
    if (mod == "Alt") {
        return Platform.isMacOS || Platform.isIosApp ? "option" : "Alt";
    }
    if (mod == "Meta") {
        return Platform.isMacOS || Platform.isIosApp ? "command" : Platform.isWin ? "Win" : "Meta";
    }
    return "ctrl";
}

export function getSelectedItem<T>(suggestions: Suggestions<T>): T | undefined {
    return suggestions.values[suggestions.selectedItem];
}
