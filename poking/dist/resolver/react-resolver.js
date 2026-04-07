"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReact = resolveReact;
exports.extractReactComponentData = extractReactComponentData;
const MAX_PROP_VALUE_LENGTH = 200;
const MAX_DOM_WALK_DEPTH = 15;
function findFiber(element) {
    const keys = Object.keys(element);
    const fiberKey = keys.find((key) => key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$'));
    if (!fiberKey) {
        return null;
    }
    return element[fiberKey] ?? null;
}
function getComponentName(fiber) {
    if (typeof fiber.type === 'string') {
        // Host components like 'div', 'span' are not meaningful component names
        return null;
    }
    if (typeof fiber.type === 'object' && fiber.type !== null) {
        return fiber.type.displayName ?? fiber.type.name ?? null;
    }
    return null;
}
function findNearestComponentFiber(fiber) {
    let current = fiber;
    while (current) {
        const name = getComponentName(current);
        if (name) {
            return current;
        }
        current = current.return;
    }
    return null;
}
function findPokeAttributes(element) {
    let current = element;
    let depth = 0;
    while (current && depth < MAX_DOM_WALK_DEPTH) {
        const file = current.getAttribute('data-poke-file');
        const lineAttr = current.getAttribute('data-poke-line');
        if (file) {
            const columnAttr = current.getAttribute('data-poke-column');
            return {
                file,
                line: lineAttr ? parseInt(lineAttr, 10) : null,
                column: columnAttr ? parseInt(columnAttr, 10) : null,
            };
        }
        current = current.parentElement;
        depth++;
    }
    return { file: null, line: null, column: null };
}
function resolveReact(element) {
    const fiber = findFiber(element);
    if (!fiber) {
        // No React fiber found: try data-poke-* attributes as fallback
        const pokeAttrs = findPokeAttributes(element);
        if (pokeAttrs.file) {
            return {
                component: null,
                file: pokeAttrs.file,
                line: pokeAttrs.line,
                column: pokeAttrs.column,
                framework: 'react',
            };
        }
        return null;
    }
    // Find the nearest user component in the fiber tree
    const componentFiber = findNearestComponentFiber(fiber);
    const componentName = componentFiber
        ? getComponentName(componentFiber)
        : null;
    // Try _debugSource on the component fiber first, then on the element fiber
    const debugFiber = componentFiber ?? fiber;
    const debugSource = debugFiber._debugSource;
    if (debugSource) {
        return {
            component: componentName,
            file: debugSource.fileName,
            line: debugSource.lineNumber,
            column: debugSource.columnNumber ?? null,
            framework: 'react',
        };
    }
    // React 19+ with Babel plugin: check data-poke-* attributes
    const pokeAttrs = findPokeAttributes(element);
    return {
        component: componentName,
        file: pokeAttrs.file,
        line: pokeAttrs.line,
        column: pokeAttrs.column,
        framework: 'react',
    };
}
function sanitizePropValue(value) {
    if (typeof value === 'function') {
        return '[function]';
    }
    if (typeof value === 'string' && value.length > MAX_PROP_VALUE_LENGTH) {
        return value.slice(0, MAX_PROP_VALUE_LENGTH) + '...';
    }
    if (typeof value === 'object' && value !== null) {
        // Avoid serializing React elements or deep objects
        if ('$$typeof' in value) {
            return '[React element]';
        }
        try {
            const json = JSON.stringify(value);
            if (json.length > MAX_PROP_VALUE_LENGTH) {
                return json.slice(0, MAX_PROP_VALUE_LENGTH) + '...';
            }
            return JSON.parse(json);
        }
        catch {
            return '[complex object]';
        }
    }
    return value;
}
function extractStateValues(memoizedState) {
    // React hooks store state as a linked list of state nodes
    // Each node has { memoizedState, next }
    const stateValues = {};
    let current = memoizedState;
    let index = 0;
    const maxStates = 20;
    while (current && typeof current === 'object' && index < maxStates) {
        if ('memoizedState' in current) {
            const val = current['memoizedState'];
            // Skip functions and complex internal structures
            if (typeof val !== 'function' && val !== undefined) {
                stateValues[`state_${index}`] = sanitizePropValue(val);
            }
        }
        if ('next' in current && current['next'] !== null) {
            current = current['next'];
        }
        else {
            break;
        }
        index++;
    }
    return Object.keys(stateValues).length > 0 ? stateValues : null;
}
function extractReactComponentData(element) {
    const fiber = findFiber(element);
    if (!fiber) {
        return null;
    }
    const componentFiber = findNearestComponentFiber(fiber) ?? fiber;
    // Extract props, filtering out children and functions
    const rawProps = componentFiber.memoizedProps;
    let props = null;
    if (rawProps && typeof rawProps === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(rawProps)) {
            if (key === 'children') {
                continue;
            }
            sanitized[key] = sanitizePropValue(value);
        }
        if (Object.keys(sanitized).length > 0) {
            props = sanitized;
        }
    }
    // Extract state
    const state = extractStateValues(componentFiber.memoizedState);
    if (!props && !state) {
        return null;
    }
    return { props, state };
}
//# sourceMappingURL=react-resolver.js.map