# Obsidian Quick Preview

This [Obsidian.md](https://obsidian.md) plugin adds a ***quick preview*** functionality to
- [Link suggestions](https://help.obsidian.md/Linking+notes+and+files/Internal+links),
- [Quick switcher](https://help.obsidian.md/Plugins/Quick+switcher),
- and even [Quick switcher++](https://github.com/darlal/obsidian-switcher-plus).

Hold down `Alt`/`Option` (by default) to quickly preview a suggestion before actually selecting it.

### Link suggestions ([file](https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link%20to%20a%20file)/[heading](https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link%20to%20a%20heading%20in%20a%20note)/[block](https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link%20to%20a%20block%20in%20a%20note))

![Screen Recording 2023-12-13 at 18 27 42](https://github.com/RyotaUshio/obsidian-quick-preview/assets/72342591/3dec5c7d-e74e-4f8d-a0f3-43e424dbbee9)

### Quick switcher / Quick switcher++

![Screen Recording 2023-12-13 at 18 24 34](https://github.com/RyotaUshio/obsidian-quick-preview/assets/72342591/4eaae76b-b0fa-425f-a3ff-857b70e9a02a)

> [!tip]
> - You can adjust the font size for quick preview via [Style Settings](https://github.com/mgmeyers/obsidian-style-settings).
> - **Other plugins also can utilize the quick preview feature via the API**. See [below](#using-the-api) for more details.

## Installation

You can find this plugin in the community plugin browser within Obsidian.

You can also install the latest beta release using [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1. Install the latest version of BRAT and enable it.
2. Open the following URL in browser: `obsidian://brat?plugin=RyotaUshio/obsidian-quick-preview`.
3. Click the "Add Plugin" button.
4. _(Optional but highly recommended)_ In the BRAT settings, turn on `Auto-update plugins at startup` at the top of the page.

## Reporting problems

If you find a problem about this plugin, please report it by filing an issue from [here](https://github.com/RyotaUshio/obsidian-quick-preview/issues).

It'd be helpful if you could attatch the following information:

- Result of the "Show debug info" command
- Screenshot of the plugin settings

## Using the API

This plugin provides an API to allow other plugins to add the quick preview functionality to their custom suggesters. Supported suggester types are:

- [`SuggestModal`](https://docs.obsidian.md/Reference/TypeScript+API/SuggestModal)
- [`PopoverSuggest`](https://docs.obsidian.md/Reference/TypeScript+API/PopoverSuggest), including:
  - [`EditorSuggest`](https://docs.obsidian.md/Reference/TypeScript+API/EditorSuggest)
  - [`AbstractInputSuggest`](https://docs.obsidian.md/Reference/TypeScript+API/AbstractInputSuggest)

### Installation

```
npm install -D obsidian-quick-preview
```

### Usage examples

```ts
import { Plugin, EditorSuggest, SuggestModal, TFile, SectionCache } from "obsidian";
import { registerQuickPreview } from "obsidian-quick-preview";

class MyCustomEditorSuggest extends EditorSuggest<{ file: TFile }> { ... }

class MyCustomSuggestModal extends SuggestModal<{ path: string, cache: SectionCache }> { ... }

export default MyPlugin extends Plugin {
    excludedFiles: string[];

    onload() {
        registerQuickPreview(this.app, this, MyCustomEditorSuggest, (item) => {
            // - `linktext` can be any string representing a proper internal link,
            //   e.g. "note", "note.md", "folder/note", "folder/note.md", "note#heading", "note#^block-id" etc
            // - `sourcePath` is used to resolve relative links. In many cases, you can just pass an empty string.
            return { linktext: item.file.path, sourcePath: "" };
        });
        // or
        registerQuickPreview(this.app, this, MyCustomSuggestModal, (item) => {
            if (this.excludedFiles.contains(item.path)) {
                // Return `null` when you don't want to show a quick preview for the item.
                return null;
            }
            // Add a `line` parameter to focus on a specific line.
            return { linktext: item.path, sourcePath: "", line: item.cache.position.start.line };
        });
    }
}

```

## Support development

If you find my plugins useful, please support my work by buying me a coffee!

<a href="https://www.buymeacoffee.com/ryotaushio" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
