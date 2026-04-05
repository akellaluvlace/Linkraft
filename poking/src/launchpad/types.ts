// Launchpad types: interfaces for the end-to-end landing page pipeline

export interface LaunchBrief {
  productName: string;
  productDescription: string;
  targetAudience: string;
  uniqueValue: string;
  tone: string;
}

export interface CompetitorAnalysis {
  competitors: CompetitorEntry[];
  gaps: string[];
  opportunities: string[];
}

export interface CompetitorEntry {
  name: string;
  url: string;
  strengths: string[];
  weaknesses: string[];
}

export interface PageCopy {
  headline: string;
  subheadline: string;
  features: FeatureCopy[];
  testimonials: TestimonialCopy[];
  ctaPrimary: string;
  ctaSecondary: string | null;
  footerText: string;
}

export interface FeatureCopy {
  title: string;
  description: string;
  icon: string | null;
}

export interface TestimonialCopy {
  quote: string;
  author: string;
  role: string;
}

export interface Wireframe {
  sections: WireframeSection[];
}

export interface WireframeSection {
  name: string;
  type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'faq' | 'footer' | 'custom';
  description: string;
  order: number;
}

export interface SEOConfig {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  keywords: string[];
  schema: Record<string, unknown> | null;
}

export interface TestResults {
  lighthouseScores: LighthouseScores | null;
  screenshots: ScreenshotResult[];
  ctaVisibility: CTAVisibility[];
  issues: string[];
}

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface ScreenshotResult {
  width: number;
  path: string | null;
}

export interface CTAVisibility {
  width: number;
  visible: boolean;
}

export interface DistributionDraft {
  platform: string;
  content: string;
  metadata: Record<string, string>;
}

export interface LaunchpadState {
  brief: LaunchBrief | null;
  research: CompetitorAnalysis | null;
  copy: PageCopy | null;
  wireframe: Wireframe | null;
  seo: SEOConfig | null;
  testResults: TestResults | null;
  distributions: DistributionDraft[];
  status: 'planning' | 'building' | 'testing' | 'distributing' | 'complete';
}
