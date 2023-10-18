import cn from 'bem-cn-lite';

import {Label, type LabelProps} from '@gravity-ui/uikit';

const b = cn('ydb-usage-label');

interface UsageLabelProps extends LabelProps {
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
