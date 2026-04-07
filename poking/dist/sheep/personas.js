"use strict";
// SheepCalledShip Personas: generates character commentary for the narrative.
// deezeebalz99 (code reviewer), Martha (beta tester), Sheep (narrator).
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeezeebalzRoast = generateDeezeebalzRoast;
exports.generateMarthaMessage = generateMarthaMessage;
exports.generateSheepMonologue = generateSheepMonologue;
/**
 * deezeebalz99: Reddit mod, Arch Linux user, never shipped production code.
 * Reviews every fix with concentrated condescension.
 */
function generateDeezeebalzRoast(bug) {
    const roasts = [];
    if (bug.severity === 'critical') {
        roasts.push(`oh you deployed THIS to production? bold move. i've seen better error handling in a 2am hackathon project written in brainfuck.`, `this is what happens when you skip code review. which clearly you do. every time.`, `i would say "rewrite it in Rust" but honestly even C would be an improvement here.`);
    }
    else if (bug.severity === 'high') {
        roasts.push(`classic. you probably also don't use semicolons and think that makes you cool.`, `btw I run Arch. this would never happen on my machine because I actually read documentation.`, `have you considered that maybe, just maybe, types exist for a reason?`);
    }
    else {
        roasts.push(`technically it works but so does a car with three wheels if you drive slow enough.`, `not the worst thing I've reviewed today but the bar was already underground.`, `I mean... it compiles. that's the best thing I can say about it.`);
    }
    return roasts[Math.floor(Math.random() * roasts.length)];
}
/**
 * Martha: sweet elderly lady testing your app with one finger and pure confusion.
 * Reveals genuine UX problems.
 */
function generateMarthaMessage(area, issue) {
    const messages = [];
    if (area.toLowerCase().includes('form') || area.toLowerCase().includes('input')) {
        messages.push(`"I typed my name but then the little tornado started spinning and it won't stop. Is the internet broken again?"`, `"It says 'invalid email' but I typed my email exactly how Dr. Phil taught me. With the little a-circle thing."`, `"Where's the send button? I pressed Enter like my grandson told me but nothing happened."`);
    }
    else if (area.toLowerCase().includes('auth') || area.toLowerCase().includes('login')) {
        messages.push(`"I clicked 'Sign In' but it took me to a page with just... nothing. Is this a virus?"`, `"It says my password is wrong but I've been using 'password123' since 2004 and it always works."`, `"I don't understand why I need to prove I'm not a robot. I'm clearly not a robot. I can barely use this phone."`);
    }
    else if (area.toLowerCase().includes('nav') || area.toLowerCase().includes('layout')) {
        messages.push(`"I pressed the back button but now I'm somewhere I've never been before. Where's the home page?"`, `"All the words are overlapping each other on my phone. Should I turn it sideways?"`, `"I can't find the electronic mail button. Is it hidden somewhere?"`);
    }
    else if (area.toLowerCase().includes('error') || area.toLowerCase().includes('404')) {
        messages.push(`"It says 'Something went wrong.' Well YES I can SEE that. But what do I DO about it?"`, `"There's a number... 404? Is that a phone number? Should I call someone?"`, `"The page is blank. I waited ten minutes. Should I keep waiting?"`);
    }
    else {
        messages.push(`"My grandson said this website is 'clean.' I think he means there aren't enough buttons."`, `"I clicked the three little lines in the corner and a menu appeared! But then it disappeared. Where did it go?"`, `"Everything looks very modern but I don't know where to click first. There's no instructions."`);
    }
    const base = messages[Math.floor(Math.random() * messages.length)];
    return issue ? `${base}\n[Martha exposed: ${issue}]` : base;
}
/**
 * Sheep: the narrator. Existential. Dramatic. Occasionally beautiful.
 */
function generateSheepMonologue(cycleNumber, bugsFound, area) {
    const monologues = [];
    if (cycleNumber === 1) {
        monologues.push(`I wandered into the codebase like a sheep into a field. It looked peaceful. Green. Orderly. Then I looked closer at the auth middleware and saw the wolf.`, `Day one. The code smells like coffee and optimism. Both will be gone by morning.`);
    }
    else if (bugsFound === 0) {
        monologues.push(`Nothing. Cycle ${cycleNumber} and ${area} is clean. I am suspicious. Clean code is like a quiet forest. Either nothing lives here, or something is hiding very well.`, `Zero bugs in ${area}. The code is good. I feel... empty. What is a sheep without a bug to hunt?`);
    }
    else if (bugsFound >= 3) {
        monologues.push(`${bugsFound} bugs. In one area. ${area} is not a module, it is a crime scene. I document the evidence. I do not judge. (I judge.)`, `I found ${bugsFound} bugs in ${area}. Each one a small betrayal of the user's trust. I fix them one by one, like pulling thorns from wool.`);
    }
    else {
        monologues.push(`${bugsFound} bug${bugsFound > 1 ? 's' : ''} in ${area}. Not catastrophic. Not clean. Just... human. The code was written at 2am. I can tell.`, `Cycle ${cycleNumber}. ${area}. The bugs are getting smaller. Either the codebase is getting better, or I'm getting tired.`);
    }
    return monologues[Math.floor(Math.random() * monologues.length)];
}
//# sourceMappingURL=personas.js.map