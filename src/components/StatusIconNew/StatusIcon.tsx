import {
    ArrowsRotateRight,
    Check,
    CircleCheck,
    CircleExclamation,
    Flame,
    Ghost,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {IconData, IconProps} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';

const EFlagToIcon: Record<EFlag, IconData> = {
    [EFlag.Blue]: ArrowsRotateRight,
    [EFlag.Yellow]: TriangleExclamation,
    [EFlag.Orange]: Flame,
    [EFlag.Red]: CircleExclamation,
    [EFlag.Green]: CircleCheck,
    [EFlag.Grey]: Ghost,
};

interface StatusIconProps extends Omit<IconProps, 'data'> {
    status?: EFlag;
    /** Icon used for the Green status. */
    checkIcon?: 'check' | 'circle-check';
}

export function StatusIcon({status, checkIcon = 'circle-check', ...props}: StatusIconProps) {
    if (!status) {
        return null;
    }

    const icon = status === EFlag.Green && checkIcon === 'check' ? Check : EFlagToIcon[status];
    return <Icon {...props} data={icon} />;
}
