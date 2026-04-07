"use strict";
// API Mapper: scans for API routes, Edge Functions, server actions.
// Produces an API_MAP.md with endpoint table and security flags.
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
exports.mapApiEndpoints = mapApiEndpoints;
exports.formatApiMap = formatApiMap;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Scans the project for all API endpoints.
 */
function mapApiEndpoints(projectRoot) {
    const endpoints = [];
    // Next.js App Router API routes
    for (const base of ['src/app/api', 'app/api']) {
        const apiDir = path.join(projectRoot, base);
        if (fs.existsSync(apiDir)) {
            endpoints.push(...scanNextAppRoutes(apiDir, base, projectRoot));
        }
    }
    // Next.js Pages Router API routes
    for (const base of ['src/pages/api', 'pages/api']) {
        const apiDir = path.join(projectRoot, base);
        if (fs.existsSync(apiDir)) {
            endpoints.push(...scanNextPagesRoutes(apiDir, base, projectRoot));
        }
    }
    // Supabase Edge Functions
    const fnDir = path.join(projectRoot, 'supabase', 'functions');
    if (fs.existsSync(fnDir)) {
        endpoints.push(...scanEdgeFunctions(fnDir, projectRoot));
    }
    return endpoints;
}
/**
 * Generates API_MAP.md content from endpoints.
 */
function formatApiMap(endpoints) {
    if (endpoints.length === 0)
        return '# API Map\n\nNo API endpoints detected.';
    const lines = ['# API Map', ''];
    // Group by type
    const edgeFns = endpoints.filter(e => e.file.includes('supabase/functions'));
    const apiRoutes = endpoints.filter(e => !e.file.includes('supabase/functions'));
    if (edgeFns.length > 0) {
        lines.push('## Edge Functions (Supabase)', '');
        lines.push('| Endpoint | Method | Auth | Purpose | File |');
        lines.push('|----------|--------|------|---------|------|');
        for (const e of edgeFns)
            lines.push(`| ${e.path} | ${e.method} | ${e.auth} | ${e.purpose} | ${e.file} |`);
        lines.push('');
    }
    if (apiRoutes.length > 0) {
        lines.push('## API Routes', '');
        lines.push('| Route | Method | Auth | Purpose | File |');
        lines.push('|-------|--------|------|---------|------|');
        for (const e of apiRoutes)
            lines.push(`| ${e.path} | ${e.method} | ${e.auth} | ${e.purpose} | ${e.file} |`);
        lines.push('');
    }
    // Flag unprotected endpoints
    const unprotected = endpoints.filter(e => e.auth === 'none');
    if (unprotected.length > 0) {
        lines.push('## Unprotected Endpoints', '');
        for (const e of unprotected)
            lines.push(`- ${e.method} ${e.path} (${e.file})`);
        lines.push('');
    }
    return lines.join('\n');
}
function scanNextAppRoutes(dir, _basePath, projectRoot) {
    const endpoints = [];
    function walk(d, routePath) {
        try {
            const entries = fs.readdirSync(d, { withFileTypes: true });
            for (const entry of entries) {
                const full = path.join(d, entry.name);
                if (entry.isDirectory()) {
                    walk(full, `${routePath}/${entry.name}`);
                }
                else if (/^route\.(ts|js)$/.test(entry.name)) {
                    const content = fs.readFileSync(full, 'utf-8');
                    const methods = detectHttpMethods(content);
                    const auth = detectAuth(content);
                    const relPath = path.relative(projectRoot, full).replace(/\\/g, '/');
                    for (const method of methods) {
                        endpoints.push({
                            path: `/api${routePath}`,
                            method,
                            auth,
                            purpose: guessPurpose(routePath, method),
                            file: relPath,
                        });
                    }
                }
            }
        }
        catch { }
    }
    walk(dir, '');
    return endpoints;
}
function scanNextPagesRoutes(dir, _basePath, projectRoot) {
    const endpoints = [];
    function walk(d, routePath) {
        try {
            const entries = fs.readdirSync(d, { withFileTypes: true });
            for (const entry of entries) {
                const full = path.join(d, entry.name);
                if (entry.isDirectory()) {
                    walk(full, `${routePath}/${entry.name}`);
                }
                else if (/\.(ts|js)$/.test(entry.name) && !entry.name.startsWith('_')) {
                    const name = entry.name.replace(/\.(ts|js)$/, '');
                    const relPath = path.relative(projectRoot, full).replace(/\\/g, '/');
                    endpoints.push({
                        path: `/api${routePath}/${name === 'index' ? '' : name}`,
                        method: 'ALL',
                        auth: 'unknown',
                        purpose: guessPurpose(`${routePath}/${name}`, 'ALL'),
                        file: relPath,
                    });
                }
            }
        }
        catch { }
    }
    walk(dir, '');
    return endpoints;
}
function scanEdgeFunctions(dir, projectRoot) {
    const endpoints = [];
    try {
        const fns = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory());
        for (const fn of fns) {
            const indexPath = path.join(dir, fn.name, 'index.ts');
            if (!fs.existsSync(indexPath))
                continue;
            const content = fs.readFileSync(indexPath, 'utf-8');
            const auth = detectAuth(content);
            const relPath = path.relative(projectRoot, indexPath).replace(/\\/g, '/');
            endpoints.push({
                path: fn.name,
                method: 'POST',
                auth,
                purpose: guessPurpose(fn.name, 'POST'),
                file: relPath,
            });
        }
    }
    catch { }
    return endpoints;
}
function detectHttpMethods(content) {
    const methods = [];
    if (/export\s+(?:async\s+)?function\s+GET/m.test(content))
        methods.push('GET');
    if (/export\s+(?:async\s+)?function\s+POST/m.test(content))
        methods.push('POST');
    if (/export\s+(?:async\s+)?function\s+PUT/m.test(content))
        methods.push('PUT');
    if (/export\s+(?:async\s+)?function\s+PATCH/m.test(content))
        methods.push('PATCH');
    if (/export\s+(?:async\s+)?function\s+DELETE/m.test(content))
        methods.push('DELETE');
    return methods.length > 0 ? methods : ['ALL'];
}
function detectAuth(content) {
    if (/auth|session|token|jwt|bearer|getUser|getSession|clerk|supabase.*auth/i.test(content))
        return 'required';
    return 'none';
}
function guessPurpose(routePath, _method) {
    const lower = routePath.toLowerCase().replace(/[^a-z]/g, ' ').trim();
    if (!lower)
        return 'API endpoint';
    return lower.split(/\s+/).slice(-2).join(' ');
}
//# sourceMappingURL=api-mapper.js.map