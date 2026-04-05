import type {
  DomInfo,
  StyleData,
  ComputedStyleData,
  LayoutInfo,
  BoundingBox,
  SiblingInfo,
} from '../shared/types';

const TAILWIND_PATTERN =
  /^(bg|text|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|flex|grid|gap|rounded|shadow|border|font|leading|tracking|opacity|transition|duration|ease|hover:|focus:|active:|sm:|md:|lg:|xl:|2xl:)-/;

const CSS_MODULE_PATTERN = /^_[a-zA-Z][\w-]*_[a-z0-9]{5,}$/;

const COMPUTED_STYLE_KEYS: ReadonlyArray<keyof ComputedStyleData> = [
  'width',
  'height',
  'fontSize',
  'fontWeight',
  'color',
  'backgroundColor',
  'padding',
  'margin',
  'borderRadius',
  'display',
  'position',
  'gap',
];

const CSS_PROPERTY_MAP: Record<keyof ComputedStyleData, string> = {
  width: 'width',
  height: 'height',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  color: 'color',
  backgroundColor: 'background-color',
  padding: 'padding',
  margin: 'margin',
  borderRadius: 'border-radius',
  display: 'display',
  position: 'position',
  gap: 'gap',
};

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

export function extractDomInfo(element: HTMLElement): DomInfo {
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    classes: Array.from(element.classList),
    attributes,
    textContent: truncate(element.textContent ?? '', 200),
    innerHTML: truncate(element.innerHTML ?? '', 200),
  };
}

export function extractStyles(element: HTMLElement): StyleData {
  const classes = Array.from(element.classList);

  // Detect Tailwind classes
  const tailwindClasses = classes.filter((cls) => TAILWIND_PATTERN.test(cls));
  const tailwindResult =
    tailwindClasses.length > 0 ? tailwindClasses.join(' ') : null;

  // Detect CSS module classes (hashed names like _component_abc123)
  const moduleClasses = classes.filter((cls) => CSS_MODULE_PATTERN.test(cls));
  const cssModulesResult =
    moduleClasses.length > 0 ? moduleClasses.join(' ') : null;

  // Read inline styles
  const inlineStyles: Record<string, string> = {};
  const style = element.style;
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    inlineStyles[prop] = style.getPropertyValue(prop);
  }

  // Read computed styles for key properties
  const computedStyle = window.getComputedStyle(element);
  const computed: ComputedStyleData = {
    width: '',
    height: '',
    fontSize: '',
    fontWeight: '',
    color: '',
    backgroundColor: '',
    padding: '',
    margin: '',
    borderRadius: '',
    display: '',
    position: '',
    gap: null,
  };

  for (const key of COMPUTED_STYLE_KEYS) {
    const cssProperty = CSS_PROPERTY_MAP[key];
    const value = computedStyle.getPropertyValue(cssProperty);
    if (key === 'gap') {
      (computed as unknown as Record<string, string | null>)[key] = value || null;
    } else {
      (computed as unknown as Record<string, string | null>)[key] = value;
    }
  }

  return {
    tailwindClasses: tailwindResult,
    cssModules: cssModulesResult,
    inlineStyles,
    computed,
  };
}

export function extractLayout(element: HTMLElement): LayoutInfo {
  const parent = element.parentElement;

  const parentTag = parent ? parent.tagName.toLowerCase() : 'unknown';
  const parentClasses = parent ? Array.from(parent.classList) : [];

  const siblings: SiblingInfo[] = [];
  let siblingIndex = 0;

  if (parent) {
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child === element) {
        siblingIndex = i;
      }
      if (child instanceof HTMLElement) {
        siblings.push({
          tag: child.tagName.toLowerCase(),
          classes: Array.from(child.classList),
          textContent: truncate(child.textContent ?? '', 200),
        });
      }
    }
  }

  return {
    parentTag,
    parentClasses,
    parentComponent: null,
    parentFile: null,
    siblingCount: siblings.length,
    siblingIndex,
    siblings,
  };
}

export function extractBoundingBox(element: HTMLElement): BoundingBox {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}
