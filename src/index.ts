export { type SuggestItem, type FileInfo, type HeadingInfo, type BlockInfo } from 'typings/suggest';

import EnhancedLinkSuggestionsPlugin from "main";
import { App, Component, PopoverSuggest, SuggestModal } from "obsidian";
import { SuggestItem } from 'typings/suggest';

/**
 * Check if the Enhanced Link Suggestions plugin is enabled. Even if it returns true, it doesn't mean 
 * the plugin has already been loaded at the moment.
 */
export function isPluginEnabled(app: App): boolean {
    return app.plugins.enabledPlugins.has("enhanced-link-suggestions");
}

/**
 * Register a suggester class (`PopoverSuggest` (e.g. `EditorSuggest` & `AbstractInputSuggest`) or `SuggestModal`) to be patched by Enhanced Link Suggestions
 * so that it can be used with the Quick Preview feature.
 * 
 * @param app 
 * @param component A component that manages the lifecycle of the suggester's quick preview feature. Typically this is your plugin instance. Unload this component to disable the quick preview feature for the suggester.
 * @param suggestClass A suggester class to be patched. `PopoverSuggest` (e.g. `EditorSuggest` & `AbstractInputSuggest`) or `SuggestModal` are supported.
 * @param itemNormalizer A function that converts an item of the suggester to a `SuggestItem` object.
 */
export function registerQuickPreview<T>(app: App, component: Component, suggestClass: new (...args: any[]) => PopoverSuggest<T> | SuggestModal<T>, itemNormalizer: (item: T) => SuggestItem): void {
    app.workspace.onLayoutReady(() => {
        const plugin = app.plugins.getPlugin("enhanced-link-suggestions") as EnhancedLinkSuggestionsPlugin | undefined;
        if (!plugin) throw Error("Enhanced Link Suggestions API: Enhanced Link Suggestions is not enabled.");
        const uninstaller = plugin.patch(suggestClass, itemNormalizer);
        component.register(uninstaller);
    })
}
