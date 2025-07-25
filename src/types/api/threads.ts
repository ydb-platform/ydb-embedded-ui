/**
 * Thread pool information with detailed statistics
 * Based on the thread information shown in the node page
 */
export interface TThreadPoolInfo {
    /** Thread pool name (e.g., AwsEventLoop, klktmr.IC) */
    Name?: string;
    /** Number of threads in the pool */
    Threads?: number;
    /** System CPU usage (0-1 range) */
    SystemUsage?: number;
    /** User CPU usage (0-1 range) */
    UserUsage?: number;
    /** Number of minor page faults */
    MinorPageFaults?: number;
    /** Number of major page faults */
    MajorPageFaults?: number;
    /** Thread states with counts */
    States?: Record<string, number>;
}

/**
 * Response containing thread pool information for a node
 */
export interface TThreadPoolsResponse {
    /** Array of thread pools */
    Threads?: TThreadPoolInfo[];
    /** Response time */
    ResponseTime?: string;
    ResponseDuration?: number;
}

/**
 * Thread states enum based on Linux process states
 * Reference: https://manpages.ubuntu.com/manpages/noble/man5/proc_pid_stat.5.html
 */
export enum ThreadState {
    /** Running */
    R = 'R',
    /** Sleeping in an interruptible wait */
    S = 'S',
    /** Waiting in uninterruptible disk sleep */
    D = 'D',
    /** Zombie */
    Z = 'Z',
    /** Stopped (on a signal) */
    T = 'T',
    /** Tracing stop */
    t = 't',
    /** Paging (not valid since Linux 2.6.0) */
    W = 'W',
    /** Dead (should never be seen) */
    X = 'X',
    /** Dead (Linux 2.6.0 and later) */
    x = 'x',
    /** Wakekill (Linux 2.6.33 and later) */
    K = 'K',
    /** Waking (Linux 2.6.33 and later) */
    W_WAKE = 'W',
    /** Parked (Linux 3.9 and later) */
    P = 'P',
}
