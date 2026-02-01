# InjectGPT

![How to use](lol.mp4)

This extension injects a custom system, developer and the model you want into ChatGPT. Once set it always use that. For exmaple you can write a new system prompt and ChatGPT will always use that for your conversations.


The extension intercepts all `/conversation` requests at the network level, replacing the model, system prompt, and developer prompt values with your current settings before they reach OpenAI's servers.

## features

- **model selection** - switch between gpt-5-2, gpt-5-2-thinking, and other models
- **custom system prompt** - define how the AI behaves
- **custom developer prompt** - add additional instructions after user messages
- **settings persistence** - your preferences are saved in localStorage

## installation

1. clone or download this repo
2. go to `chrome://extensions`
3. enable "Developer mode"
4. click "Load unpacked"
5. select the extension folder

## usage

1. go to `https://chatgpt.com` (or any translate page)
2. Press InjectGPT Settings
3. change model and prompts
4. start chatting

## files

- `manifest.json` - extension config
- `content.js` - UI injection and settings management
- `injector.js` - network-level request interception
- `styles.css` - dark theme styling

## note

For Educational Purposes only.
