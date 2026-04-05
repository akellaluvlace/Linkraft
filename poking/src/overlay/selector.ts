export type SelectionCallback = (element: HTMLElement) => void;

export class Selector {
  private active: boolean;
  private onSelect: SelectionCallback | null;
  private clickHandler: ((event: Event) => void) | null;
  private overlayContainer: HTMLElement | null;

  constructor() {
    this.active = false;
    this.onSelect = null;
    this.clickHandler = null;
    this.overlayContainer = null;
  }

  setOverlayContainer(container: HTMLElement): void {
    this.overlayContainer = container;
  }

  enable(callback: SelectionCallback): void {
    this.disable();

    this.onSelect = callback;
    this.active = true;

    this.clickHandler = (event: Event): void => {
      const target = event.target;

      // Ignore clicks on the overlay container itself
      if (this.overlayContainer && target instanceof Node) {
        // The overlay is inside a shadow DOM host element.
        // Check if the click target is the host or inside the host's shadow.
        const hostElement =
          this.overlayContainer.getRootNode() instanceof ShadowRoot
            ? (this.overlayContainer.getRootNode() as ShadowRoot).host
            : null;
        if (hostElement && hostElement.contains(target as Node)) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (target instanceof HTMLElement && this.onSelect) {
        this.onSelect(target);
      }
    };

    document.addEventListener('click', this.clickHandler, { capture: true });
  }

  disable(): void {
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, {
        capture: true,
      });
      this.clickHandler = null;
    }
    this.onSelect = null;
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}
