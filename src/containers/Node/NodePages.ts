import {StringParam} from 'use-query-params';
import {z} from 'zod';

import type {QueryParamsTypeFromQueryObject} from '../../routes';
import type {ValueOf} from '../../types/common';

import i18n from './i18n';

const NODE_TABS_IDS = {
    storage: 'storage',
    tablets: 'tablets',
    threads: 'threads',
    network: 'network',
    configs: 'configs',
} as const;

export type NodeTab = ValueOf<typeof NODE_TABS_IDS>;

export const NODE_TABS = [
    {
        id: NODE_TABS_IDS.storage,
        get title() {
            return i18n('tabs.storage');
        },
    },
    {
        id: NODE_TABS_IDS.tablets,
        get title() {
            return i18n('tabs.tablets');
        },
    },
    {
        id: NODE_TABS_IDS.threads,
        get title() {
            return i18n('tabs.threads');
        },
    },
    {
        id: NODE_TABS_IDS.network,
        get title() {
            return i18n('tabs.network');
        },
    },
    {
        id: NODE_TABS_IDS.configs,
        get title() {
            return i18n('tabs.configs');
        },
    },
];

export const nodePageTabSchema = z.preprocess(
    (value) => (value === 'structure' ? NODE_TABS_IDS.storage : value),
    z.nativeEnum(NODE_TABS_IDS).catch(NODE_TABS_IDS.tablets),
);

export const nodePageQueryParams = {
    database: StringParam,
    clusterName: StringParam,
    backend: StringParam,
};

export type NodePageQuery = QueryParamsTypeFromQueryObject<typeof nodePageQueryParams>;
