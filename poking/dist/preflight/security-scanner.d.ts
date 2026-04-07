import { type ScanResult } from '../shared/scanner.js';
export interface SecurityReport {
    score: number;
    critical: ScanResult[];
    warnings: ScanResult[];
    passed: string[];
}
export declare function scanSecurity(projectRoot: string): SecurityReport;
