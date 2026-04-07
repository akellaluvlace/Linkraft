"use strict";
// SheepCalledShip Auto-Config: scans a codebase and generates a QA plan.
// Zero config. Reads package.json, file structure, CLAUDE.md.
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
exports.detectStack = detectStack;
exports.findBuildCommand = findBuildCommand;
exports.findTestCommand = findTestCommand;
exports.readPreflightReport = readPreflightReport;
exports.identifyHighRiskAreas = identifyHighRiskAreas;
exports.autoConfig = autoConfig;
exports.generateQAPlan = generateQAPlan;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Detects the tech stack from project files.
 */
function detectStack(projectRoot) {
    const stack = {
        framework: null,
        language: 'javascript',
        styling: null,
        database: null,
        auth: null,
        testing: null,
        deployment: null,
        packageManager: 'npm',
    };
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath))
        return stack;
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const allDeps = {
            ...pkg['dependencies'],
            ...pkg['devDependencies'],
        };
        // Language
        if (allDeps['typescript'] || fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
            stack.language = 'typescript';
        }
        // Framework
        if (allDeps['next'])
            stack.framework = 'nextjs';
        else if (allDeps['nuxt'])
            stack.framework = 'nuxt';
        else if (allDeps['@sveltejs/kit'])
            stack.framework = 'sveltekit';
        else if (allDeps['astro'])
            stack.framework = 'astro';
        else if (allDeps['vite'])
            stack.framework = 'vite';
        else if (allDeps['react-scripts'])
            stack.framework = 'cra';
        else if (allDeps['express'])
            stack.framework = 'express';
        else if (allDeps['fastify'])
            stack.framework = 'fastify';
        else if (allDeps['hono'])
            stack.framework = 'hono';
        else if (allDeps['expo'])
            stack.framework = 'expo';
        // Styling
        if (allDeps['tailwindcss'])
            stack.styling = 'tailwind';
        else if (allDeps['styled-components'])
            stack.styling = 'styled-components';
        else if (allDeps['@emotion/react'])
            stack.styling = 'emotion';
        // Database
        if (allDeps['@supabase/supabase-js'])
            stack.database = 'supabase';
        else if (allDeps['prisma'] || allDeps['@prisma/client'])
            stack.database = 'prisma';
        else if (allDeps['drizzle-orm'])
            stack.database = 'drizzle';
        else if (allDeps['mongoose'])
            stack.database = 'mongodb';
        else if (allDeps['firebase'])
            stack.database = 'firebase';
        // Auth
        if (allDeps['next-auth'] || allDeps['@auth/core'])
            stack.auth = 'authjs';
        else if (allDeps['@clerk/nextjs'])
            stack.auth = 'clerk';
        else if (allDeps['@supabase/auth-helpers-nextjs'])
            stack.auth = 'supabase-auth';
        // Testing
        if (allDeps['vitest'])
            stack.testing = 'vitest';
        else if (allDeps['jest'])
            stack.testing = 'jest';
        else if (allDeps['@playwright/test'])
            stack.testing = 'playwright';
        else if (allDeps['mocha'])
            stack.testing = 'mocha';
        // Package manager
        if (fs.existsSync(path.join(projectRoot, 'bun.lockb')))
            stack.packageManager = 'bun';
        else if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml')))
            stack.packageManager = 'pnpm';
        else if (fs.existsSync(path.join(projectRoot, 'yarn.lock')))
            stack.packageManager = 'yarn';
        // Deployment
        if (fs.existsSync(path.join(projectRoot, 'vercel.json')) || fs.existsSync(path.join(projectRoot, 'vercel.ts'))) {
            stack.deployment = 'vercel';
        }
        else if (fs.existsSync(path.join(projectRoot, 'netlify.toml'))) {
            stack.deployment = 'netlify';
        }
        else if (fs.existsSync(path.join(projectRoot, 'Dockerfile'))) {
            stack.deployment = 'docker';
        }
        return stack;
    }
    catch {
        return stack;
    }
}
/**
 * Finds the build command from package.json scripts.
 */
function findBuildCommand(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath))
        return null;
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg['scripts'];
        if (!scripts)
            return null;
        // Priority order
        if (scripts['build'])
            return `${getRunner(projectRoot)} run build`;
        if (scripts['compile'])
            return `${getRunner(projectRoot)} run compile`;
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Finds the test command from package.json scripts.
 */
