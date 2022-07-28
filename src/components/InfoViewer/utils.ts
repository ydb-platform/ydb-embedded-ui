type LabelMap<T> = {
    [label in keyof T]?: string;
}

type FieldMappers<T> = {
    [label in keyof T]?: (value: T[label]) => string | undefined;
}

function formatLabel<Shape>(label: keyof Shape, map: LabelMap<Shape>) {
    return map[label] ?? label;
}

function formatValue<Shape, Key extends keyof Shape>(
    label: Key,
    value: Shape[Key],
    mappers: FieldMappers<Shape>,
) {
    const mapper = mappers[label];
    const mappedValue = mapper ? mapper(value) : value;

    return String(mappedValue ?? '');
}

export function createInfoFormatter<Shape extends Record<string, any>>(
    fieldMappers?: FieldMappers<Shape>,
    labelMap?: LabelMap<Shape>,
) {
    return <Key extends keyof Shape>(label: Key, value: Shape[Key]) => ({
        label: formatLabel(label, labelMap || {}),
        value: formatValue(label, value, fieldMappers || {}),
    });
}
