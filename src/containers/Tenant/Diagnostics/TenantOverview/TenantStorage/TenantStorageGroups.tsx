import React from 'react';

import {Flex, Label} from '@gravity-ui/uikit';

import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TTenantResource} from '../../../../../types/api/tenant';

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
): YDBDefinitionListItem | undefined {
    const storageGroups = getAllocatedStorageGroups(allocatedResources);

    if (storageGroups.length === 0) {
        return undefined;
    }

    return {
        name: i18n('title_storage-groups'),
        note: i18n('context_storage-groups-description'),
        content: (
            <Flex direction="column" alignItems="flex-start" gap={1}>
                {storageGroups.map(({count, kind}, index) => (
                    <Label key={`${kind}-${index}`} theme="normal">
                        {i18n('value_storage-groups-count', {count, kind})}
                    </Label>
                ))}
            </Flex>
        ),
    };
}

interface TenantStorageGroupsProps {
    allocatedResources?: TTenantResource[];
}

export function TenantStorageGroups({allocatedResources}: TenantStorageGroupsProps) {
    const items = React.useMemo(() => {
        const item = getStorageGroupsDefinitionItem(allocatedResources);

        return item ? [item] : [];
    }, [allocatedResources]);

    if (items.length === 0) {
        return null;
    }

    return <YDBDefinitionList responsive dataQa="tenant-storage-groups" items={items} />;
}
