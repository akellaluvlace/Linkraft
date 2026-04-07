export interface MonetizationContext {
    projectName: string;
    projectDescription: string;
    productType: string;
    hasStripe: boolean;
    hasPaymentDep: boolean;
    competitorContent: string | null;
    pricingIndicators: string[];
}
export declare function collectMonetizationContext(projectRoot: string): MonetizationContext;
export declare function generateMonetizationTemplate(ctx: MonetizationContext): string;
export declare function writeMonetization(projectRoot: string, content: string): string;
