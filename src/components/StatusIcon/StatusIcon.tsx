import {
    ArrowsRotateRight,
    CircleCheck,
    CircleExclamation,
    Flame,
    Ghost,
    TriangleExclamation,
} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {StatusColor} from '../StatusColor/StatusColor';

import './StatusIcon.scss';

const b = cn('ydb-status-icon');

const icons = {
    [EFlag.Grey]: Ghost,
    [EFlag.Green]: CircleCheck,
    [EFlag.Blue]: ArrowsRotateRight,
    [EFlag.Yellow]: TriangleExclamation,
    [EFlag.Orange]: Flame,
    [EFlag.Red]: CircleExclamation,
};

export type StatusIconMode = 'color' | 'icons';
export type StatusIconSize = 'xs' | 's' | 'm' | 'l';

interface StatusIconProps {
    status?: EFlag;
    size?: StatusIconSize;
    mode?: StatusIconMode;
    className?: string;
}

export function StatusIcon({
    status = EFlag.Grey,
    size = 's',
    mode = 'color',
    className,
}: StatusIconProps) {
    const modifiers = {state: status.toLowerCase(), size};

    if (mode === 'icons' && status in icons) {
        return (
            <Icon
                className={b('status-icon', modifiers, className)}
                data={icons[status as keyof typeof icons]}
            />
        );
    }

    return <StatusColor className={className} size={size} status={status} />;
}
