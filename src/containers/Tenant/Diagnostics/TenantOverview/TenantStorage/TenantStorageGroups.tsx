import React from 'react';

import {Flex, Label} from '@gravity-ui/uikit';

import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TTenantResource} from '../../../../../types/api/tenant';
import {parseOptionalNonNegativeNumber} from '../../../../../utils/utils';

import i18n from './i18n';

export interface AllocatedStorageGroup {
    kind: string;
    count: number;
}

export function getAllocatedStorageGroups(
    allocatedResources?: TTenantResource[],
): AllocatedStorageGroup[] {
    return (allocatedResources ?? []).flatMap(({Count, Kind, Type}) => {
        const kind = typeof Kind === 'string' ? Kind.trim() : '';

        if (Type !== 'storage' || kind === '' || !Number.isFinite(Count) || Count < 0) {
            return [];
        }

        return [{kind, count: Count}];
    });
}

export function getStorageGroupsDefinitionItem(
    allocatedResources?: TTenantResource[],
    storageGroupsTotal?: string,
): YDBDefinitionListItem | undefined {
    const storageGroups = getAllocatedStorageGroups(allocatedResources);
    const total = parseOptionalNonNegativeNumber(storageGroupsTotal);

    if (storageGroups.length === 0 && total === undefined) {
        return undefined;
    }

    return {
        name: i18n('title_storage-groups'),
        note: i18n('context_storage-groups-description'),
        content: (
            <Flex direction="column" alignItems="flex-start" gap={1}>
                {storageGroups.length > 0 ? (
                    storageGroups.map(({count, kind}, index) => (
                        <Label key={`${kind}-${index}`} theme="normal">
                            {i18n('value_storage-groups-count', {count, kind})}
                        </Label>
                    ))
                ) : (
                    <Label theme="normal">
                        {i18n('value_storage-groups-total', {count: total})}
                    </Label>
                )}
            </Flex>
        ),
    };
}

interface TenantStorageGroupsProps {
    allocatedResources?: TTenantResource[];
    storageGroupsTotal?: string;
}

export function TenantStorageGroups({
    allocatedResources,
    storageGroupsTotal,
}: TenantStorageGroupsProps) {
    const items = React.useMemo(() => {
        const item = getStorageGroupsDefinitionItem(allocatedResources, storageGroupsTotal);

        return item ? [item] : [];
    }, [allocatedResources, storageGroupsTotal]);

    if (items.length === 0) {
        return null;
    }

    return <YDBDefinitionList responsive dataQa="tenant-storage-groups" items={items} />;
}
