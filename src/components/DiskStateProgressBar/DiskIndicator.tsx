import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {DiskIndicatorValue} from '../../utils/disks/displayState';
import type {IconWithColor} from '../../utils/disks/iconCalculators';

const b = cn('storage-disk-progress-bar');

interface DiskIconGroupProps {
    icons: IconWithColor[];
    size?: number;
    className?: string;
}

export function DiskIconGroup({icons, size = 10, className}: DiskIconGroupProps) {
    return (
        <div className={b('icon-group', className)}>
            {icons.map(({icon, color}, index) => (
                <Icon
                    key={index}
                    className={b('icon', {overlapped: index > 0})}
                    data={icon}
                    size={size}
                    style={color ? {color} : undefined}
                />
            ))}
        </div>
    );
}

interface DiskIndicatorProps {
    value: DiskIndicatorValue;
    placement?: 'inline' | 'overlap';
    iconSize?: number;
    iconGroupSize?: number;
    className?: string;
}

export function DiskIndicator({
    value,
    placement = 'inline',
    iconSize = 12,
    iconGroupSize,
    className,
}: DiskIndicatorProps) {
    if (typeof value === 'string') {
        return <div className={b('text-label', className)}>{value}</div>;
    }

    if (Array.isArray(value)) {
        return <DiskIconGroup icons={value} size={iconGroupSize} className={className} />;
    }

    return (
        <Icon
            className={b('icon', {'overlap-top-left': placement === 'overlap'}, className)}
            data={value}
            size={iconSize}
        />
    );
}
