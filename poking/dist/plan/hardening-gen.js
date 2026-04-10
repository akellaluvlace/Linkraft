"use strict";
// Hardening Generator: step 13 of /linkraft plan.
//
// Reads every .plan/*.md document produced by steps 1-12 and synthesizes a
// prioritized list of action items into .plan/HARDENING.md. The output
// categorizes work into three buckets:
//
//   must-fix      — blocks launch (security, data loss, correctness)
//   should-fix    — improves quality (architecture, UX, incomplete features)
//   nice-to-have  — polish (medium risks, minor refinements)
//
// The generator is deterministic: same .plan/ input → same HARDENING.md.
// Step 14 (generateClaudeMdFromPlan) reads HARDENING.md and surfaces the
// top items in the CLAUDE.md "Known Issues" section.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorize = categorize;
exports.isLaunchBlocker = isLaunchBlocker;
exports.estimateEffort = estimateEffort;
exports.extractHardeningItems = extractHardeningItems;
exports.formatHardeningMd = formatHardeningMd;
exports.generateHardeningMd = generateHardeningMd;
exports.writeHardeningMd = writeHardeningMd;
exports.parseHardeningMd = parseHardeningMd;
exports.topHardeningItems = topHardeningItems;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const plan_reader_js_1 = require("./plan-reader.js");
// ============================================================================
// Categorization + priority heuristics
// ============================================================================
const SECURITY_KEYWORDS = /\b(auth|secret|rls|password|token|encrypt|xss|csrf|sql injection|injection|cors|cookie|session|oauth|jwt)\b/i;
const DATA_KEYWORDS = /\b(data loss|migration|schema|corrupt|backup|integrity|foreign key|cascade)\b/i;
const PERF_KEYWORDS = /\b(perf(?:ormance)?|slow|latency|timeout|n\+1|memory leak|bundle size|lcp|cls)\b/i;
const UX_KEYWORDS = /\b(ux|contrast|a11y|accessibility|keyboard|screen reader|color blind|mobile)\b/i;
const API_KEYWORDS = /\b(endpoint|route|handler|rest|graphql|rpc)\b/i;
const SCHEMA_KEYWORDS = /\b(table|column|index|constraint|relation|orm|prisma|drizzle)\b/i;
const DESIGN_KEYWORDS = /\b(token|palette|typography|spacing|component|design system)\b/i;
/** Classifies an action item by category based on its description text. */
function categorize(text) {
    if (SECURITY_KEYWORDS.test(text))
        return 'security';
    if (DATA_KEYWORDS.test(text))
        return 'data';
    if (PERF_KEYWORDS.test(text))
        return 'performance';
    if (UX_KEYWORDS.test(text))
        return 'ux';
    if (API_KEYWORDS.test(text))
        return 'api';
    if (SCHEMA_KEYWORDS.test(text))
        return 'schema';
    if (DESIGN_KEYWORDS.test(text))
        return 'design';
    return 'general';
}
/** Security or data issues are always must-fix regardless of their source bucket. */
function isLaunchBlocker(text) {
    return SECURITY_KEYWORDS.test(text) || DATA_KEYWORDS.test(text);
}
/** Rough effort estimate from description length + keywords. */
function estimateEffort(text) {
    const t = text.toLowerCase();
    if (/\b(refactor|migrate|redesign|rewrite|overhaul|restructure)\b/.test(t))
        return 'L';
    if (/\b(review|audit|document|verify|check)\b/.test(t))
        return 'S';
    if (text.length < 80)
        return 'S';
    if (text.length < 180)
        return 'M';
    return 'L';
}
// ============================================================================
// Extraction from each .plan/ doc
// ============================================================================
/**
 * Pulls action items from a risk matrix by severity bucket.
 * Critical → must-fix, High → must-fix (if security/data) or should-fix,
 * Medium → nice-to-have, Accepted → skipped (these are knowingly untreated).
 */
