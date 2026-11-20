# @geoportallux/lux-3dviewer-plugin-layer-manager

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

Layer manager plugin for VC Map. Provides a compact layer list to order and remove layers,
change opacity, and open layer metadata.

## Features

- **Layer ordering**: drag and drop layers to change their position.
- **Removing layers**: remove a layer directly from the list.
- **Opacity changes**: adjust a layer's opacity or hide it completely.
- **Link to metadata**: open the layer's metadata page from the list.

## Development

```shell
npm start
```

## Deploy plugin within map-ui

Add the plugin dependency to `plugins/package.json`:

```json
"dependencies": {
  "@geoportallux/lux-3dviewer-plugin-layer-manager": "..."
}
```

Add the plugin to the map-ui module configuration:

```json
{
  "name": "@geoportallux/lux-3dviewer-plugin-layer-manager",
  "entry": "plugins/@geoportallux/lux-3dviewer-plugin-layer-manager/index.js"
}
```

## Build the npm package

```shell
npm version 1.0.0 --no-git-tag-version
git add .
git commit -m "1.0.0"
git tag v1.0.0
git push origin main v1.0.0
```
