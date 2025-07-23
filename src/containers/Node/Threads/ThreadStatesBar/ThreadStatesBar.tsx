import {cn} from '../../../../utils/cn';

import './ThreadStatesBar.scss';

const b = cn('thread-states-bar');

interface ThreadStatesBarProps {
    states?: Record<string, number>;
    totalThreads?: number;
    className?: string;
}

/**
 * Thread state colors based on the state type
 */
const getStateColor = (state: string): string => {
    switch (state.toUpperCase()) {
        case 'R': // Running
            return 'var(--g-color-text-positive)';
        case 'S': // Sleeping
            return 'var(--g-color-text-secondary)';
        case 'D': // Uninterruptible sleep
            return 'var(--g-color-text-warning)';
        case 'Z': // Zombie
        case 'T': // Stopped
        case 'X': // Dead
            return 'var(--g-color-text-danger)';
        default:
            return 'var(--g-color-text-misc)';
    }
};

/**
 * Component to display thread states as a horizontal bar chart
 */
export function ThreadStatesBar({states = {}, totalThreads, className}: ThreadStatesBarProps) {
    const total = totalThreads || Object.values(states).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
        return <div className={b(null, className)}>No threads</div>;
    }

    const stateEntries = Object.entries(states).filter(([, count]) => count > 0);

    return (
        <div className={b(null, className)}>
            <div className={b('bar')}>
                {stateEntries.map(([state, count]) => {
                    const percentage = (count / total) * 100;
                    return (
                        <div
                            key={state}
                            className={b('segment')}
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: getStateColor(state),
                            }}
                            title={`${state}: ${count} threads (${Math.round(percentage)}%)`}
                        />
                    );
                })}
            </div>
            <div className={b('legend')}>
                {stateEntries.map(([state, count]) => (
                    <span key={state} className={b('legend-item')}>
                        <span
                            className={b('legend-color')}
                            style={{backgroundColor: getStateColor(state)}}
                        />
                        {state}: {count}
                    </span>
                ))}
            </div>
        </div>
    );
}
