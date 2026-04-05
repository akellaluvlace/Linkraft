export const OVERLAY_STYLES = `
  :host {
    all: initial;
  }

  * {
    box-sizing: border-box;
  }

  .poke-overlay-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  }

  .poke-overlay-container.active {
    pointer-events: auto;
    cursor: crosshair;
  }

  .poke-highlight-box {
    position: fixed;
    border: 2px solid #3b82f6;
    pointer-events: none;
    z-index: 2147483647;
    transition: all 0.05s ease-out;
    display: none;
  }

  .poke-highlight-box.visible {
    display: block;
  }

  .poke-selected-box {
    position: fixed;
    border: 2px solid #22c55e;
    pointer-events: none;
    z-index: 2147483647;
    display: block;
  }

  .poke-tooltip {
    position: fixed;
    background: #1e293b;
    color: #ffffff;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.4;
    padding: 4px 8px;
    border-radius: 4px;
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    z-index: 2147483647;
    display: none;
  }

  .poke-tooltip.visible {
    display: block;
  }
`;
