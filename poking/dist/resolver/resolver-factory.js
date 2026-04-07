"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFramework = detectFramework;
exports.resolveElement = resolveElement;
exports.resolveSource = resolveSource;
exports.resolveComponentData = resolveComponentData;
const react_resolver_1 = require("./react-resolver");
const generic_resolver_1 = require("./generic-resolver");
function detectFramework() {
    const win = window;
    // Check React DevTools hook
    const hook = win['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
    if (hook && hook.renderers && hook.renderers.size > 0) {
        return 'react';
    }
    // Check for React fiber keys on any element in the document
    const rootElement = document.getElementById('root') ?? document.body;
    if (rootElement) {
        const keys = Object.keys(rootElement);
        const hasFiber = keys.some((key) => key.startsWith('__reactFiber$') ||
            key.startsWith('__reactInternalInstance$'));
        if (hasFiber) {
            return 'react';
        }
    }
    // Check for Vue (data-v- scoped style attributes)
    const vueElement = document.querySelector('[data-v-]');
    if (vueElement) {
        return 'vue';
    }
    // Check for Svelte (class names with svelte- hash)
    const svelteElement = document.querySelector('[class*="svelte-"]');
    if (svelteElement) {
        return 'svelte';
    }
    return 'html';
}
function resolveElement(element) {
    const framework = detectFramework();
    return {
        source: resolveSourceFor(element, framework),
        componentData: resolveComponentDataFor(element, framework),
    };
}
function resolveSource(element) {
    return resolveSourceFor(element, detectFramework());
}
function resolveComponentData(element) {
    return resolveComponentDataFor(element, detectFramework());
}
function resolveSourceFor(element, framework) {
    switch (framework) {
        case 'react': {
            const result = (0, react_resolver_1.resolveReact)(element);
            if (result)
                return result;
            return (0, generic_resolver_1.resolveGeneric)(element);
        }
        case 'vue':
        case 'svelte':
            return (0, generic_resolver_1.resolveGeneric)(element);
        case 'html':
        default:
            return (0, generic_resolver_1.resolveGeneric)(element);
    }
}
function resolveComponentDataFor(element, framework) {
    switch (framework) {
        case 'react':
            return (0, react_resolver_1.extractReactComponentData)(element);
        case 'vue':
        case 'svelte':
        case 'html':
        default:
            return null;
    }
}
//# sourceMappingURL=resolver-factory.js.map