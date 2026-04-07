"use strict";
// Shared scanner utilities used by both Preflight and Sheep.
// Extracts common file-walking, pattern-matching, and project analysis.
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
exports.walkDir = walkDir;
exports.collectSourceFiles = collectSourceFiles;
exports.readFileSafe = readFileSafe;
exports.findFilesByKeyword = findFilesByKeyword;
exports.scanFileForPattern = scanFileForPattern;
exports.readDeps = readDeps;
exports.hasAuthCheck = hasAuthCheck;
exports.hasRateLimit = hasRateLimit;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Walks a directory tree, calling callback on each file.
 * Skips node_modules, .git, dist, .next, .plan, .sheep.
 */
function walkDir(dir, callback, depth = 0) {
    if (depth > 6)
        return;
    const skip = ['node_modules', '.git', 'dist', '.next', '.plan', '.sheep', '.turbo', '.cache', 'coverage'];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.env.example')
                continue;
            if (skip.includes(entry.name))
                continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walkDir(full, callback, depth + 1);
            }
            else if (entry.isFile()) {
                callback(full);
            }
        }
    }
    catch { }
}
/**
 * Collects all source files from a project (ts, tsx, js, jsx).
 */
function collectSourceFiles(projectRoot) {
    const files = [];
    walkDir(projectRoot, (fp) => {
        if (/\.(ts|tsx|js|jsx)$/.test(fp) && !fp.includes('.d.ts')) {
            files.push(fp);
        }
    });
    return files;
}
/**
 * Reads a file safely. Returns null on error.
 */
function readFileSafe(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
/**
 * Finds files matching keywords in their path.
 */
function findFilesByKeyword(projectRoot, keywords) {
    const results = [];
    walkDir(projectRoot, (fp) => {
        if (!/\.(ts|tsx|js|jsx)$/.test(fp))
            return;
        const rel = path.relative(projectRoot, fp).replace(/\\/g, '/');
        const lower = rel.toLowerCase();
        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) {
                results.push(rel);
                return;
            }
        }
    });
    return [...new Set(results)].slice(0, 50);
}
/**
 * Scans file content for a regex pattern. Returns matches with line numbers.
 */
function scanFileForPattern(filePath, pattern, description, severity, category) {
    const content = readFileSafe(filePath);
    if (!content)
        return [];
    const results = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
            results.push({
                file: filePath,
                line: i + 1,
                description,
                severity,
                category,
            });
        }
    }
    return results;
}
/**
 * Reads package.json dependencies.
 */
function readDeps(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath))
        return {};
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return {
            ...pkg['dependencies'],
            ...pkg['devDependencies'],
        };
    }
    catch {
        return {};
    }
}
/**
 * Checks if a route file has auth checks.
 */
function hasAuthCheck(content) {
    return /getSession|getServerSession|auth\(\)|getUser|requireAuth|isAuthenticated|withAuth|getToken|verifyToken|jwt\.verify|supabase\.auth/i.test(content);
}
/**
 * Checks if a route file has rate limiting.
 */
function hasRateLimit(content) {
    return /rateLimit|rateLimiter|throttle|RateLimiter|upstash.*ratelimit|@upstash\/ratelimit/i.test(content);
}
//# sourceMappingURL=scanner.js.map