function findTestCommand(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath))
        return null;
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg['scripts'];
        if (scripts?.['test'] && !scripts['test'].includes('no test specified')) {
            return `${getRunner(projectRoot)} test`;
        }
        // Try direct invocations
        const allDeps = {
            ...pkg['dependencies'],
            ...pkg['devDependencies'],
        };
        if (allDeps['vitest'])
            return 'npx vitest run';
        if (allDeps['jest'])
            return 'npx jest';
        if (allDeps['@playwright/test'])
            return 'npx playwright test';
        return null;
    }
    catch {
        return null;
    }
}
function getRunner(projectRoot) {
    if (fs.existsSync(path.join(projectRoot, 'bun.lockb')))
        return 'bun';
    if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml')))
        return 'pnpm';
    if (fs.existsSync(path.join(projectRoot, 'yarn.lock')))
        return 'yarn';
    return 'npm';
}
/**
 * Reads .preflight/report.json if it exists. Returns null if missing or invalid.
 */
function readPreflightReport(projectRoot) {
    const reportPath = path.join(projectRoot, '.preflight', 'report.json');
    if (!fs.existsSync(reportPath))
        return null;
    try {
        const raw = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        const security = raw['security'];
        const health = raw['health'];
        const readiness = raw['readiness'];
        // Collect files mentioned in security findings
        const flaggedFiles = new Set();
        for (const finding of [...(security?.critical ?? []), ...(security?.warnings ?? [])]) {
            const f = finding.file;
            if (f)
                flaggedFiles.add(f);
        }
        // Collect failing health metrics and readiness checks
        const failingChecks = new Set();
        for (const m of health?.metrics ?? []) {
            if (m.status === 'FAIL' || m.status === 'WARN')
                failingChecks.add(m.name.toLowerCase());
        }
        for (const c of readiness?.checks ?? []) {
            if (!c.passed)
                failingChecks.add(c.name.toLowerCase());
        }
        return { flaggedFiles, failingChecks, hasCritical: (security?.critical?.length ?? 0) > 0 };
    }
    catch {
        return null;
    }
}
/**
 * Identifies high-risk areas in the codebase for the QA plan.
 * If .preflight/report.json exists, uses it to boost areas with known issues
 * and deprioritize areas preflight found clean.
 */
function identifyHighRiskAreas(projectRoot) {
    const areas = [];
    const preflight = readPreflightReport(projectRoot);
    // Auth files
    const authFiles = findFiles(projectRoot, ['auth', 'login', 'signup', 'session', 'middleware']);
    if (authFiles.length > 0) {
        areas.push({
            area: 'Authentication & Authorization',
            priority: 1,
            files: authFiles,
            description: 'Auth flows, session management, middleware guards, token handling',
            riskLevel: 'critical',
        });
    }
    // API routes
    const apiFiles = findFiles(projectRoot, ['api/', 'routes/', 'endpoint', 'handler']);
    if (apiFiles.length > 0) {
        areas.push({
            area: 'API Routes & Handlers',
            priority: 2,
            files: apiFiles,
            description: 'Input validation, error handling, response formats, auth checks',
            riskLevel: 'high',
        });
    }
    // Database/data layer
    const dbFiles = findFiles(projectRoot, ['schema', 'model', 'migration', 'query', 'prisma', 'drizzle']);
    if (dbFiles.length > 0) {
        areas.push({
            area: 'Database & Data Layer',
            priority: 3,
            files: dbFiles,
            description: 'Schema integrity, query safety, migration correctness',
            riskLevel: 'high',
        });
    }
    // Payment/billing
    const paymentFiles = findFiles(projectRoot, ['payment', 'billing', 'stripe', 'subscription', 'checkout']);
    if (paymentFiles.length > 0) {
        areas.push({
            area: 'Payments & Billing',
            priority: 1,
            files: paymentFiles,
            description: 'Payment flows, webhook handling, subscription state',
            riskLevel: 'critical',
        });
    }
    // Forms and user input
    const formFiles = findFiles(projectRoot, ['form', 'input', 'validation', 'sanitize']);
    if (formFiles.length > 0) {
        areas.push({
            area: 'Forms & User Input',
            priority: 4,
            files: formFiles,
            description: 'Validation, sanitization, error messages, accessibility',
            riskLevel: 'medium',
        });
    }
    // Error handling
    const errorFiles = findFiles(projectRoot, ['error', 'not-found', '404', '500', 'fallback']);
    if (errorFiles.length > 0) {
        areas.push({
            area: 'Error Handling & Edge Cases',
            priority: 5,
            files: errorFiles,
            description: 'Error boundaries, 404/500 pages, loading states, empty states',
            riskLevel: 'medium',
        });
    }
    // If we found nothing specific, add generic code quality
    if (areas.length === 0) {
        areas.push({
            area: 'General Code Quality',
            priority: 1,
            files: [],
            description: 'Type safety, error handling, null checks, async patterns',
            riskLevel: 'medium',
        });
    }
    // Apply preflight findings to reprioritize
    if (preflight) {
        for (const area of areas) {
            const hasPreflightHit = area.files.some(f => preflight.flaggedFiles.has(f));
            if (hasPreflightHit) {
                // Boost: preflight found issues in files this area covers
                area.priority = Math.max(0, area.priority - 1);
                area.description += ' [preflight: issues detected]';
            }
            else if (area.files.length > 0 && preflight.flaggedFiles.size > 0) {
                // Deprioritize: preflight scanned and found no issues in these files
                area.priority += 2;
                area.description += ' [preflight: clean]';
            }
        }
    }
    return areas.sort((a, b) => a.priority - b.priority);
}
/**
 * Simple file finder by keyword matching in paths.
 */
