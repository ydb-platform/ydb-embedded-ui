import {Label} from '@gravity-ui/uikit';
import type {LabelProps} from '@gravity-ui/uikit';

interface UsageLabelProps extends Omit<LabelProps, 'value'> {
    value: number | string;
    overloadThreshold?: number;
}

export function UsageLabel({value, theme, ...props}: UsageLabelProps) {
    return (
        <Label theme={theme} {...props}>
            {value || 0}%
        </Label>
    );
}
