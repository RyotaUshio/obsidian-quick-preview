import { Modifier, Platform } from "obsidian";


export function extractFirstNLines(text: string, n: number) {
	const lines = text.split('\n');
	return lines.slice(0, n).join('\n');
}

export function render(el: HTMLElement, cb: (containerEl: HTMLElement) => void) {
	const titleEl = el.querySelector<HTMLElement>('.suggestion-title');
	if (titleEl) {
		const containerEl = createDiv({cls: ['markdown-rendered']});
		titleEl.replaceChildren(containerEl);
		cb(containerEl);
	};
}

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