function extractFromRiskMatrix(md) {
    const items = [];
    const critical = (0, plan_reader_js_1.extractSection)(md, 'Critical');
    if (critical) {
        for (const bullet of (0, plan_reader_js_1.extractBullets)(critical, 20)) {
            items.push({
                priority: 'must-fix',
                category: categorize(bullet),
                description: bullet,
                source: 'RISK_MATRIX.md',
                effort: estimateEffort(bullet),
            });
        }
    }
    const high = (0, plan_reader_js_1.extractSection)(md, 'High');
    if (high) {
        for (const bullet of (0, plan_reader_js_1.extractBullets)(high, 20)) {
            const priority = isLaunchBlocker(bullet) ? 'must-fix' : 'should-fix';
            items.push({
                priority,
                category: categorize(bullet),
                description: bullet,
                source: 'RISK_MATRIX.md',
                effort: estimateEffort(bullet),
            });
        }
    }
    const medium = (0, plan_reader_js_1.extractSection)(md, 'Medium');
    if (medium) {
        for (const bullet of (0, plan_reader_js_1.extractBullets)(medium, 20)) {
            items.push({
                priority: 'nice-to-have',
                category: categorize(bullet),
                description: bullet,
                source: 'RISK_MATRIX.md',
                effort: estimateEffort(bullet),
            });
        }
    }
    return items;
}
/** Architecture weaknesses → must-fix if security/data, else should-fix. */
function extractFromArchitecture(md) {
    const items = [];
    const weaknesses = (0, plan_reader_js_1.extractSection)(md, 'Weaknesses') ||
        (0, plan_reader_js_1.extractSection)(md, 'Issues') ||
        (0, plan_reader_js_1.extractSection)(md, 'Problems') ||
        (0, plan_reader_js_1.extractSection)(md, 'Concerns');
    if (!weaknesses)
        return items;
    for (const bullet of (0, plan_reader_js_1.extractBullets)(weaknesses, 15)) {
        const priority = isLaunchBlocker(bullet) ? 'must-fix' : 'should-fix';
        items.push({
            priority,
            category: isLaunchBlocker(bullet) ? categorize(bullet) : 'architecture',
            description: bullet,
            source: 'ARCHITECTURE.md',
            effort: estimateEffort(bullet),
        });
    }
    return items;
}
/** Schema gaps, missing RLS, or unsafe patterns → must-fix. */
function extractFromSchema(md) {
    const items = [];
    // Explicit gaps section if present
    const gaps = (0, plan_reader_js_1.extractSection)(md, 'Gaps') ||
        (0, plan_reader_js_1.extractSection)(md, 'Missing') ||
        (0, plan_reader_js_1.extractSection)(md, 'Issues');
    if (gaps) {
        for (const bullet of (0, plan_reader_js_1.extractBullets)(gaps, 10)) {
            items.push({
                priority: 'must-fix',
                category: 'schema',
                description: bullet,
                source: 'SCHEMA.md',
                effort: estimateEffort(bullet),
            });
        }
    }
    // Scan RLS section for disabled/missing markers
    const rls = (0, plan_reader_js_1.extractSection)(md, 'RLS');
    if (rls && /\b(disabled|missing|no rls|not enabled)\b/i.test(rls)) {
        items.push({
            priority: 'must-fix',
            category: 'security',
            description: 'Tables missing Row Level Security (see SCHEMA.md)',
            source: 'SCHEMA.md',
            effort: 'M',
        });
    }
    return items;
}
/**
 * API endpoints without auth → must-fix. Parses the endpoint table in API_MAP.md
 * looking for an auth column whose value reads as "no", "none", "missing",
 * "unprotected", or "public".
 */
