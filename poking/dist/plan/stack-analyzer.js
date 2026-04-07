"use strict";
// Plan Mode Stack Analyzer: detects the project's tech stack from existing code.
// Reuses detection logic from sheep/auto-config but adds convention detection.
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
exports.analyzeStack = analyzeStack;
exports.detectConventions = detectConventions;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Detects the full project stack from package.json, config files, and code patterns.
 */
function analyzeStack(projectRoot) {
    const stack = {
        framework: null,
        language: 'javascript',
        styling: null,
        database: null,
        auth: null,
        testing: null,
        deployment: null,
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
        if (allDeps['typescript'] || fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
            stack.language = 'typescript';
        }
        if (allDeps['next'])
            stack.framework = 'nextjs';
        else if (allDeps['nuxt'])
            stack.framework = 'nuxt';
        else if (allDeps['@sveltejs/kit'])
            stack.framework = 'sveltekit';
        else if (allDeps['astro'])
            stack.framework = 'astro';
        else if (allDeps['vite'] && allDeps['react'])
            stack.framework = 'vite-react';
        else if (allDeps['vite'] && allDeps['vue'])
            stack.framework = 'vite-vue';
        else if (allDeps['vite'])
            stack.framework = 'vite';
        else if (allDeps['express'])
            stack.framework = 'express';
        else if (allDeps['hono'])
            stack.framework = 'hono';
        else if (allDeps['expo'])
            stack.framework = 'expo';
        if (allDeps['tailwindcss'])
            stack.styling = 'tailwind';
        else if (allDeps['styled-components'])
            stack.styling = 'styled-components';
        else if (allDeps['@emotion/react'])
            stack.styling = 'emotion';
        if (allDeps['@supabase/supabase-js'])
            stack.database = 'supabase';
        else if (allDeps['@prisma/client'])
            stack.database = 'prisma';
        else if (allDeps['drizzle-orm'])
            stack.database = 'drizzle';
        else if (allDeps['mongoose'])
            stack.database = 'mongodb';
        if (allDeps['next-auth'] || allDeps['@auth/core'])
            stack.auth = 'authjs';
        else if (allDeps['@clerk/nextjs'])
            stack.auth = 'clerk';
        if (allDeps['vitest'])
            stack.testing = 'vitest';
        else if (allDeps['jest'])
            stack.testing = 'jest';
        else if (allDeps['@playwright/test'])
            stack.testing = 'playwright';
        if (fs.existsSync(path.join(projectRoot, 'vercel.json')))
            stack.deployment = 'vercel';
        else if (fs.existsSync(path.join(projectRoot, 'Dockerfile')))
            stack.deployment = 'docker';
        return stack;
    }
    catch {
        return stack;
    }
}
/**
 * Detects coding conventions from existing source files.
 */
function detectConventions(projectRoot) {
    const conventions = {
        indentation: 'spaces-2',
        quotes: 'single',
        semicolons: true,
        namingStyle: 'camelCase',
        importStyle: 'named',
        stateManagement: null,
    };
    // Find a sample source file
    const sampleFile = findSampleFile(projectRoot);
    if (!sampleFile)
        return conventions;
    try {
        const content = fs.readFileSync(sampleFile, 'utf-8');
        const lines = content.split('\n');
        // Indentation
        const indentedLines = lines.filter(l => /^\s+\S/.test(l));
        if (indentedLines.length > 0) {
            const tabCount = indentedLines.filter(l => l.startsWith('\t')).length;
            const space4Count = indentedLines.filter(l => /^    \S/.test(l)).length;
            if (tabCount > indentedLines.length / 2)
                conventions.indentation = 'tabs';
            else if (space4Count > indentedLines.length / 3)
                conventions.indentation = 'spaces-4';
        }
        // Quotes
        const singleCount = (content.match(/'/g) ?? []).length;
        const doubleCount = (content.match(/"/g) ?? []).length;
        if (doubleCount > singleCount * 1.5)
            conventions.quotes = 'double';
        // Semicolons
        const statementsWithSemi = (content.match(/;\s*$/gm) ?? []).length;
        const statementsWithoutSemi = lines.filter(l => /\S$/.test(l.trim()) && !/[{},;]$/.test(l.trim())).length;
        if (statementsWithoutSemi > statementsWithSemi)
            conventions.semicolons = false;
        // State management
        const pkgPath = path.join(projectRoot, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            const deps = pkg['dependencies'];
            if (deps?.['zustand'])
                conventions.stateManagement = 'zustand';
            else if (deps?.['@reduxjs/toolkit'])
                conventions.stateManagement = 'redux-toolkit';
            else if (deps?.['jotai'])
                conventions.stateManagement = 'jotai';
            else if (deps?.['recoil'])
                conventions.stateManagement = 'recoil';
        }
        return conventions;
    }
    catch {
        return conventions;
    }
}
function findSampleFile(projectRoot) {
    const candidates = [
        path.join(projectRoot, 'src', 'app', 'page.tsx'),
        path.join(projectRoot, 'src', 'App.tsx'),
        path.join(projectRoot, 'app', 'page.tsx'),
        path.join(projectRoot, 'src', 'index.ts'),
        path.join(projectRoot, 'src', 'main.ts'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate))
            return candidate;
    }
    // Find any .ts or .tsx in src
    const srcDir = path.join(projectRoot, 'src');
    if (fs.existsSync(srcDir)) {
        try {
            const files = fs.readdirSync(srcDir);
            const tsFile = files.find(f => /\.(ts|tsx)$/.test(f));
            if (tsFile)
                return path.join(srcDir, tsFile);
        }
        catch { }
    }
    return null;
}
//# sourceMappingURL=stack-analyzer.js.map