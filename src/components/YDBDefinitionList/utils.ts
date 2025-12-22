import type React from 'react';

import type {YDBDefinitionListItem} from './YDBDefinitionList';

type NameMap<T> = {
    [key in keyof T]?: string;
};

type ContentFormatters<T> = {
    [key in keyof T]?: (value: T[key]) => React.ReactNode;
};

type CopyTextFormatters<T> = {
    [key in keyof T]?: (value: T[key]) => string | undefined;
};

function formatName<Shape>(key: keyof Shape, map: NameMap<Shape>) {
    return map[key] ?? String(key);
}

function formatContent<Shape, Key extends keyof Shape>(
    key: Key,
    value: Shape[Key],
    formatters: ContentFormatters<Shape>,
    defaultFormatter?: (value: Shape[Key]) => React.ReactNode,
) {
    const formatter = formatters[key] || defaultFormatter;

    return formatter ? formatter(value) : value;
}

interface CreateDefinitionFormatterOptions<Shape> {
    contents?: ContentFormatters<Shape>;
    names?: NameMap<Shape>;
    copyTexts?: CopyTextFormatters<Shape>;
    defaultContentFormatter?: (value: Shape[keyof Shape]) => React.ReactNode;
}

export function createDefinitionFormatter<Shape extends Record<string, any>>({
    contents,
    names,
    defaultContentFormatter,
}: CreateDefinitionFormatterOptions<Shape>) {
    return <Key extends keyof Shape>(key: Key, value: Shape[Key]): YDBDefinitionListItem => {
        return {
            name: formatName(key, names || {}),
            content: formatContent(key, value, contents || {}, defaultContentFormatter),
        };
    };
}

export const formatObjectToDefinitionItems = <Shape extends Record<string, any>>(
    formatter: <Key extends keyof Shape>(key: Key, value: Shape[Key]) => YDBDefinitionListItem,
    obj?: Partial<Shape>,
): YDBDefinitionListItem[] => {
    if (!obj) {
        return [];
    }

    return Object.entries(obj)
        .map(([key, value]) => formatter(key as keyof Shape, value as Shape[keyof Shape]))
        .filter(({content}) => Boolean(content));
};
