export interface HealthMetric {
    name: string;
    value: number | string;
    status: 'PASS' | 'WARN' | 'FAIL' | 'LOW' | 'INFO';
    detail: string | null;
}
export interface HealthReport {
    score: number;
    metrics: HealthMetric[];
}
export declare function scanHealth(projectRoot: string): HealthReport;
