#!/usr/bin/env node
// Validates all JSON presets in the presets/ directory against the schema.
// Exit code 1 if any preset fails validation.

const fs = require('fs');
const path = require('path');

const PRESETS_DIR = path.resolve(__dirname, '..', 'presets');

// Inline validation (avoids needing to compile TS first)
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CSS_LENGTH_RE = /^\d+(\.\d+)?(px|rem|em|%)$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

function isObj(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validate(data) {
  const errors = [];
  if (!isObj(data)) {
    errors.push('Root must be a JSON object');
    return errors;
  }

  for (const key of ['name', 'id', 'author', 'description']) {
    if (!isNonEmptyString(data[key])) errors.push(`"${key}" is required`);
  }

  if (isNonEmptyString(data.id) && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.id)) {
    errors.push('id must be lowercase-alphanumeric-hyphenated');
  }

  const t = data.tokens;
  if (!isObj(t)) {
    errors.push('tokens is required');
    return errors;
  }

  // colors
  if (isObj(t.colors)) {
    for (const k of ['primary', 'secondary', 'background', 'accent', 'surface']) {
      if (!isNonEmptyString(t.colors[k])) errors.push(`tokens.colors.${k} required`);
      else if (!HEX_COLOR_RE.test(t.colors[k])) errors.push(`tokens.colors.${k} invalid hex`);
    }
  } else {
    errors.push('tokens.colors required');
  }

  // typography
  if (isObj(t.typography)) {
    for (const k of ['heading', 'body', 'mono']) {
      const role = t.typography[k];
      if (!isObj(role)) errors.push(`tokens.typography.${k} required`);
      else {
        if (!isNonEmptyString(role.family)) errors.push(`tokens.typography.${k}.family required`);
        if (!isNonEmptyString(role.weight)) errors.push(`tokens.typography.${k}.weight required`);
      }
    }
  } else {
    errors.push('tokens.typography required');
  }

  // spacing
  if (isObj(t.spacing)) {
    if (!isNonEmptyString(t.spacing.unit) || !CSS_LENGTH_RE.test(t.spacing.unit)) {
      errors.push('tokens.spacing.unit must be valid CSS length');
    }
    if (!Array.isArray(t.spacing.scale) || t.spacing.scale.length === 0) {
      errors.push('tokens.spacing.scale must be non-empty array');
    }
  } else {
    errors.push('tokens.spacing required');
  }

  // borders
  if (isObj(t.borders)) {
    for (const k of ['width', 'radius']) {
      if (!isNonEmptyString(t.borders[k]) || !CSS_LENGTH_RE.test(t.borders[k])) {
        errors.push(`tokens.borders.${k} must be valid CSS length`);
      }
    }
    if (!isNonEmptyString(t.borders.style)) errors.push('tokens.borders.style required');
    if (!isNonEmptyString(t.borders.color)) errors.push('tokens.borders.color required');
  } else {
    errors.push('tokens.borders required');
  }

  // shadows
  if (isObj(t.shadows)) {
    for (const k of ['default', 'hover']) {
      if (!isNonEmptyString(t.shadows[k])) errors.push(`tokens.shadows.${k} required`);
    }
  } else {
    errors.push('tokens.shadows required');
  }

  // animations
  if (isObj(t.animations)) {
    for (const k of ['style', 'hover']) {
      if (!isNonEmptyString(t.animations[k])) errors.push(`tokens.animations.${k} required`);
    }
  } else {
    errors.push('tokens.animations required');
  }

  // componentOverrides
  if (!isObj(data.componentOverrides)) {
    errors.push('componentOverrides required');
  }

  // forbiddenPatterns
  if (!Array.isArray(data.forbiddenPatterns)) {
    errors.push('forbiddenPatterns required');
  }

  // requiredFonts
  if (!Array.isArray(data.requiredFonts)) {
    errors.push('requiredFonts required');
  }

  // contradiction check
  if (isObj(data.componentOverrides) && Array.isArray(data.forbiddenPatterns)) {
    for (const [comp, classes] of Object.entries(data.componentOverrides)) {
      for (const pattern of data.forbiddenPatterns) {
        if (classes.includes(pattern)) {
          errors.push(`componentOverrides.${comp} uses forbidden "${pattern}"`);
        }
      }
    }
  }

  return errors;
}

// Main
const files = fs.readdirSync(PRESETS_DIR).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  process.stderr.write('No preset files found in presets/\n');
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const filePath = path.join(PRESETS_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    process.stderr.write(`FAIL ${file}: invalid JSON - ${e.message}\n`);
    failed = true;
    continue;
  }

  const errors = validate(data);
  if (errors.length > 0) {
    process.stderr.write(`FAIL ${file}:\n`);
    for (const err of errors) {
      process.stderr.write(`  - ${err}\n`);
    }
    failed = true;
  } else {
    process.stderr.write(`PASS ${file}\n`);
  }
}

if (failed) {
  process.exit(1);
} else {
  process.stderr.write(`\nAll ${files.length} presets valid.\n`);
}
