"use strict";
// Preflight Health Scanner: dead code, console.logs, TypeScript any,
// test coverage estimate, file complexity, TODO/FIXME counts.
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
exports.scanHealth = scanHealth;
const path = __importStar(require("path"));
const scanner_js_1 = require("../shared/scanner.js");
function scanHealth(projectRoot) {
    const sourceFiles = (0, scanner_js_1.collectSourceFiles)(projectRoot);
    const metrics = [];
    // 1. Console.log count
    let consoleLogs = 0;
    for (const sf of sourceFiles) {
        const content = (0, scanner_js_1.readFileSafe)(sf);
        if (!content)
            continue;
        const matches = content.match(/console\.(log|debug|info)\(/g);
        if (matches)
            consoleLogs += matches.length;
    }
    metrics.push({
        name: 'Console.logs',
        value: consoleLogs,
        status: consoleLogs === 0 ? 'PASS' : consoleLogs <= 5 ? 'WARN' : 'FAIL',
        detail: consoleLogs > 0 ? `${consoleLogs} console statements in production code` : null,
    });
    // 2. TypeScript any count
    let anyCount = 0;
    for (const sf of sourceFiles) {
        if (!/\.tsx?$/.test(sf))
            continue;
        const content = (0, scanner_js_1.readFileSafe)(sf);
        if (!content)
            continue;
        const matches = content.match(/:\s*any\b|as\s+any\b|<any>/g);
        if (matches)
            anyCount += matches.length;
    }
    metrics.push({
        name: 'TypeScript any',
        value: anyCount,
        status: anyCount === 0 ? 'PASS' : anyCount <= 3 ? 'WARN' : 'FAIL',
        detail: anyCount > 0 ? `${anyCount} uses of 'any' type` : null,
    });
    // 3. Test file count
    let testFiles = 0;
    (0, scanner_js_1.walkDir)(projectRoot, (fp) => {
        if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(fp))
            testFiles++;
    });
    const testRatio = sourceFiles.length > 0 ? testFiles / sourceFiles.length : 0;
    metrics.push({
        name: 'Test count',
        value: testFiles,
        status: testFiles === 0 ? 'FAIL' : testRatio < 0.1 ? 'LOW' : testRatio < 0.3 ? 'WARN' : 'PASS',
        detail: `${testFiles} test files for ${sourceFiles.length} source files (${Math.round(testRatio * 100)}%)`,
    });
    // 4. Largest file by line count
    let largestFile = '';
    let largestLines = 0;
    for (const sf of sourceFiles) {
        const content = (0, scanner_js_1.readFileSafe)(sf);
        if (!content)
            continue;
        const lineCount = content.split('\n').length;
        if (lineCount > largestLines) {
            largestLines = lineCount;
            largestFile = path.relative(projectRoot, sf).replace(/\\/g, '/');
        }
    }
    metrics.push({
        name: 'Largest file',
        value: `${largestLines} lines`,
        status: largestLines <= 300 ? 'PASS' : largestLines <= 500 ? 'WARN' : 'FAIL',
        detail: largestFile ? `${largestFile} (${largestLines} lines)` : null,
    });
    // 5. TODO/FIXME count
    let todoCount = 0;
    let fixmeCount = 0;
    for (const sf of sourceFiles) {
        const content = (0, scanner_js_1.readFileSafe)(sf);
        if (!content)
            continue;
        const todos = content.match(/\/\/\s*TODO/gi);
        const fixmes = content.match(/\/\/\s*FIXME/gi);
        if (todos)
            todoCount += todos.length;
        if (fixmes)
            fixmeCount += fixmes.length;
    }
    metrics.push({
        name: 'TODOs',
        value: todoCount,
        status: todoCount === 0 ? 'PASS' : todoCount <= 5 ? 'INFO' : 'WARN',
        detail: todoCount > 0 ? `${todoCount} TODOs remaining` : null,
    });
    metrics.push({
        name: 'FIXMEs',
        value: fixmeCount,
        status: fixmeCount === 0 ? 'PASS' : 'WARN',
        detail: fixmeCount > 0 ? `${fixmeCount} FIXMEs need attention` : null,
    });
    // 6. Empty catch blocks
    let emptyCatches = 0;
    for (const sf of sourceFiles) {
        const content = (0, scanner_js_1.readFileSafe)(sf);
        if (!content)
            continue;
        const matches = content.match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
        if (matches)
            emptyCatches += matches.length;
    }
    metrics.push({
        name: 'Empty catch blocks',
        value: emptyCatches,
        status: emptyCatches === 0 ? 'PASS' : 'WARN',
        detail: emptyCatches > 0 ? `${emptyCatches} swallowed errors` : null,
    });
    // 7. Source file count
    metrics.push({
        name: 'Source files',
        value: sourceFiles.length,
        status: 'INFO',
        detail: null,
    });
    // Score: weighted average
    const weights = {
        'PASS': 100, 'INFO': 80, 'LOW': 40, 'WARN': 30, 'FAIL': 0,
    };
    const scorable = metrics.filter(m => m.status !== 'INFO');
    const score = scorable.length > 0
        ? Math.round(scorable.reduce((sum, m) => sum + (weights[m.status] ?? 50), 0) / scorable.length)
        : 50;
    return { score, metrics };
}
//# sourceMappingURL=health-scanner.js.map