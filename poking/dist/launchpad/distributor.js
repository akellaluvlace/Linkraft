"use strict";
// Launchpad Distributor: generates distribution drafts for multiple platforms.
// Uses Linkraft MCPs if available, generates local drafts otherwise.
// Does NOT post automatically: all drafts are for human review.
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
exports.generateAllDrafts = generateAllDrafts;
exports.generateDraft = generateDraft;
exports.writeDrafts = writeDrafts;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PLATFORMS = ['linkedin', 'twitter', 'producthunt', 'reddit', 'email'];
/**
 * Generates a distribution draft for LinkedIn.
 */
function generateLinkedInDraft(brief) {
    const content = [
        `Excited to announce ${brief.productName}!`,
        '',
        brief.uniqueValue,
        '',
        brief.productDescription,
        '',
        `Who is this for? ${brief.targetAudience}`,
        '',
        '#launch #product',
    ].join('\n');
    return { platform: 'linkedin', content, metadata: { type: 'post' } };
}
/**
 * Generates a distribution draft for Twitter/X.
 */
function generateTwitterDraft(brief) {
    const content = [
        `Launching ${brief.productName}`,
        '',
        brief.uniqueValue,
        '',
        `Built for ${brief.targetAudience}`,
    ].join('\n');
    return { platform: 'twitter', content: content.slice(0, 280), metadata: { type: 'tweet' } };
}
/**
 * Generates a Product Hunt launch draft.
 */
function generateProductHuntDraft(brief) {
    const content = [
        `# ${brief.productName}`,
        '',
        `## Tagline`,
        brief.uniqueValue,
        '',
        `## Description`,
        brief.productDescription,
        '',
        `## Who is it for?`,
        brief.targetAudience,
        '',
        `## What makes it different?`,
        brief.uniqueValue,
    ].join('\n');
    return { platform: 'producthunt', content, metadata: { type: 'launch' } };
}
/**
 * Generates a Reddit post draft.
 */
function generateRedditDraft(brief) {
    const content = [
        `I built ${brief.productName}: ${brief.uniqueValue}`,
        '',
        brief.productDescription,
        '',
        `Target audience: ${brief.targetAudience}`,
        '',
        'Would love feedback from the community.',
    ].join('\n');
    return { platform: 'reddit', content, metadata: { type: 'post', subreddit: '[appropriate subreddit]' } };
}
/**
 * Generates an email announcement draft.
 */
function generateEmailDraft(brief) {
    const content = [
        `Subject: Introducing ${brief.productName}`,
        '',
        `Hi,`,
        '',
        `${brief.uniqueValue}`,
        '',
        brief.productDescription,
        '',
        `[CTA Button: Try ${brief.productName}]`,
        '',
        `Best,`,
        `The ${brief.productName} team`,
    ].join('\n');
    return { platform: 'email', content, metadata: { type: 'announcement' } };
}
const GENERATORS = {
    linkedin: generateLinkedInDraft,
    twitter: generateTwitterDraft,
    producthunt: generateProductHuntDraft,
    reddit: generateRedditDraft,
    email: generateEmailDraft,
};
/**
 * Generates distribution drafts for all platforms.
 */
function generateAllDrafts(brief) {
    return PLATFORMS.map(p => GENERATORS[p](brief));
}
/**
 * Generates a draft for a specific platform.
 */
function generateDraft(brief, platform) {
    const generator = GENERATORS[platform];
    if (!generator)
        return null;
    return generator(brief);
}
/**
 * Writes all drafts to .launchpad/distribution/ directory.
 */
function writeDrafts(projectRoot, drafts) {
    const dir = path.join(projectRoot, '.launchpad', 'distribution');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const files = [];
    for (const draft of drafts) {
        const filePath = path.join(dir, `${draft.platform}.md`);
        fs.writeFileSync(filePath, draft.content, 'utf-8');
        files.push(`distribution/${draft.platform}.md`);
    }
    return files;
}
//# sourceMappingURL=distributor.js.map