function extractFromApiMap(md) {
    const items = [];
    const lines = md.split('\n');
    // Identify header row to find the auth column index
    let headerIdx = -1;
    let authCol = -1;
    let pathCol = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!/^\s*\|.+\|/.test(line))
            continue;
        const cells = line.split('|').map(c => c.trim().toLowerCase());
        const auth = cells.findIndex(c => c === 'auth' || c === 'auth?' || c === 'protected' || c === 'protection');
        const p = cells.findIndex(c => c === 'path' || c === 'route' || c === 'endpoint');
        if (auth >= 0 && p >= 0) {
            headerIdx = i;
            authCol = auth;
            pathCol = p;
            break;
        }
    }
    if (headerIdx < 0)
        return items;
    // Skip header + separator, scan data rows
    for (let i = headerIdx + 2; i < lines.length; i++) {
        const line = lines[i];
        if (!/^\s*\|.+\|/.test(line))
            break;
        if (/^\s*\|[\s|:-]+\|\s*$/.test(line))
            continue;
        const cells = line.split('|').map(c => c.trim());
        const authCell = (cells[authCol] ?? '').toLowerCase();
        const pathCell = cells[pathCol] ?? '(unknown)';
        if (/^(no|none|missing|unprotected|public)$/.test(authCell)) {
            items.push({
                priority: 'must-fix',
                category: 'security',
                description: `Endpoint \`${pathCell}\` is missing auth`,
                source: 'API_MAP.md',
                effort: 'S',
            });
        }
    }
    return items;
}
/** Design system violations → should-fix unless explicitly flagged critical. */
function extractFromDesignTokens(md) {
    const items = [];
    const violations = (0, plan_reader_js_1.extractSection)(md, 'Violations') ||
        (0, plan_reader_js_1.extractSection)(md, 'Issues') ||
        (0, plan_reader_js_1.extractSection)(md, 'Problems') ||
        (0, plan_reader_js_1.extractSection)(md, 'Inconsistencies');
    if (!violations)
        return items;
    for (const bullet of (0, plan_reader_js_1.extractBullets)(violations, 10)) {
        items.push({
            priority: 'should-fix',
            category: 'design',
            description: bullet,
            source: 'DESIGN_TOKENS.md',
            effort: 'S',
        });
    }
    return items;
}
/** Feature gaps → should-fix (incomplete features blocking good UX). */
function extractFromFeatures(md) {
    const items = [];
    const gaps = (0, plan_reader_js_1.extractSection)(md, 'Gaps') ||
        (0, plan_reader_js_1.extractSection)(md, 'Missing') ||
        (0, plan_reader_js_1.extractSection)(md, 'Known Issues') ||
        (0, plan_reader_js_1.extractSection)(md, 'Incomplete');
    if (!gaps)
        return items;
    for (const bullet of (0, plan_reader_js_1.extractBullets)(gaps, 10)) {
        const priority = isLaunchBlocker(bullet) ? 'must-fix' : 'should-fix';
        items.push({
            priority,
            category: priority === 'must-fix' ? categorize(bullet) : 'feature',
            description: bullet,
            source: 'FEATURES.md',
            effort: estimateEffort(bullet),
        });
    }
    return items;
}
// ============================================================================
// Assembly
// ============================================================================
/**
 * Assembles a HardeningReport from loaded plan docs. Deterministic: same
 * input produces the same report.
 */
function extractHardeningItems(docs) {
    const all = [];
    if (docs.riskMatrix)
        all.push(...extractFromRiskMatrix(docs.riskMatrix));
    if (docs.architecture)
        all.push(...extractFromArchitecture(docs.architecture));
    if (docs.schema)
        all.push(...extractFromSchema(docs.schema));
    if (docs.apiMap)
        all.push(...extractFromApiMap(docs.apiMap));
    if (docs.tokens)
        all.push(...extractFromDesignTokens(docs.tokens));
    if (docs.features)
        all.push(...extractFromFeatures(docs.features));
    // De-duplicate by description (case-insensitive)
    const seen = new Set();
    const unique = [];
    for (const item of all) {
        const key = item.description.toLowerCase().trim();
        if (seen.has(key))
            continue;
        seen.add(key);
        unique.push(item);
    }
    const mustFix = unique.filter(i => i.priority === 'must-fix');
    const shouldFix = unique.filter(i => i.priority === 'should-fix');
    const niceToHave = unique.filter(i => i.priority === 'nice-to-have');
    return {
        totalItems: unique.length,
        mustFix,
        shouldFix,
        niceToHave,
    };
}
/** Formats a HardeningReport as markdown. */
function formatHardeningMd(report) {
    const lines = [
        `# ${report.projectName} — Hardening Proposal`,
        '',
        `> Generated: ${report.generated}`,
        `> ${report.totalItems} action items synthesized from \`.plan/\` documents.`,
        '',
        'This document distills findings from steps 1-12 of the plan pipeline into',
        'prioritized action items. Each item carries a category, source document,',
        'and effort estimate (S/M/L). Every future Claude session should open this',
        'to know what needs attention.',
        '',
    ];
    const renderGroup = (title, desc, items) => {
        lines.push(`## ${title} (${items.length})`);
        lines.push('');
        lines.push(`*${desc}*`);
        lines.push('');
        if (items.length === 0) {
            lines.push('_None detected._');
            lines.push('');
            return;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            lines.push(`### ${i + 1}. ${item.description}`);
            lines.push('');
            lines.push(`- **Category:** ${item.category}`);
            lines.push(`- **Source:** \`${item.source}\``);
            lines.push(`- **Effort:** ${item.effort}`);
            lines.push('');
        }
    };
    renderGroup('Must Fix', 'Blocks launch. Security issues, data integrity, correctness. Fix before shipping.', report.mustFix);
    renderGroup('Should Fix', 'Improves quality. Architecture weaknesses, incomplete features, UX problems. Fix soon after launch.', report.shouldFix);
    renderGroup('Nice to Have', 'Polish. Medium-priority refinements. Consider for future iterations.', report.niceToHave);
    if (report.totalItems === 0) {
        lines.push('## No Action Items Found');
        lines.push('');
        lines.push('No risks, weaknesses, or gaps were detected in the `.plan/` documents.');
        lines.push('Either the project is in excellent shape or the research phase did not');
        lines.push('surface enough detail. Re-run `/linkraft plan architecture` and');
        lines.push('`/linkraft plan risks` if uncertain.');
    }
    return lines.join('\n');
}
/**
 * Reads package.json to derive the project name for the report header.
 */
