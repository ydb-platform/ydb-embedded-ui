import React from 'react';

import type {QueryParamConfig} from 'use-query-params';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

const tabletTypesSchema = z
    .array(
        z
            .string()
            .trim()
            .min(1)
            .max(128)
            .regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    )
    .max(100)
    .catch([]);

export const TabletTypesParam: QueryParamConfig<string[] | undefined, string[]> = {
    encode: (value) => (value?.length ? value.join(',') : undefined),
    decode: (value) => {
        if (typeof value !== 'string') {
            return [];
        }

        return Array.from(new Set(tabletTypesSchema.parse(value.split(','))));
    },
};

export function useTabletQueryParams() {
    const [{tabletsSearch, tabletTypes}, setQueryParams] = useQueryParams({
        tabletsSearch: StringParam,
        tabletTypes: TabletTypesParam,
    });
    const handleTabletsSearchChange = React.useCallback(
        (value: string) => {
            setQueryParams({tabletsSearch: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleTabletTypesChange = React.useCallback(
        (value: string[]) => {
            setQueryParams({tabletTypes: value.length ? value : undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    return {
        tabletsSearch: tabletsSearch ?? '',
        tabletTypes: tabletTypes ?? [],
        handleTabletsSearchChange,
        handleTabletTypesChange,
    };
}
