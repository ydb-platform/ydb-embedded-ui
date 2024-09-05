/**
 * endpoints: pdisk/restart and vdiks/evict
 */
export interface ModifyDiskResponse {
    debugMessage?: string;
    // true if successful, false if not
    result?: boolean;
    // Error message
    error?: string;
    forceRetryPossible?: boolean;
}
