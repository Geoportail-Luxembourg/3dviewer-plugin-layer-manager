import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from '@vcmap-cesium/engine';
import type { VcsUiApp } from '@vcmap/ui';

const elementClassName = 'vcm-layer-split-element';
const minSplitPosition = 0.01;
const maxSplitPosition = 0.99;

function createTitleElement(): HTMLSpanElement {
  const element = document.createElement('span');
  element.className = 'vcm-layer-split-element-title';
  return element;
}

function createHandleElement(): HTMLSpanElement {
  const element = document.createElement('span');
  element.className = 'vcm-layer-split-element-handle mdi mdi-arrow-left-right';
  element.setAttribute('aria-hidden', 'true');
  return element;
}

function createElement(): HTMLElement {
  const element = document.createElement('div');
  element.className = elementClassName;
  element.style.position = 'absolute';
  element.style.top = '0px';
  element.style.height = '100%';
  element.style.zIndex = '0';
  return element;
}

class LayerSplitElement {
  private readonly _element: HTMLElement;

  private readonly _titleElement: HTMLSpanElement;

  private readonly _handleElement: HTMLSpanElement;

  private readonly _handler: ScreenSpaceEventHandler;

  private _active = false;

  private _dragging = false;

  private _removeMapListener: (() => void) | null = null;

  constructor(private readonly _app: VcsUiApp) {
    this._element = createElement();
    this._titleElement = createTitleElement();
    this._handleElement = createHandleElement();
    this._element.append(this._titleElement, this._handleElement);
    this._handler = new ScreenSpaceEventHandler(
      this._element as HTMLCanvasElement,
    );
  }

  setTitle(title: string | undefined): void {
    this._titleElement.textContent = title ?? '';
    this._titleElement.style.display = title ? '' : 'none';
  }

  activate(): void {
    if (this._active) {
      return;
    }

    this._active = true;
    this._attach();
    this._syncPosition();

    this._handler.setInputAction(() => {
      this._dragging = true;
    }, ScreenSpaceEventType.LEFT_DOWN);
    this._handler.setInputAction(() => {
      this._dragging = false;
    }, ScreenSpaceEventType.LEFT_UP);
    this._handler.setInputAction(
      this._onMouseMove.bind(this),
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    this._removeMapListener = this._app.maps.mapActivated.addEventListener(
      () => {
        this._attach();
        this._syncPosition();
      },
    );
  }

  deactivate(): void {
    if (!this._active) {
      return;
    }

    this._detach();
    this._handler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
    this._handler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
    this._handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    this._removeMapListener?.();
    this._removeMapListener = null;
    this._dragging = false;
    this._active = false;
  }

  destroy(): void {
    this.deactivate();
    this._handler.destroy();
  }

  private _attach(): void {
    const { target } = this._app.maps;
    if (target && this._element.parentElement !== target) {
      target.appendChild(this._element);
    }
  }

  private _detach(): void {
    this._element.parentElement?.removeChild(this._element);
  }

  private _syncPosition(): void {
    this._element.style.left = `calc(${
      100 * this._app.maps.splitPosition
    }% - 2px)`;
  }

  private _onMouseMove(movement: ScreenSpaceEventHandler.MotionEvent): void {
    if (!this._dragging) {
      return;
    }

    const { parentElement: parent } = this._element;
    if (!parent || parent.offsetWidth === 0) {
      return;
    }

    const splitPosition =
      (this._element.offsetLeft + movement.endPosition.x) / parent.offsetWidth;

    if (splitPosition > minSplitPosition && splitPosition < maxSplitPosition) {
      this._app.maps.splitPosition = splitPosition;
      this._syncPosition();
    }
  }
}

export default LayerSplitElement;
