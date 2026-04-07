"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGeneric = resolveGeneric;
const MAX_SELECTOR_DEPTH = 8;
function buildSelectorPath(element) {
    const segments = [];
    let current = element;
    while (current && current !== document.body && segments.length < MAX_SELECTOR_DEPTH) {
        const tag = current.tagName.toLowerCase();
        if (current.id) {
            segments.unshift(`${tag}#${current.id}`);
        }
        else if (current.classList.length > 0) {
            const firstClass = current.classList[0];
            segments.unshift(`${tag}.${firstClass}`);
        }
        else {
            segments.unshift(tag);
        }
        current = current.parentElement;
    }
    // Always start with body
    if (segments.length > 0 && !segments[0]?.startsWith('body')) {
        segments.unshift('body');
    }
    return segments.join(' > ');
}
function resolveGeneric(element) {
    const selectorPath = buildSelectorPath(element);
    // Collect search hints: meaningful attributes that help locate the element
    const searchHints = [];
    if (element.className && typeof element.className === 'string') {
        searchHints.push(element.className);
    }
    if (element.id) {
        searchHints.push(`#${element.id}`);
    }
    const testId = element.getAttribute('data-testid');
    if (testId) {
        searchHints.push(`[data-testid="${testId}"]`);
    }
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
        searchHints.push(`[aria-label="${ariaLabel}"]`);
    }
    return {
        component: null,
        file: null,
        line: null,
        column: null,
        framework: 'html',
        selectorPath,
        searchHints: searchHints.length > 0 ? searchHints : undefined,
    };
}
//# sourceMappingURL=generic-resolver.js.map