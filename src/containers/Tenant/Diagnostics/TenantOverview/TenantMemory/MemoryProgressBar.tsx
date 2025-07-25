import {MEMORY_SEGMENT_COLORS} from '../../../../../components/MemoryViewer/utils';
import {cn} from '../../../../../utils/cn';

import './MemoryProgressBar.scss';

const b = cn('memory-progress-bar');

interface MemoryProgressBarProps {
    memoryUsed?: string;
    memoryLimit?: string;
}

export function MemoryProgressBar({memoryUsed, memoryLimit}: MemoryProgressBarProps) {
    // Simple case - single segment progress bar
    if (!memoryUsed || !memoryLimit) {
        return null;
    }

    const usedValue = Number(memoryUsed);
    const limitValue = Number(memoryLimit);
    const usagePercentage = Math.min((usedValue / limitValue) * 100, 100);

    return (
        <div className={b('main-progress-container')}>
            <div className={b('main-progress-bar')}>
                <div
                    className={b('main-segment')}
                    style={{
                        width: `${usagePercentage}%`,
                        backgroundColor: MEMORY_SEGMENT_COLORS['Other'],
                    }}
                />
            </div>
        </div>
    );
}
