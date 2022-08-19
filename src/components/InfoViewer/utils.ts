import type {ReactNode} from "react";

type LabelMap<T> = {
    [label in keyof T]?: string;
}

type ValueFormatters<T> = {
    [label in keyof T]?: (value: T[label]) => ReactNode;
}

function formatLabel<Shape>(label: keyof Shape, map: LabelMap<Shape>) {
    return map[label] ?? label;
}

function formatValue<Shape, Key extends keyof Shape>(
    label: Key,
    value: Shape[Key],
    formatters: ValueFormatters<Shape>,
    defaultFormatter?: (value: Shape[Key]) => ReactNode,
) {
    const formatter = formatters[label] || defaultFormatter;
    const formattedValue = formatter ? formatter(value) : value;

    return formattedValue;
}

interface CreateInfoFormatterOptions<Shape> {
    values?: ValueFormatters<Shape>,
    labels?: LabelMap<Shape>,
    defaultValueFormatter?: (value: Shape[keyof Shape]) => ReactNode,
}

export function createInfoFormatter<Shape extends Record<string, any>>({
    values: valueFormatters,
    labels: labelMap,
    defaultValueFormatter,
}: CreateInfoFormatterOptions<Shape>) {
    return <Key extends keyof Shape>(label: Key, value: Shape[Key]) => ({
        label: formatLabel(label, labelMap || {}),
        value: formatValue(label, value, valueFormatters || {}, defaultValueFormatter),
    });
}
