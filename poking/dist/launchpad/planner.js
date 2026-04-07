"use strict";
// Launchpad Planner: generates planning documents for a landing page.
// Creates .launchpad/ directory with brief, research, copy, wireframe, SEO configs.
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
exports.initPlanningDir = initPlanningDir;
exports.generateBrief = generateBrief;
exports.generateDefaultWireframe = generateDefaultWireframe;
exports.generateSEOConfig = generateSEOConfig;
exports.generateDefaultCopy = generateDefaultCopy;
exports.writePlanningFiles = writePlanningFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LAUNCHPAD_DIR = '.launchpad';
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Creates the planning directory structure.
 */
function initPlanningDir(projectRoot) {
    const dir = path.join(projectRoot, LAUNCHPAD_DIR);
    ensureDir(dir);
    return dir;
}
/**
 * Generates a brief document from the product description.
 */
function generateBrief(brief) {
    return [
        `# Launch Brief: ${brief.productName}`,
        '',
        `## Product`,
        brief.productDescription,
        '',
        `## Target Audience`,
        brief.targetAudience,
        '',
        `## Unique Value Proposition`,
        brief.uniqueValue,
        '',
        `## Tone`,
        brief.tone,
    ].join('\n');
}
/**
 * Generates a default wireframe for a landing page.
 */
function generateDefaultWireframe() {
    const sections = [
        { name: 'Hero', type: 'hero', description: 'Headline, subheadline, primary CTA, hero image/illustration', order: 1 },
        { name: 'Social Proof', type: 'custom', description: 'Logo bar of clients/press/partners', order: 2 },
        { name: 'Features', type: 'features', description: '3-4 key features with icons and descriptions', order: 3 },
        { name: 'Testimonials', type: 'testimonials', description: '2-3 customer quotes with photos and roles', order: 4 },
        { name: 'CTA', type: 'cta', description: 'Repeated primary CTA with urgency/benefit copy', order: 5 },
        { name: 'FAQ', type: 'faq', description: '4-6 frequently asked questions', order: 6 },
        { name: 'Footer', type: 'footer', description: 'Links, social media, legal, newsletter signup', order: 7 },
    ];
    return { sections };
}
/**
 * Generates default SEO configuration from brief.
 */
function generateSEOConfig(brief) {
    const title = `${brief.productName} - ${brief.uniqueValue}`;
    const description = brief.productDescription.slice(0, 160);
    return {
        title,
        description,
        ogTitle: title,
        ogDescription: description,
        ogImage: null,
        keywords: brief.productName.toLowerCase().split(/\s+/),
        schema: {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: brief.productName,
            description: brief.productDescription,
        },
    };
}
/**
 * Generates default page copy structure from brief.
 */
function generateDefaultCopy(brief) {
    return {
        headline: brief.uniqueValue,
        subheadline: brief.productDescription,
        features: [
            { title: 'Feature 1', description: '[Describe key feature]', icon: null },
            { title: 'Feature 2', description: '[Describe key feature]', icon: null },
            { title: 'Feature 3', description: '[Describe key feature]', icon: null },
        ],
        testimonials: [
            { quote: '[Customer testimonial]', author: '[Name]', role: '[Role at Company]' },
        ],
        ctaPrimary: 'Get Started',
        ctaSecondary: 'Learn More',
        footerText: `© ${new Date().getFullYear()} ${brief.productName}. All rights reserved.`,
    };
}
/**
 * Writes all planning files to the .launchpad directory.
 */
function writePlanningFiles(projectRoot, brief) {
    const dir = initPlanningDir(projectRoot);
    const files = [];
    // Brief
    const briefPath = path.join(dir, 'brief.md');
    fs.writeFileSync(briefPath, generateBrief(brief), 'utf-8');
    files.push('brief.md');
    // Wireframe
    const wireframe = generateDefaultWireframe();
    const wireframePath = path.join(dir, 'wireframe.json');
    fs.writeFileSync(wireframePath, JSON.stringify(wireframe, null, 2), 'utf-8');
    files.push('wireframe.json');
    // SEO
    const seo = generateSEOConfig(brief);
    const seoPath = path.join(dir, 'seo.json');
    fs.writeFileSync(seoPath, JSON.stringify(seo, null, 2), 'utf-8');
    files.push('seo.json');
    // Copy
    const copy = generateDefaultCopy(brief);
    const copyPath = path.join(dir, 'copy.json');
    fs.writeFileSync(copyPath, JSON.stringify(copy, null, 2), 'utf-8');
    files.push('copy.json');
    return { dir, files };
}
//# sourceMappingURL=planner.js.map