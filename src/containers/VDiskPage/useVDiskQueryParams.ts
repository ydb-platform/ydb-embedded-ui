import React from 'react';

import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {vDiskPageKeyset} from './i18n';

const VDISK_TABS_IDS = {
    storage: 'storage',
    tablets: 'tablets',
} as const;

const VDISK_PAGE_TABS = [
    {
        id: VDISK_TABS_IDS.storage,
        get title() {
            return vDiskPageKeyset('storage');
        },
    },
    {
        id: VDISK_TABS_IDS.tablets,
        get title() {
            return vDiskPageKeyset('tablets');
        },
    },
];

const vDiskTabSchema = z.nativeEnum(VDISK_TABS_IDS).catch(VDISK_TABS_IDS.storage);

export function useVDiskQueryParams() {
    const [{nodeId, vDiskId, activeTab, database}, setQueryParams] = useQueryParams({
        nodeId: StringParam,
        vDiskId: StringParam,
        activeTab: StringParam,
        database: StringParam,
    });

    const requestedVDiskTab = vDiskTabSchema.parse(activeTab);
    const isViewerUser = useIsViewerUser();
    const {vDiskTab, vDiskTabs} = React.useMemo(() => {
        const availableTabs = isViewerUser
            ? VDISK_PAGE_TABS
            : VDISK_PAGE_TABS.filter(({id}) => id !== VDISK_TABS_IDS.tablets);
        const availableActiveTab =
            availableTabs.find(({id}) => id === requestedVDiskTab)?.id ?? VDISK_TABS_IDS.storage;

        return {vDiskTab: availableActiveTab, vDiskTabs: availableTabs};
    }, [isViewerUser, requestedVDiskTab]);

    React.useEffect(() => {
        if (vDiskTab !== requestedVDiskTab) {
            setQueryParams({activeTab: vDiskTab}, 'replaceIn');
        }
    }, [requestedVDiskTab, setQueryParams, vDiskTab]);

    return {
        nodeId,
        vDiskId,
        database: database ?? undefined,
        vDiskTab,
        vDiskTabs,
    };
}
