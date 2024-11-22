export interface TestResults {
    config: Config;
    suites: Suite[];
}

export interface Config {
    configFile: string;
    rootDir: string;
    forbidOnly: boolean;
    fullyParallel: boolean;
    globalSetup: string;
    globalTeardown: null;
    globalTimeout: number;
    grep: Record<string, unknown>;
    grepInvert: null;
    maxFailures: number;
    metadata: Metadata;
    preserveOutput: string;
    reporter: Reporter[];
    reportSlowTests: ReportSlowTests;
    quiet: boolean;
    projects: Project[];
    shard: null;
    updateSnapshots: string;
    version: string;
    workers: number;
    webServer: WebServer;
}

export interface Metadata {
    actualWorkers: number;
}

export interface Reporter {
    [index: number]: string | ReporterConfig;
}

export interface ReporterConfig {
    outputFolder?: string;
    outputFile?: string;
}

export interface ReportSlowTests {
    max: number;
    threshold: number;
}

export interface Project {
    outputDir: string;
    repeatEach: number;
    retries: number;
    id: string;
    name: string;
    testDir: string;
    testIgnore: unknown[];
    testMatch: string[];
    timeout: number;
}

export interface WebServer {
    command: string;
    port: number;
}

export interface Suite {
    title: string;
    file: string;
    column: number;
    line: number;
    specs: Spec[];
    suites: Suite[];
}

export interface Spec {
    title: string;
    ok: boolean;
    tags: unknown[];
    tests: Test[];
    id: string;
    file: string;
    line: number;
    column: number;
}

export interface Test {
    timeout: number;
    annotations: unknown[];
    expectedStatus: string;
    projectId: string;
    projectName: string;
    results: Result[];
    status: string;
}

export interface Result {
    workerIndex: number;
    status: string;
    duration: number;
    errors: unknown[];
    stdout: unknown[];
    stderr: unknown[];
    retry: number;
    startTime: string;
    attachments: unknown[];
}

export interface TestInfo {
    title: string;
    fullTitle: string;
    status: string;
    file: string;
    skipped: boolean;
}

export interface TestResultsInfo {
    total: number;
    passed: number;
    failed: number;
    flaky: number;
    skipped: number;
    tests: TestInfo[];
}

export interface TestStatusInfo {
    status: string;
    statusColor: string;
}
