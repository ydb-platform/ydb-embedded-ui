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

export interface FormatValuesPrecision {
    total?: number;
    value?: number;
}

export function formatValues<T>(
    formatter: (args: FormatValuesArgs<T>) => string,
    sizeGetter: (value: number) => T,
    value?: number,
    total?: number,
    size?: T,
    delimiter?: string,
    withValueLabel = false,
    precision?: FormatValuesPrecision,
) {
    let calculatedSize = sizeGetter(Number(value));
    let valueWithSizeLabel = true;
    let valuePrecision = precision?.value ?? 0;

    if (isNumeric(total)) {
        calculatedSize = sizeGetter(Number(total));
        valueWithSizeLabel = withValueLabel;
        valuePrecision = precision?.value ?? 1;
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
        precision: precision?.total,
        delimiter,
    });

    return [formattedValue, formattedTotal];
}
