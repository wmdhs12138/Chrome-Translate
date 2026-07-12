# 小G翻译

Firefox-compatible Google Translate extension. Select text on a page, click the small floating `G` icon, and read the translation inline.

## Development

Requires a current Node.js runtime. Install dependencies:

```sh
npm install
```

Run a production build:

```sh
npm run build
```

The unpacked Firefox extension is written to `dist/firefox`.

Validate the Firefox extension:

```sh
npm run lint:firefox
```

Build a Firefox installable zip:

```sh
npm run package:firefox
```

The packaged artifact is written to `dist/chrome_translate-1.0.zip`.

Submit a listed AMO version:

```sh
WEB_EXT_API_KEY="..." WEB_EXT_API_SECRET="..." npm run submit:amo
```

The listed submission is reviewed by Mozilla before it becomes publicly available on AMO.
