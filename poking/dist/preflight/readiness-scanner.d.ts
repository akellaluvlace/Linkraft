export interface ReadinessCheck {
    name: string;
    status: string;
    passed: boolean;
}
export interface ReadinessReport {
    percentage: number;
    checks: ReadinessCheck[];
}
export declare function scanReadiness(projectRoot: string): ReadinessReport;
