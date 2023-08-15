import cn from 'bem-cn-lite';

import './CircularProgressBar.scss';
import {ReactNode} from 'react';

interface CircularProgressBarProps {
    size?: number;
    progress?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    content?: ReactNode;
    isSelected?: boolean;
    status?: string;
}

const b = cn('circular-progress-bar');

export function CircularProgressBar({
    size = 100,
    progress = 0,
    strokeWidth = 10,
    content,
    isSelected,
    status,
}: CircularProgressBarProps) {
    const center = size / 2;

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    if (progress >= 100) {
        progress = 100;
    }
    if (progress <= 0) {
        progress = 0;
    }

    const offset = ((100 - progress) / 100) * circumference;
    return (
        <div className={b('wrapper')}>
            {content && <div className={b('content')}>{content}</div>}
            <svg className={b()} width={size} height={size}>
                <circle
                    className={b('circle-bg', isSelected ? 'selected' : '')}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className={b('circle', {status})}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
        </div>
    );
}
