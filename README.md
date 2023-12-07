# Obsidian Enhanced Link Suggestions

This is an [Obsidian.md](https://obsidian.md) plugin that enhances the built-in link suggestion by adding the following functionalities:

1. Hold down `Alt`/`Option` (by default) to quickly preview the link target without clicking
2. Render markdown in block link suggestions (i.e. `[[note title^` or `[[^`)

> [!note]
> - The first feature requires the [Page Preview](https://help.obsidian.md/Plugins/Page+preview) core plugin enabled.
> - You can adjust the font size for quick preview via [Style Settings](https://github.com/mgmeyers/obsidian-style-settings).
> - _(New in 0.3.0)_ Quick preview is now available for [Quick Switcher](https://help.obsidian.md/Plugins/Quick+switcher) as well!
> - _(New in 0.3.0)_ **Other plugins also can utilize the quick preview feature via the API**. See [below](#using-the-api) for more details.

## Installation

Since this plugin is still in beta, it's not on the community plugin browser yet.

But you can install the latest beta release using [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1.  Install BRAT and enable it.
2.  Go to `Options`. In the `Beta Plugin List` section, click on the `Add Beta plugin` button.
3.  Copy and paste `RyotaUshio/obsidian-enhanced-link-suggestions` in the pop-up prompt and click on **Add Plugin**.
4.  _(Optional but highly recommended)_ Turn on `Auto-update plugins at startup` at the top of the page.
5.  Go to `Community plugins > Installed plugins`. You will find “Enhanced Link Suggestions” in the list. Click on the toggle button to enable it.

## Using the API

This plugin provides an API to allow other plugins to utilize the quick preview feature.

### Installation

```
npm install -D obsidian-enhanced-link-suggestions
```

### Usage

```ts
import { Plugin } from "obsidian";
import { registerQuickPreview } from "obsidian-enhanced-link-suggestions";

export default MyPlugin extends Plugin {
    onload() {
        registerQuickPreview(this.app, this, MyCustomEditorSuggest, (item) => {
            return { type: "file", file: item.file }
        });
        // or
        registerQuickPreview(this.app, this, MyCustomSuggestModal, (item) => {
            return { type: "file", file: item.file }
        });
    }
}

```

## Support development

If you find my plugins useful, please support my work by buying me a coffee!

<a href="https://www.buymeacoffee.com/ryotaushio" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
