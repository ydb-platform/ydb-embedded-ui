import React from 'react';

import unipikaFabric from '@gravity-ui/unipika';

export const unipika = unipikaFabric({});

export const defaultUnipikaSettings = {
    asHTML: true,
    format: 'json',
    compact: false,
    escapeWhitespace: true,
    showDecoded: true,
    binaryAsHex: false,
};

export function unipikaConvert(value: unknown) {
    return unipika.converters.yson(value, defaultUnipikaSettings);
}

export function useUnipikaConvert(value: unknown) {
    const memoized = React.useMemo(() => unipikaConvert(value), [value]);
    return memoized;
}
