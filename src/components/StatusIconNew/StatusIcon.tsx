import {
    CircleCheckFill,
    CircleExclamationFill,
    CircleInfo,
    PlugConnection,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData, IconProps} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';

const EFlagToIcon: Record<EFlag, IconData> = {
    [EFlag.Blue]: CircleInfo,
    [EFlag.Yellow]: CircleExclamationFill,
    [EFlag.Orange]: TriangleExclamationFill,
    [EFlag.Red]: CircleExclamationFill,
    [EFlag.Green]: CircleCheckFill,
    [EFlag.Grey]: PlugConnection,
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
