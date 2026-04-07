import { Highlighter } from './highlighter';
import { Selector } from './selector';
import {
  extractDomInfo,
  extractStyles,
  extractLayout,
  extractBoundingBox,
} from './extractor';
import type { PokeContext, PokeMessage } from '../shared/types';
import { resolveElement } from '../resolver/resolver-factory';
import { OVERLAY_STYLES } from './styles';

let highlighter: Highlighter;
let selector: Selector;
let shadowRoot: ShadowRoot;
let mouseMoveHandler: ((event: MouseEvent) => void) | null = null;

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/** Cached VS Code API reference, if running inside a webview. */
let vscodeApi: VsCodeApi | null = null;

function getVsCodeApi(): VsCodeApi | null {
  if (vscodeApi) {
    return vscodeApi;
  }
  // acquireVsCodeApi is a global function injected by VS Code webview runtime
  const win = window as unknown as Record<string, unknown>;
  if (typeof win['acquireVsCodeApi'] === 'function') {
    vscodeApi = (win['acquireVsCodeApi'] as () => VsCodeApi)();
    return vscodeApi;
  }
  return null;
}

export function init(): void {
  // Create the shadow DOM host
  const host = document.createElement('div');
  host.id = 'poke-overlay-root';
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'visible';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  // Inject styles into shadow root
  const styleElement = document.createElement('style');
  styleElement.textContent = OVERLAY_STYLES;
  shadowRoot.appendChild(styleElement);

  // Create highlighter and selector
  highlighter = new Highlighter(shadowRoot);
  selector = new Selector();
  selector.setOverlayContainer(highlighter.getContainer());

  // Listen for messages from the extension to toggle poke mode
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as Record<string, unknown> | undefined;
    if (!data || typeof data !== 'object') {
      return;
    }

    if (data['type'] === 'poke-mode-changed') {
      const payload = data['payload'] as Record<string, unknown> | undefined;
      if (payload && typeof payload === 'object') {
        const mode = payload['mode'];
        if (mode === 'single' || mode === 'multi') {
          enablePokeMode();
        } else {
          disablePokeMode();
        }
      }
    }
  });
}

export function enablePokeMode(): void {
  highlighter.setActive(true);

  // Enable selector
  selector.enable(handleElementSelected);

  // Enable mousemove highlighting
  if (mouseMoveHandler) {
    document.removeEventListener('mousemove', mouseMoveHandler, true);
  }

  mouseMoveHandler = (event: MouseEvent): void => {
    const target = event.target;

    // Ignore if target is inside the overlay host
    const host = document.getElementById('poke-overlay-root');
    if (host && target instanceof Node && host.contains(target)) {
      return;
    }

    if (target instanceof HTMLElement) {
      highlighter.showHighlight(target);
    }
  };

  document.addEventListener('mousemove', mouseMoveHandler, true);
}

export function disablePokeMode(): void {
  highlighter.setActive(false);

  // Disable selector
  selector.disable();

  // Remove mousemove listener
  if (mouseMoveHandler) {
    document.removeEventListener('mousemove', mouseMoveHandler, true);
    mouseMoveHandler = null;
  }

  // Hide highlights and clear selection
  highlighter.hideHighlight();
  highlighter.clearSelected();
}

function handleElementSelected(element: HTMLElement): void {
  // Show the persistent green selection indicator
  highlighter.showSelected(element);

  // Extract all data
  const dom = extractDomInfo(element);
  const styles = extractStyles(element);
  const layout = extractLayout(element);
  const boundingBox = extractBoundingBox(element);

  const { source, componentData } = resolveElement(element);

  const context: PokeContext = {
    dom,
    source,
    styles,
    layout,
    componentData,
    screenshot: null,
    boundingBox,
    timestamp: new Date().toISOString(),
    pageUrl: window.location.href,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };

  const message: PokeMessage = {
    type: 'element-selected',
    payload: { context },
  };

  sendToExtension(message);
}

function sendToExtension(message: PokeMessage): void {
  // CDP mode: store on window global for polling via execute_javascript
  const win = window as unknown as Record<string, unknown>;
  if (message.type === 'element-selected') {
    win['__POKE_SELECTED__'] = (message.payload as Record<string, unknown>)['context'];
  }

  // CDP binding mode: call the binding if registered by Runtime.addBinding
  if (typeof win['__poke_report__'] === 'function') {
    (win['__poke_report__'] as (data: string) => void)(JSON.stringify(message));
    return;
  }

  const api = getVsCodeApi();
  if (api) {
    api.postMessage(message);
  } else {
    window.parent.postMessage(message, '*');
  }
}
