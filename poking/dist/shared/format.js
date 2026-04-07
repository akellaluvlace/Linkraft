"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPokeContext = formatPokeContext;
const MAX_TEXT_LENGTH = 200;
const SEPARATOR = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
function formatPokeContext(ctx) {
    const lines = [];
    lines.push('POKE: Element Selected');
    lines.push(SEPARATOR);
    lines.push('');
    // DOM
    lines.push('DOM:');
    lines.push(`  Tag: <${ctx.dom.tag}>`);
    if (ctx.dom.textContent) {
        lines.push(`  Text content: "${truncate(ctx.dom.textContent, MAX_TEXT_LENGTH)}"`);
    }
    if (ctx.dom.id) {
        lines.push(`  ID: ${ctx.dom.id}`);
    }
    if (ctx.dom.classes.length > 0) {
        lines.push(`  Classes: "${ctx.dom.classes.join(' ')}"`);
    }
    const attrEntries = Object.entries(ctx.dom.attributes).filter(([k]) => k !== 'class' && k !== 'id');
    if (attrEntries.length > 0) {
        const attrs = attrEntries.map(([k, v]) => `${k}="${v}"`).join(', ');
        lines.push(`  Attributes: ${attrs}`);
    }
    lines.push('');
    // Source
    if (ctx.source) {
        lines.push('Source:');
        if (ctx.source.component) {
            lines.push(`  Component: ${ctx.source.component}`);
        }
        if (ctx.source.file) {
            lines.push(`  File: ${ctx.source.file}`);
        }
        if (ctx.source.line != null) {
            lines.push(`  Line: ${ctx.source.line}`);
        }
        if (ctx.source.column != null) {
            lines.push(`  Col: ${ctx.source.column}`);
        }
        lines.push(`  Framework: ${ctx.source.framework}`);
        if (ctx.source.selectorPath) {
            lines.push(`  Selector: ${ctx.source.selectorPath}`);
        }
        if (ctx.source.searchHints && ctx.source.searchHints.length > 0) {
            lines.push(`  Search hints: ${ctx.source.searchHints.join(', ')}`);
        }
        lines.push('');
    }
    // Styles
    lines.push('Styles (computed):');
    const c = ctx.styles.computed;
    lines.push(`  width: ${c.width}`);
    lines.push(`  height: ${c.height}`);
    lines.push(`  font-size: ${c.fontSize}`);
    lines.push(`  font-weight: ${c.fontWeight}`);
    lines.push(`  padding: ${c.padding}`);
    lines.push(`  background: ${c.backgroundColor}`);
    lines.push(`  color: ${c.color}`);
    lines.push(`  border-radius: ${c.borderRadius}`);
    lines.push(`  margin: ${c.margin}`);
    if (c.gap) {
        lines.push(`  gap: ${c.gap}`);
    }
    if (ctx.styles.tailwindClasses) {
        lines.push('');
        lines.push(`Tailwind: "${ctx.styles.tailwindClasses}"`);
    }
    if (ctx.styles.cssModules) {
        lines.push(`CSS Module: ${ctx.styles.cssModules}`);
    }
    lines.push('');
    // Layout
    lines.push('Layout:');
    lines.push(formatLayout(ctx.layout));
    lines.push('');
    // Component data
    if (ctx.componentData) {
        if (ctx.componentData.props) {
            lines.push('Props:');
            for (const [key, value] of Object.entries(ctx.componentData.props)) {
                lines.push(`  ${key}: ${formatPropValue(value)}`);
            }
            lines.push('');
        }
        if (ctx.componentData.state) {
            lines.push('State:');
            for (const [key, value] of Object.entries(ctx.componentData.state)) {
                lines.push(`  ${key}: ${formatPropValue(value)}`);
            }
            lines.push('');
        }
    }
    lines.push(SEPARATOR);
    lines.push('Ready for instructions. What would you like to change?');
    return lines.join('\n');
}
function formatLayout(layout) {
    const lines = [];
    const parentClasses = layout.parentClasses.length > 0
        ? ` .${layout.parentClasses.join('.')}`
        : '';
    const parentComp = layout.parentComponent ? ` (${layout.parentComponent})` : '';
    lines.push(`  Parent: <${layout.parentTag}>${parentClasses}${parentComp}`);
    if (layout.siblings.length > 0) {
        lines.push('  Siblings:');
        for (let i = 0; i < layout.siblings.length; i++) {
            const s = layout.siblings[i];
            if (!s)
                continue;
            const sClasses = s.classes.length > 0 ? ` .${s.classes[0]}` : '';
            const sText = s.textContent ? ` "${truncate(s.textContent, 40)}"` : '';
            lines.push(`    - <${s.tag}>${sClasses}${sText} (sibling ${i + 1})`);
        }
    }
    lines.push(`  Position: child ${layout.siblingIndex + 1} of ${layout.siblingCount}`);
    return lines.join('\n');
}
function formatPropValue(value) {
    if (typeof value === 'function')
        return '[function]';
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'string')
        return `"${truncate(value, 100)}"`;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    if (Array.isArray(value)) {
        if (value.length > 5)
            return `[Array(${value.length})]`;
        return JSON.stringify(value);
    }
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length > 5)
            return `{Object(${keys.length} keys)}`;
        return JSON.stringify(value);
    }
    return String(value);
}
function truncate(str, max) {
    const clean = str.replace(/\s+/g, ' ').trim();
    if (clean.length <= max)
        return clean;
    return clean.slice(0, max) + '...';
}
//# sourceMappingURL=format.js.map