type LabelMap<T> = {
    [label in keyof T]?: string;
}

type ValueFormatters<T> = {
    [label in keyof T]?: (value: T[label]) => string | undefined;
}

function formatLabel<Shape>(label: keyof Shape, map: LabelMap<Shape>) {
    return map[label] ?? label;
}

function formatValue<Shape, Key extends keyof Shape>(
    label: Key,
    value: Shape[Key],
    formatters: ValueFormatters<Shape>,
    defaultFormatter?: (value: Shape[Key]) => string | undefined,
) {
    const formatter = formatters[label] || defaultFormatter;
    const formattedValue = formatter ? formatter(value) : value;

    return String(formattedValue ?? '');
}

interface CreateInfoFormatterOptions<Shape> {
    values?: ValueFormatters<Shape>,
    labels?: LabelMap<Shape>,
    defaultValueFormatter?: (value: Shape[keyof Shape]) => string | undefined,
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
