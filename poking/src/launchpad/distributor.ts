// Launchpad Distributor: generates distribution drafts for multiple platforms.
// Uses Linkraft MCPs if available, generates local drafts otherwise.
// Does NOT post automatically: all drafts are for human review.

import * as fs from 'fs';
import * as path from 'path';
import type { LaunchBrief, DistributionDraft } from './types.js';

const PLATFORMS = ['linkedin', 'twitter', 'producthunt', 'reddit', 'email'] as const;

/**
 * Generates a distribution draft for LinkedIn.
 */
function generateLinkedInDraft(brief: LaunchBrief): DistributionDraft {
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
function generateTwitterDraft(brief: LaunchBrief): DistributionDraft {
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
function generateProductHuntDraft(brief: LaunchBrief): DistributionDraft {
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
function generateRedditDraft(brief: LaunchBrief): DistributionDraft {
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
function generateEmailDraft(brief: LaunchBrief): DistributionDraft {
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

const GENERATORS: Record<string, (brief: LaunchBrief) => DistributionDraft> = {
  linkedin: generateLinkedInDraft,
  twitter: generateTwitterDraft,
  producthunt: generateProductHuntDraft,
  reddit: generateRedditDraft,
  email: generateEmailDraft,
};

/**
 * Generates distribution drafts for all platforms.
 */
export function generateAllDrafts(brief: LaunchBrief): DistributionDraft[] {
  return PLATFORMS.map(p => GENERATORS[p]!(brief));
}

/**
 * Generates a draft for a specific platform.
 */
export function generateDraft(brief: LaunchBrief, platform: string): DistributionDraft | null {
  const generator = GENERATORS[platform];
  if (!generator) return null;
  return generator(brief);
}

/**
 * Writes all drafts to .launchpad/distribution/ directory.
 */
export function writeDrafts(projectRoot: string, drafts: DistributionDraft[]): string[] {
  const dir = path.join(projectRoot, '.launchpad', 'distribution');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const files: string[] = [];
  for (const draft of drafts) {
    const filePath = path.join(dir, `${draft.platform}.md`);
    fs.writeFileSync(filePath, draft.content, 'utf-8');
    files.push(`distribution/${draft.platform}.md`);
  }

  return files;
}
