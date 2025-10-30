import {StringParam} from 'use-query-params';
import {z} from 'zod';

import type {QueryParamsTypeFromQueryObject} from '../../routes';
import type {ValueOf} from '../../types/common';

import i18n from './i18n';

const NODE_TABS_IDS = {
    storage: 'storage',
    tablets: 'tablets',
    structure: 'structure',
    threads: 'threads',
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
        id: NODE_TABS_IDS.structure,
        get title() {
            return i18n('tabs.structure');
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
        id: NODE_TABS_IDS.configs,
        get title() {
            return i18n('tabs.configs');
        },
    },
];

export const nodePageTabSchema = z.nativeEnum(NODE_TABS_IDS).catch(NODE_TABS_IDS.tablets);

export const nodePageQueryParams = {
    database: StringParam,
    pdiskId: StringParam,
    vdiskId: StringParam,
};

export type NodePageQuery = QueryParamsTypeFromQueryObject<typeof nodePageQueryParams>;
