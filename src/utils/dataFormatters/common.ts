import {isNumeric} from '../utils';

export interface FormatToSizeArgs<T> {
    value: number;
    size?: T;
    precision?: number;
}

export type FormatValuesArgs<T> = Omit<FormatToSizeArgs<T>, 'value'> & {
    value: number | string | undefined | null;
    withSpeedLabel?: boolean;
    withSizeLabel?: boolean;
    delimiter?: string;
};

export function formatValues<T>(
    formatter: (args: FormatValuesArgs<T>) => string,
    sizeGetter: (value: number) => T,
    value?: number,
    total?: number,
    size?: T,
    delimiter?: string,
    withValueLabel = false,
) {
    let calculatedSize = sizeGetter(Number(value));
    let valueWithSizeLabel = true;
    let valuePrecision = 0;

    if (isNumeric(total)) {
        calculatedSize = sizeGetter(Number(total));
        valueWithSizeLabel = withValueLabel;
        valuePrecision = 1;
    }

    const formattedValue = formatter({
        value,
        withSizeLabel: valueWithSizeLabel,
        size: size || calculatedSize,
        precision: valuePrecision,
        delimiter,
    });
    const formattedTotal = formatter({
        value: total,
        size: size || calculatedSize,
        delimiter,
    });

    return [formattedValue, formattedTotal];
}
