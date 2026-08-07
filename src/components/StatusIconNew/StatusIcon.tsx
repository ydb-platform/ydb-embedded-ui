import {
    ArrowsRotateRight,
    CircleCheck,
    CircleXmark,
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
    [EFlag.Red]: CircleXmark,
    [EFlag.Green]: CircleCheck,
    [EFlag.Grey]: Ghost,
};

interface StatusIconProps extends Omit<IconProps, 'data'> {
    status?: EFlag;
}

export function StatusIcon({status, ...props}: StatusIconProps) {
    if (!status) {
        return null;
    }

    return <Icon {...props} data={EFlagToIcon[status]} />;
}
