export class Highlighter {
  private container: HTMLDivElement;
  private highlightBox: HTMLDivElement;
  private selectedBox: HTMLDivElement | null;
  private tooltip: HTMLDivElement;

  constructor(shadowRoot: ShadowRoot) {
    // Container covering the viewport
    this.container = document.createElement('div');
    this.container.className = 'poke-overlay-container';
    shadowRoot.appendChild(this.container);

    // Highlight box (hover)
    this.highlightBox = document.createElement('div');
    this.highlightBox.className = 'poke-highlight-box';
    this.container.appendChild(this.highlightBox);

    // Tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'poke-tooltip';
    this.container.appendChild(this.tooltip);

    // No selected box initially
    this.selectedBox = null;
  }

  showHighlight(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();

    this.highlightBox.style.top = `${rect.top}px`;
    this.highlightBox.style.left = `${rect.left}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;
    this.highlightBox.classList.add('visible');

    // Build tooltip label: tag#id.class or tag.class or just tag
    const tag = element.tagName.toLowerCase();
    let label = tag;
    if (element.id) {
      label += `#${element.id}`;
    } else if (element.classList.length > 0) {
      label += `.${element.classList[0]}`;
    }

    this.tooltip.textContent = label;
    this.tooltip.classList.add('visible');

    // Position tooltip above the element, or below if too close to top
    const tooltipHeight = 24;
    const gap = 6;
    let tooltipTop = rect.top - tooltipHeight - gap;
    if (tooltipTop < 0) {
      tooltipTop = rect.bottom + gap;
    }

    let tooltipLeft = rect.left;
    // Prevent tooltip from overflowing right edge
    const tooltipWidth = this.tooltip.offsetWidth;
    if (tooltipLeft + tooltipWidth > window.innerWidth) {
      tooltipLeft = window.innerWidth - tooltipWidth - 4;
    }
    if (tooltipLeft < 0) {
      tooltipLeft = 4;
    }

    this.tooltip.style.top = `${tooltipTop}px`;
    this.tooltip.style.left = `${tooltipLeft}px`;
  }

  hideHighlight(): void {
    this.highlightBox.classList.remove('visible');
    this.tooltip.classList.remove('visible');
  }

  showSelected(element: HTMLElement): void {
    this.clearSelected();

    const rect = element.getBoundingClientRect();

    this.selectedBox = document.createElement('div');
    this.selectedBox.className = 'poke-selected-box';
    this.selectedBox.style.top = `${rect.top}px`;
    this.selectedBox.style.left = `${rect.left}px`;
    this.selectedBox.style.width = `${rect.width}px`;
    this.selectedBox.style.height = `${rect.height}px`;
    this.container.appendChild(this.selectedBox);
  }

  clearSelected(): void {
    if (this.selectedBox) {
      this.selectedBox.remove();
      this.selectedBox = null;
    }
  }

  setActive(active: boolean): void {
    if (active) {
      this.container.classList.add('active');
    } else {
      this.container.classList.remove('active');
    }
  }

  getContainer(): HTMLDivElement {
    return this.container;
  }
}
