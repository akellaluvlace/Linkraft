import { type SecurityReport } from './security-scanner.js';
import { type HealthReport } from './health-scanner.js';
import { type ReadinessReport } from './readiness-scanner.js';
export interface PreflightReport {
    projectName: string;
    timestamp: string;
    scanTimeMs: number;
    security: SecurityReport;
    health: HealthReport;
    readiness: ReadinessReport;
}
export declare function runPreflight(projectRoot: string): PreflightReport;
export declare function formatReport(report: PreflightReport): string;
export declare function writeReport(projectRoot: string, report: PreflightReport): string;
