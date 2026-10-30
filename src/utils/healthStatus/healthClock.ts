/** Keep relative health lifetimes moving forward across clock corrections and system sleep. */
export function createHealthClock(): () => number {
    let wall = Date.now();
    let elapsed = performance.now();
    let current = wall;
    return () => {
        // Some browsers pause performance.now during system sleep; wall time covers resume.
        const nextWall = Date.now();
        const nextElapsed = performance.now();
        current += Math.max(0, nextWall - wall, nextElapsed - elapsed);
        wall = nextWall;
        elapsed = nextElapsed;
        return current;
    };
}

export const getHealthStatusNow = createHealthClock();
