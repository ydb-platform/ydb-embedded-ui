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
    indent: 2,
    decodeUTF8: false,
};

export function unipikaConvert(value: unknown) {
    let result;
    try {
        result = unipika.converters.yson(value, defaultUnipikaSettings);
    } catch (e) {
        console.error(e);
        result = {_error: 'JSON is invalid'};
    }
    return result;
}

export function useUnipikaConvert(value: unknown) {
    const memoized = React.useMemo(() => unipikaConvert(value), [value]);
    return memoized;
}
