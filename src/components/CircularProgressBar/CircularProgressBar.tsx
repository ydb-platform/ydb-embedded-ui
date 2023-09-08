import cn from 'bem-cn-lite';
import type {ReactNode} from 'react';

import type {MetricStatus} from '../../store/reducers/tenants/types';
import {normalizeProgress} from '../../store/reducers/tenants/utils';

import './CircularProgressBar.scss';

const b = cn('ydb-circular-progress-bar');

interface CircularProgressBarProps {
    size?: number;
    progress?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    content?: ReactNode;
    status?: MetricStatus;
    circleBgClassName?: string;
}

export function CircularProgressBar({
    size = 100,
    progress = 0,
    strokeWidth = 10,
    content,
    status,
    circleBgClassName,
}: CircularProgressBarProps) {
    const center = size / 2;

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const normalizedProgress = normalizeProgress(progress);

    const offset = ((100 - normalizedProgress) / 100) * circumference;
    return (
        <div className={b('wrapper')}>
            {content && <div className={b('content')}>{content}</div>}
            <svg className={b()} width={size} height={size}>
                <circle
                    className={b('circle-bg', circleBgClassName)}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className={b('circle', {status: status?.toLocaleLowerCase()})}
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
