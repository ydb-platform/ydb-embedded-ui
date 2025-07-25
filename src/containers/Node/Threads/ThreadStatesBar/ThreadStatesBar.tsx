import type {ProgressTheme} from '@gravity-ui/uikit';
import {ActionTooltip, Flex, Progress, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';

import './ThreadStatesBar.scss';

const b = cn('ydb-thread-states-bar');

interface ThreadStatesBarProps {
    states?: Record<string, number>;
    totalThreads?: number;
    className?: string;
}

/**
 * Thread state colors based on the state type
 */
const getProgressBackgroundColor = (state: string): string => {
    switch (state.toUpperCase()) {
        case 'R': // Running
            return 'var(--g-color-base-positive-medium)';
        case 'S': // Sleeping
            return 'var(--g-color-base-info-medium)';
        case 'D': // Uninterruptible sleep
            return 'var(--g-color-base-warning-medium)';
        case 'Z': // Zombie
        case 'T': // Stopped
        case 'X': // Dead
            return 'var(--g-color-base-danger-medium)';
        default:
            return 'var(--g-color-base-misc-medium)';
    }
};
const getStackThemeColor = (state: string): ProgressTheme => {
    switch (state.toUpperCase()) {
        case 'R': // Running
            return 'success';
        case 'S': // Sleeping
            return 'info';
        case 'D': // Uninterruptible sleep
            return 'warning';
        case 'Z': // Zombie
        case 'T': // Stopped
        case 'X': // Dead
            return 'danger';
        default:
            return 'misc';
    }
};
const getStateTitle = (state: string): string => {
    switch (state.toUpperCase()) {
        case 'R': // Running
            return 'Running';
        case 'S': // Sleeping
            return 'Sleeping';
        case 'D': // Uninterruptible sleep
            return 'Uninterruptible sleep';
        case 'Z': // Zombie
            return 'Zombie';
        case 'T': // Stopped
            return 'Stopped';
        case 'X': // Dead
            return 'Dead';
        default:
            return 'Unknown';
    }
};

export function ThreadStatesBar({states = {}, totalThreads, className}: ThreadStatesBarProps) {
    const total = totalThreads || Object.values(states).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const stateEntries = Object.entries(states).filter(([, count]) => count > 0);

    const stack = Object.entries(states).map(([state, count]) => ({
        theme: getStackThemeColor(state),
        value: (count / total) * 100,
    }));

    return (
        <div className={b(null, className)}>
            <Progress stack={stack} size="s" />
            <Flex gap={2}>
                {stateEntries.map(([state, count]) => (
                    <ActionTooltip key={state} title={getStateTitle(state)}>
                        <Flex gap={1} alignItems="center">
                            <div
                                className={b('legend-color')}
                                style={{backgroundColor: getProgressBackgroundColor(state)}}
                            />
                            <Text color="secondary" variant="caption-2">
                                {state}: {count}
                            </Text>
                        </Flex>
                    </ActionTooltip>
                ))}
            </Flex>
        </div>
    );
}
