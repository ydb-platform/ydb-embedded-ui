export interface RestartPDiskResponse {
    // true if successful, false if not
    result?: boolean;
    // Error message
    error?: string;
    forceRetryPossible?: boolean;
}
