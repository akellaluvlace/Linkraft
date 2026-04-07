"use strict";
// SheepCalledShip Content Generator: creates social media content from QA results.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContentPack = generateContentPack;
exports.formatContentPack = formatContentPack;
/**
 * Generates a content pack from completed session stats.
 */
function generateContentPack(stats) {
    return {
        linkedinPost: generateLinkedInPost(stats),
        twitterThread: generateTwitterThread(stats),
        bestMarthaMessage: pickBest(stats.marthaMessages),
        bestDeezeebalzRoast: pickBest(stats.deezeebalzRoasts),
        bestSheepMonologue: pickBest(stats.sheepMonologues),
        statsForInfographic: {
            project: stats.project,
            cycles: stats.cycleCount,
            bugsFound: stats.bugs.discovered,
            bugsFixed: stats.bugs.autoFixed,
            bugsLogged: stats.bugs.logged,
            areasTested: stats.areas.tested.length,
            areasPassed: stats.areas.passed.length,
            runtime: `${stats.totalRuntimeMinutes}m`,
            commits: stats.commits,
        },
    };
}
function generateLinkedInPost(stats) {
    return [
        `I let an AI sheep loose on my codebase overnight.`,
        '',
        `It found ${stats.bugs.discovered} bugs. Fixed ${stats.bugs.autoFixed} automatically. Logged ${stats.bugs.logged} for me to review.`,
        '',
        `${stats.cycleCount} test cycles across ${stats.areas.tested.length} high-risk areas. ${stats.areas.passed.length} passed clean.`,
        '',
        stats.worstBug ? `Worst bug: ${stats.worstBug.description}` : '',
        stats.funniestBug ? `Funniest bug: ${stats.funniestBug.description}` : '',
        '',
        `The sheep is called SheepCalledShip. It's a Claude Code plugin that auto-configures itself from your codebase and hunts bugs while you sleep.`,
        '',
        `It also has a simulated elderly beta tester named Martha who tests your UX with one finger and genuine confusion. She found more real issues than the static analysis.`,
        '',
        `Open source. Free. /linkraft sheep`,
        '',
        '#ai #qa #claudecode #opensource',
    ].filter(l => l !== '').join('\n');
}
function generateTwitterThread(stats) {
    const thread = [];
    thread.push(`I let an AI sheep loose on my codebase overnight. Here's what happened. (thread)`);
    thread.push(`It scanned ${stats.areas.tested.length} high-risk areas and ran ${stats.cycleCount} QA cycles. No manual setup. It read my package.json and figured everything out.`);
    thread.push(`Found ${stats.bugs.discovered} bugs total. Fixed ${stats.bugs.autoFixed} automatically. Logged ${stats.bugs.logged} for human review.`);
    if (stats.worstBug) {
        thread.push(`The worst bug: ${stats.worstBug.description}`);
    }
    if (stats.marthaMessages.length > 0) {
        thread.push(`Best part: a simulated elderly beta tester named Martha tried to use each feature. ${stats.marthaMessages[0]}`);
    }
    if (stats.deezeebalzRoasts.length > 0) {
        thread.push(`Also a simulated code reviewer called deezeebalz99 who runs Arch and reviews everything: ${stats.deezeebalzRoasts[0]}`);
    }
    thread.push(`It's called SheepCalledShip. Open source Claude Code plugin. /linkraft sheep`);
    return thread;
}
function pickBest(items) {
    if (items.length === 0)
        return '(none this session)';
    // Pick the longest one (usually the most detailed/funny)
    return items.reduce((a, b) => a.length >= b.length ? a : b);
}
/**
 * Formats the content pack as a markdown file.
 */
function formatContentPack(pack) {
    const lines = [
        '# SheepCalledShip Content Pack',
        '',
        '## LinkedIn Post',
        '```',
        pack.linkedinPost,
        '```',
        '',
        '## Twitter/X Thread',
    ];
    for (let i = 0; i < pack.twitterThread.length; i++) {
        lines.push(`**${i + 1}/${pack.twitterThread.length}:** ${pack.twitterThread[i]}`);
    }
    lines.push('', '## Best Moments', '');
    lines.push(`**Martha:** ${pack.bestMarthaMessage}`);
    lines.push(`**deezeebalz99:** ${pack.bestDeezeebalzRoast}`);
    lines.push(`**Sheep:** ${pack.bestSheepMonologue}`);
    lines.push('');
    lines.push('## Stats for Infographic');
    for (const [k, v] of Object.entries(pack.statsForInfographic)) {
        lines.push(`- ${k}: ${v}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=content-gen.js.map