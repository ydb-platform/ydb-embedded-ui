import {Label} from '@gravity-ui/uikit';
import type {LabelProps} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './UsageLabel.scss';

const b = cn('ydb-usage-label');

interface UsageLabelProps extends Omit<LabelProps, 'value'> {
    value: number | string;
    overloadThreshold?: number;
}

export function UsageLabel({value, overloadThreshold = 90, theme, ...props}: UsageLabelProps) {
    return (
        <Label
            theme={theme}
            className={b({overload: Number(value) >= overloadThreshold})}
            {...props}
        >
            {value || 0}%
        </Label>
    );
}
