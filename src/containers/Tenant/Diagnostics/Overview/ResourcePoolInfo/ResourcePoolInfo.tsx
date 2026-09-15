import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';

import i18n from './i18n';

/** Sentinel value meaning "no limit" for a resource-pool property. */
const NO_LIMIT_VALUE = '-1';

interface PropertyGroup {
    title: string;
    properties: {key: string; label: string}[];
}

const PROPERTY_GROUPS: PropertyGroup[] = [
    {
        title: i18n('group_queue'),
        properties: [
            {key: 'concurrent_query_limit', label: i18n('field_concurrent-query-limit')},
            {key: 'queue_size', label: i18n('field_queue-size')},
            {key: 'database_load_cpu_threshold', label: i18n('field_database-load-cpu-threshold')},
        ],
    },
    {
        title: i18n('group_cpu'),
        properties: [
            {
                key: 'total_cpu_limit_percent_per_node',
                label: i18n('field_total-cpu-limit-percent-per-node'),
            },
        ],
    },
];

function isAbsent(value: string | undefined): value is undefined | '' {
    return value === undefined || value === '';
}

function formatValue(value: string | undefined): React.ReactNode {
    if (isAbsent(value)) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    if (value === NO_LIMIT_VALUE) {
        return <Text color="secondary">{i18n('value_no-limit')}</Text>;
    }
    return <Text variant="code-inline-2">{value}</Text>;
}

/** Only present copyText for values that are shown as concrete numbers. */
function getCopyText(value: string | undefined): string | undefined {
    if (isAbsent(value) || value === NO_LIMIT_VALUE) {
        return undefined;
    }
    return value;
}

function prepareGroupItems(
    properties: Record<string, string>,
    group: PropertyGroup,
): YDBDefinitionListItem[] {
    return group.properties.map(({key, label}) => {
        const value = properties[key];
        return {
            name: label,
            content: formatValue(value),
            copyText: getCopyText(value),
        };
    });
}

interface ResourcePoolInfoProps {
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for ResourcePool EPathType */
export function ResourcePoolInfo({data}: ResourcePoolInfoProps) {
    if (!data) {
        return null;
    }

    const properties = data.PathDescription?.ResourcePoolDescription?.Properties?.Properties || {};

    const sections = PROPERTY_GROUPS.map((group) => ({
        title: group.title,
        items: prepareGroupItems(properties, group),
    })).filter((section) => section.items.length > 0);

    if (sections.length === 0) {
        return null;
    }

    return (
        <Flex direction="column" gap={3}>
            {sections.map((section) => (
                <YDBDefinitionList
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    responsive
                />
            ))}
        </Flex>
    );
}