function detectProjectName(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (typeof pkg['name'] === 'string' && pkg['name'].length > 0)
                return pkg['name'];
        }
        catch { }
    }
    return path.basename(projectRoot);
}
/**
 * Full pipeline: load plan docs, extract items, format markdown, return both
 * the content and the report data. Returns null if no .plan/ docs exist.
 */
function generateHardeningMd(projectRoot) {
    const docs = (0, plan_reader_js_1.loadPlanDocs)(projectRoot);
    if (!(0, plan_reader_js_1.hasPlanDocs)(docs))
        return null;
    const extracted = extractHardeningItems(docs);
    const report = {
        generated: new Date().toISOString(),
        projectName: detectProjectName(projectRoot),
        ...extracted,
    };
    const content = formatHardeningMd(report);
    return { content, report };
}
/** Writes HARDENING.md to .plan/. Creates .plan/ if missing. */
function writeHardeningMd(projectRoot, content) {
    const planDir = path.join(projectRoot, '.plan');
    if (!fs.existsSync(planDir))
        fs.mkdirSync(planDir, { recursive: true });
    const filePath = path.join(planDir, 'HARDENING.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
// ============================================================================
// Reading HARDENING.md back out for use in CLAUDE.md generation
// ============================================================================
/**
 * Parses a HARDENING.md back into structured items. Used by the CLAUDE.md
 * generator to surface the top N action items in the Known Issues section.
 * Returns empty arrays if the file does not exist or can't be parsed.
 */
function parseHardeningMd(projectRoot) {
    const filePath = path.join(projectRoot, '.plan', 'HARDENING.md');
    if (!fs.existsSync(filePath))
        return { totalItems: 0, mustFix: [], shouldFix: [], niceToHave: [] };
    let md;
    try {
        md = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return { totalItems: 0, mustFix: [], shouldFix: [], niceToHave: [] };
    }
    const parseGroup = (heading) => {
        const section = (0, plan_reader_js_1.extractSection)(md, heading);
        if (!section)
            return [];
        const items = [];
        // Collect all h3 match positions first, then slice between them.
        // Avoid using a global regex in a while loop (prone to lastIndex bugs).
        const h3Re = /^###\s+\d+\.\s+(.+?)\s*$/gm;
        const matches = [];
        let m;
        while ((m = h3Re.exec(section)) !== null) {
            matches.push({
                description: m[1],
                start: m.index + m[0].length,
                end: -1, // filled in after collection
            });
            // Guard against zero-width matches
            if (m.index === h3Re.lastIndex)
                h3Re.lastIndex++;
        }
        for (let i = 0; i < matches.length; i++) {
            matches[i].end = i + 1 < matches.length ? matches[i + 1].start : section.length;
        }
        const priority = heading.toLowerCase().includes('must') ? 'must-fix'
            : heading.toLowerCase().includes('should') ? 'should-fix'
                : 'nice-to-have';
        for (const match of matches) {
            const body = section.slice(match.start, match.end);
            const categoryMatch = /\*\*Category:\*\*\s+(\S+)/.exec(body);
            const sourceMatch = /\*\*Source:\*\*\s+`?([^`\n]+?)`?\s*$/m.exec(body);
            const effortMatch = /\*\*Effort:\*\*\s+([SML])/.exec(body);
            items.push({
                priority,
                category: (categoryMatch?.[1] ?? 'general'),
                description: match.description,
                source: sourceMatch?.[1]?.trim() ?? 'HARDENING.md',
                effort: (effortMatch?.[1] ?? 'M'),
            });
        }
        return items;
    };
    const mustFix = parseGroup('Must Fix');
    const shouldFix = parseGroup('Should Fix');
    const niceToHave = parseGroup('Nice to Have');
    return {
        totalItems: mustFix.length + shouldFix.length + niceToHave.length,
        mustFix,
        shouldFix,
        niceToHave,
    };
}
/**
 * Returns the top N items from a hardening report, must-fix first, then
 * should-fix, then nice-to-have. Used by CLAUDE.md to surface priorities.
 */
function topHardeningItems(report, limit = 10) {
    const ordered = [...report.mustFix, ...report.shouldFix, ...report.niceToHave];
    return ordered.slice(0, limit);
}
//# sourceMappingURL=hardening-gen.js.map