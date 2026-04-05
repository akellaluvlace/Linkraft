// Token Editor: reads and writes design tokens from/to tailwind.config files.
// Extracts structured token data and can update individual values.

export interface ExtractedTokens {
  colors: Record<string, string>;
  fontFamily: Record<string, string>;
  fontWeight: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  borderWidth: Record<string, string>;
  boxShadow: Record<string, string>;
  raw: string;
}

// Matches `key: "value"` or `key: 'value'` patterns in Tailwind config objects
const KV_RE = /(['"]?)([a-zA-Z0-9_-]+)\1\s*:\s*(['"])([^'"]*)\3/g;

const TOKEN_SECTIONS = [
  'colors', 'fontFamily', 'fontWeight', 'spacing',
  'borderRadius', 'borderWidth', 'boxShadow',
] as const;

/**
 * Extracts a flat key-value map from a config section string.
 */
function extractKV(sectionContent: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = new RegExp(KV_RE.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(sectionContent)) !== null) {
    const key = match[2];
    const value = match[4];
    if (key && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Finds the content between balanced braces after a named section.
 * Handles arbitrary nesting depth.
 */
function extractBracedContent(content: string, sectionName: string): string | null {
  const re = new RegExp(`\\b${sectionName}\\s*:\\s*\\{`);
  const match = re.exec(content);
  if (!match) return null;

  let depth = 1;
  const start = match.index + match[0].length;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    if (depth === 0) {
      return content.slice(start, i);
    }
  }
  return null;
}

/**
 * Extracts design tokens from a Tailwind config file content string.
 * Handles nested `theme.extend` structures at any depth.
 */
export function extractTokens(configContent: string): ExtractedTokens {
  const tokens: ExtractedTokens = {
    colors: {},
    fontFamily: {},
    fontWeight: {},
    spacing: {},
    borderRadius: {},
    borderWidth: {},
    boxShadow: {},
    raw: configContent,
  };

  // Narrow scope: find theme > extend if it exists, otherwise use theme, otherwise use full content
  let searchScope = configContent;
  const themeContent = extractBracedContent(configContent, 'theme');
  if (themeContent) {
    const extendContent = extractBracedContent(themeContent, 'extend');
    searchScope = extendContent ?? themeContent;
  }

  for (const section of TOKEN_SECTIONS) {
    const sectionContent = extractBracedContent(searchScope, section);
    if (sectionContent) {
      Object.assign(tokens[section], extractKV(sectionContent));
    }
  }

  return tokens;
}

/**
 * Updates a single token value in a Tailwind config string.
 * Returns the modified config content.
 *
 * @param configContent - The full tailwind config file as a string
 * @param section - The token section (e.g., 'colors', 'fontFamily')
 * @param key - The key within the section (e.g., 'primary')
 * @param newValue - The new value to set
 * @returns Updated config content, or original if key not found
 */
export function updateToken(
  configContent: string,
  section: string,
  key: string,
  newValue: string,
): string {
  // Strategy: find the section block, then find the key within it, then replace the value
  const sectionRe = new RegExp(
    `(${escapeRegex(section)}\\s*:\\s*\\{[^}]*?)` +
    `((['"]?)${escapeRegex(key)}\\3\\s*:\\s*)(['"])([^'"]*)(\\4)` +
    `([^}]*\\})`,
    's',
  );

  const match = sectionRe.exec(configContent);
  if (!match) {
    return configContent;
  }

  const before = match[1];
  const keyPart = match[2];
  const openQuote = match[4];
  const closeQuote = match[6];
  const after = match[7];

  const replacement = `${before}${keyPart}${openQuote}${newValue}${closeQuote}${after}`;
  return configContent.slice(0, match.index) + replacement + configContent.slice(match.index + match[0].length);
}

/**
 * Generates a Tailwind config extend block from extracted tokens.
 * Useful for creating a config snippet from a preset's token changes.
 */
export function generateConfigSnippet(tokens: Partial<ExtractedTokens>): string {
  const sections: string[] = [];

  const entries: Array<[string, Record<string, string> | undefined]> = [
    ['colors', tokens.colors],
    ['fontFamily', tokens.fontFamily],
    ['fontWeight', tokens.fontWeight],
    ['spacing', tokens.spacing],
    ['borderRadius', tokens.borderRadius],
    ['borderWidth', tokens.borderWidth],
    ['boxShadow', tokens.boxShadow],
  ];

  for (const [name, values] of entries) {
    if (!values || Object.keys(values).length === 0) continue;
    const kvLines = Object.entries(values)
      .map(([k, v]) => `        '${k}': '${v}'`)
      .join(',\n');
    sections.push(`      ${name}: {\n${kvLines}\n      }`);
  }

  return `  theme: {\n    extend: {\n${sections.join(',\n')}\n    }\n  }`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
