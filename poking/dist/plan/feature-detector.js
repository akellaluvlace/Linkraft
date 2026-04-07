"use strict";
// Feature Detector: detects what kind of project this is and what plan outputs to generate.
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
exports.detectFeatures = detectFeatures;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Detects project features to determine which plan outputs are applicable.
 */
function detectFeatures(projectRoot) {
    return {
        hasDatabase: detectDatabase(projectRoot),
        hasApiRoutes: detectApiRoutes(projectRoot),
        hasMobileApp: detectMobileApp(projectRoot),
        hasDesignSystem: detectDesignSystem(projectRoot),
        isProduct: detectIsProduct(projectRoot),
        databaseType: detectDatabaseType(projectRoot),
    };
}
function detectDatabase(projectRoot) {
    return (fs.existsSync(path.join(projectRoot, 'prisma', 'schema.prisma')) ||
        fs.existsSync(path.join(projectRoot, 'drizzle.config.ts')) ||
        fs.existsSync(path.join(projectRoot, 'drizzle.config.js')) ||
        fs.existsSync(path.join(projectRoot, 'supabase', 'config.toml')) ||
        fs.existsSync(path.join(projectRoot, 'supabase', 'migrations')) ||
        hasDep(projectRoot, '@supabase/supabase-js') ||
        hasDep(projectRoot, '@prisma/client') ||
        hasDep(projectRoot, 'drizzle-orm') ||
        hasDep(projectRoot, 'mongoose'));
}
function detectDatabaseType(projectRoot) {
    if (hasDep(projectRoot, '@supabase/supabase-js') || fs.existsSync(path.join(projectRoot, 'supabase')))
        return 'supabase';
    if (hasDep(projectRoot, '@prisma/client') || fs.existsSync(path.join(projectRoot, 'prisma')))
        return 'prisma';
    if (hasDep(projectRoot, 'drizzle-orm'))
        return 'drizzle';
    if (hasDep(projectRoot, 'mongoose'))
        return 'mongodb';
    return null;
}
function detectApiRoutes(projectRoot) {
    return (fs.existsSync(path.join(projectRoot, 'src', 'app', 'api')) ||
        fs.existsSync(path.join(projectRoot, 'app', 'api')) ||
        fs.existsSync(path.join(projectRoot, 'src', 'pages', 'api')) ||
        fs.existsSync(path.join(projectRoot, 'pages', 'api')) ||
        fs.existsSync(path.join(projectRoot, 'supabase', 'functions')));
}
function detectMobileApp(projectRoot) {
    return (fs.existsSync(path.join(projectRoot, 'app.json')) ||
        fs.existsSync(path.join(projectRoot, 'eas.json')) ||
        hasDep(projectRoot, 'expo') ||
        hasDep(projectRoot, 'react-native'));
}
function detectDesignSystem(projectRoot) {
    return (hasDep(projectRoot, 'tailwindcss') ||
        fs.existsSync(path.join(projectRoot, 'tailwind.config.ts')) ||
        fs.existsSync(path.join(projectRoot, 'tailwind.config.js')) ||
        fs.existsSync(path.join(projectRoot, 'src', 'styles', 'tokens.ts')) ||
        fs.existsSync(path.join(projectRoot, 'src', 'theme.ts')));
}
function detectIsProduct(projectRoot) {
    // Products have landing pages, app store configs, or pricing pages
    return (fs.existsSync(path.join(projectRoot, 'app.json')) ||
        fs.existsSync(path.join(projectRoot, 'eas.json')) ||
        fs.existsSync(path.join(projectRoot, 'src', 'app', 'pricing')) ||
        fs.existsSync(path.join(projectRoot, 'app', 'pricing')) ||
        fs.existsSync(path.join(projectRoot, 'landing')) ||
        hasDep(projectRoot, 'stripe') ||
        hasDep(projectRoot, '@stripe/stripe-js'));
}
function hasDep(projectRoot, depName) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath))
        return false;
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const deps = pkg['dependencies'];
        const devDeps = pkg['devDependencies'];
        return !!(deps?.[depName] || devDeps?.[depName]);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=feature-detector.js.map