function findFiles(projectRoot, keywords) {
    const results = [];
    const srcDir = path.join(projectRoot, 'src');
    const appDir = path.join(projectRoot, 'app');
    const searchDirs = [srcDir, appDir, projectRoot];
    for (const dir of searchDirs) {
        if (!fs.existsSync(dir))
            continue;
        walkDir(dir, (filePath) => {
            const rel = path.relative(projectRoot, filePath).replace(/\\/g, '/');
            if (rel.includes('node_modules') || rel.includes('.git') || rel.includes('dist'))
                return;
            if (!/\.(ts|tsx|js|jsx)$/.test(rel))
                return;
            const lower = rel.toLowerCase();
            for (const kw of keywords) {
                if (lower.includes(kw.toLowerCase())) {
                    results.push(rel);
                    return;
                }
            }
        });
        if (results.length > 0)
            break;
    }
    return [...new Set(results)].slice(0, 30);
}
function walkDir(dir, callback, depth = 0) {
    if (depth > 5)
        return; // Max depth to avoid huge trees
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                walkDir(full, callback, depth + 1);
            }
            else if (entry.isFile()) {
                callback(full);
            }
        }
    }
    catch {
        // Skip unreadable dirs
    }
}
/**
 * Generates a complete SheepConfig from auto-detection.
 */
function autoConfig(projectRoot) {
    // Check if CLAUDE.md disallows auto-commits
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    let allowCommits = true;
    if (fs.existsSync(claudeMdPath)) {
        const content = fs.readFileSync(claudeMdPath, 'utf-8').toLowerCase();
        if (content.includes('no auto-commit') || content.includes('no autocommit')) {
            allowCommits = false;
        }
    }
    return {
        projectRoot,
        buildCommand: findBuildCommand(projectRoot),
        testCommand: findTestCommand(projectRoot),
        stack: detectStack(projectRoot),
        maxCycles: 20,
        allowCommits,
    };
}
/**
 * Generates the QA plan as markdown.
 */
function generateQAPlan(config) {
    const areas = identifyHighRiskAreas(config.projectRoot);
    const lines = [
        `# SheepCalledShip QA Plan: ${path.basename(config.projectRoot)}`,
        `## Auto-generated: ${new Date().toISOString()}`,
        `## Stack: ${config.stack.framework ?? 'unknown'} (${config.stack.language})`,
        `## Build: ${config.buildCommand ?? 'not detected'}`,
        `## Test: ${config.testCommand ?? 'no test suite detected'}`,
        '',
        '## Priority Areas (ordered by risk)',
        '',
    ];
    for (let i = 0; i < areas.length; i++) {
        const area = areas[i];
        lines.push(`### Cycle ${i * 2 + 1}-${i * 2 + 2}: ${area.area} [${area.riskLevel}]`);
        lines.push(area.description);
        if (area.files.length > 0) {
            lines.push('Files:');
            for (const f of area.files.slice(0, 10)) {
                lines.push(`- ${f}`);
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=auto-config.js.map