export interface DomInfo {
    tag: string;
    id: string | null;
    classes: string[];
    attributes: Record<string, string>;
    textContent: string;
}
export interface SourceInfo {
    component: string | null;
    file: string | null;
    line: number | null;
    column: number | null;
    framework: 'react' | 'vue' | 'svelte' | 'html';
    selectorPath?: string;
    searchHints?: string[];
}
export interface StyleData {
    tailwindClasses: string | null;
    cssModules: string | null;
    inlineStyles: Record<string, string>;
    computed: ComputedStyleData;
}
export interface ComputedStyleData {
    width: string;
    height: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    padding: string;
    margin: string;
    borderRadius: string;
    display: string;
    position: string;
    gap: string | null;
}
export interface LayoutInfo {
    parentTag: string;
    parentClasses: string[];
    parentComponent: string | null;
    parentFile: string | null;
    siblingCount: number;
    siblingIndex: number;
    siblings: SiblingInfo[];
}
export interface SiblingInfo {
    tag: string;
    classes: string[];
    textContent: string;
}
export interface ComponentData {
    props: Record<string, unknown> | null;
    state: Record<string, unknown> | null;
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface PokeContext {
    dom: DomInfo;
    source: SourceInfo | null;
    styles: StyleData;
    layout: LayoutInfo;
    componentData: ComponentData | null;
    screenshot: string | null;
    boundingBox: BoundingBox;
    timestamp: string;
    pageUrl: string;
    viewportWidth: number;
    viewportHeight: number;
}
export type PokeMode = 'off' | 'single' | 'multi';
export interface PokeMessage {
    type: 'element-selected' | 'poke-mode-changed' | 'navigate' | 'error';
    payload: unknown;
}
export interface ElementSelectedPayload {
    context: PokeContext;
}
export interface PokeModePayload {
    mode: PokeMode;
}
