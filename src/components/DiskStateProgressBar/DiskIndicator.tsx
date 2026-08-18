import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {DiskIndicatorValue} from '../../utils/disks/displayState';
import type {IconWithColor} from '../../utils/disks/iconCalculators';

const b = cn('storage-disk-progress-bar');

interface DiskIconGroupProps {
    icons: IconWithColor[];
}

export function DiskIconGroup({icons}: DiskIconGroupProps) {
    return (
        <div className={b('icon-group')}>
            {icons.map(({icon, color}, index) => (
                <Icon
                    key={index}
                    className={b('icon', {overlapped: index > 0})}
                    data={icon}
                    size={10}
                    style={color ? {color} : undefined}
                />
            ))}
        </div>
    );
}

interface DiskIndicatorProps {
    value: DiskIndicatorValue;
    placement?: 'inline' | 'overlap';
}

export function DiskIndicator({value, placement = 'inline'}: DiskIndicatorProps) {
    if (typeof value === 'string') {
        return <div className={b('text-label')}>{value}</div>;
    }

    if (Array.isArray(value)) {
        return <DiskIconGroup icons={value} />;
    }

    return (
        <Icon
            className={b('icon', {'overlap-top-left': placement === 'overlap'})}
            data={value}
            size={12}
        />
    );
}
