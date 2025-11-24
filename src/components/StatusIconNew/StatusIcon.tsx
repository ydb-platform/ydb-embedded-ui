import {
    CircleCheck,
    CircleExclamation,
    CircleInfo,
    PlugConnection,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {IconProps} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';

const EFlagToIcon: Record<EFlag, (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
    [EFlag.Blue]: CircleInfo,
    [EFlag.Yellow]: CircleExclamation,
    [EFlag.Orange]: TriangleExclamation,
    [EFlag.Red]: CircleExclamation,
    [EFlag.Green]: CircleCheck,
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
