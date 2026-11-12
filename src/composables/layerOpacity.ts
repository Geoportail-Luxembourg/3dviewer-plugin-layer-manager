import {
  CesiumTilesetLayer,
  OpenStreetMapLayer,
  RasterLayer,
} from '@vcmap/core';
import type { Layer } from '@vcmap/core';
import {
  CustomShader,
  CustomShaderMode,
  CustomShaderTranslucencyMode,
  UniformType,
} from '@vcmap-cesium/engine';

export type OpacityLayer = Layer & { opacity: number };
export type ShaderOpacityLayer = CesiumTilesetLayer;

const opacityShaderTag = Symbol.for('lux3dviewer.layerOpacityShader');
const previousOpacity = new Map<string, number>();
const shaderOpacity = new WeakMap<ShaderOpacityLayer, number>();
const opacityShaders = new WeakMap<ShaderOpacityLayer, CustomShader>();

function createOpacityShader(opacity: number): CustomShader {
  const shader = new CustomShader({
    mode: CustomShaderMode.MODIFY_MATERIAL,
    translucencyMode: CustomShaderTranslucencyMode.TRANSLUCENT,
    uniforms: {
      uOpacity: {
        type: UniformType.FLOAT,
        value: opacity,
      },
    },
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        material.alpha *= uOpacity;
      }
    `,
  });
  (shader as unknown as Record<symbol, boolean>)[opacityShaderTag] = true;
  return shader;
}

function isOpacityShader(shader: CustomShader): boolean {
  return (
    (shader as unknown as Record<symbol, boolean>)[opacityShaderTag] ?? false
  );
}

function shaderOpacityFor(layer: ShaderOpacityLayer): CustomShader | undefined {
  const shader = opacityShaders.get(layer);
  return shader && layer.customShader === shader ? shader : undefined;
}

export function isOpacityLayer(
  layer: Layer | undefined,
): layer is OpacityLayer {
  return layer instanceof RasterLayer || layer instanceof OpenStreetMapLayer;
}

export function isShaderOpacityLayer(
  layer: Layer | undefined,
): layer is ShaderOpacityLayer {
  return layer instanceof CesiumTilesetLayer;
}

export function hasExternalCustomShader(layer: ShaderOpacityLayer): boolean {
  return Boolean(layer.customShader && !isOpacityShader(layer.customShader));
}

export function getShaderOpacity(layer: ShaderOpacityLayer): number {
  return shaderOpacity.get(layer) ?? 1;
}

export function setShaderOpacity(
  layer: ShaderOpacityLayer,
  value: number,
): void {
  const opacity = Math.max(0, Math.min(1, value));
  shaderOpacity.set(layer, opacity);

  if (opacity === 1) {
    const existing = shaderOpacityFor(layer);
    if (existing) {
      layer.customShader = undefined;
    }
    return;
  }

  if (hasExternalCustomShader(layer)) {
    return;
  }

  let shader = opacityShaders.get(layer);
  if (!shader) {
    shader = createOpacityShader(opacity);
    opacityShaders.set(layer, shader);
  } else {
    shader.setUniform('uOpacity', opacity);
  }

  layer.customShader = shader;
}

export function toggleLayerOpacity(layer: OpacityLayer): void {
  if (layer.opacity > 0) {
    previousOpacity.set(layer.name, layer.opacity);
    layer.opacity = 0;
  } else {
    layer.opacity = previousOpacity.get(layer.name) ?? 1;
    previousOpacity.delete(layer.name);
  }
}

export function setLayerOpacity(layer: OpacityLayer, value: number): void {
  const opacity = Math.min(1, Math.max(0, value));
  layer.opacity = opacity;

  if (opacity > 0) {
    previousOpacity.delete(layer.name);
  }
}

export function toggleShaderOpacity(layer: ShaderOpacityLayer): void {
  const opacity = getShaderOpacity(layer);
  if (opacity > 0) {
    previousOpacity.set(layer.name, opacity);
    setShaderOpacity(layer, 0);
    return;
  }

  setShaderOpacity(layer, previousOpacity.get(layer.name) ?? 1);
  previousOpacity.delete(layer.name);
}
