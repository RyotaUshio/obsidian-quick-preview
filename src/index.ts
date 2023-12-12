export { type PreviewInfo } from 'typings/suggest';

import QuickPreviewPlugin from "main";
import { App, Component, PopoverSuggest, SuggestModal } from "obsidian";
import { PreviewInfo } from 'typings/suggest';

/**
 * Check if the Quick Preview plugin is enabled. Even if it returns true, it doesn't mean 
 * the plugin has already been loaded at the moment.
 */
export function isPluginEnabled(app: App): boolean {
    return app.plugins.enabledPlugins.has("quick-preview");
}

/**
 * Register a suggester class (`PopoverSuggest` (e.g. `EditorSuggest` & `AbstractInputSuggest`) or `SuggestModal`) to be patched
 * so that it can be used with Quick Preview.
 * 
 * @param app 
 * @param component A component that manages the lifecycle of the suggester's quick preview feature. Typically this is your plugin instance. Unload this component to disable quick preview for the suggester.
 * @param suggestClass A suggester class to be patched. `PopoverSuggest` (e.g. `EditorSuggest` & `AbstractInputSuggest`) or `SuggestModal` are supported.
 * @param itemNormalizer A function that specifies how the preview for an suggestion item should be triggered. Return null when you don't want to show a quick preview for the item.
 */
export function registerQuickPreview<T>(app: App, component: Component, suggestClass: new (...args: any[]) => PopoverSuggest<T> | SuggestModal<T>, itemNormalizer: (item: T) => PreviewInfo | null): void {
    app.workspace.onLayoutReady(() => {
        const plugin = app.plugins.getPlugin("quick-preview") as QuickPreviewPlugin | undefined;
        if (!plugin) throw Error("Quick Preview API: Quick Preview is not enabled.");
        const uninstaller = plugin.patchSuggester(suggestClass, itemNormalizer);
        component.register(uninstaller);
    })
}
