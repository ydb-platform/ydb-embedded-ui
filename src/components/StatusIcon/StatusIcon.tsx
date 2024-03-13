import {Icon} from '@gravity-ui/uikit';

import circleExclamationIcon from '../../assets/icons/circle-exclamation.svg';
import circleInfoIcon from '../../assets/icons/circle-info.svg';
import circleTimesIcon from '../../assets/icons/circle-xmark.svg';
import triangleExclamationIcon from '../../assets/icons/triangle-exclamation.svg';
import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import './StatusIcon.scss';

const b = cn('ydb-status-icon');

const icons = {
    [EFlag.Blue]: circleInfoIcon,
    [EFlag.Yellow]: circleExclamationIcon,
    [EFlag.Orange]: triangleExclamationIcon,
    [EFlag.Red]: circleTimesIcon,
};

export type StatusIconMode = 'color' | 'icons';
export type StatusIconSize = 'xs' | 's' | 'm' | 'l';

interface StatusIconProps {
    status?: EFlag;
    size?: StatusIconSize;
    mode?: StatusIconMode;
}

export function StatusIcon({status = EFlag.Grey, size = 's', mode = 'color'}: StatusIconProps) {
    const modifiers = {state: status.toLowerCase(), size};

    if (mode === 'icons' && status in icons) {
        return (
            <Icon
                className={b('status-icon', modifiers)}
                data={icons[status as keyof typeof icons]}
            />
        );
    }

    return <div className={b('status-color', modifiers)} />;
}
