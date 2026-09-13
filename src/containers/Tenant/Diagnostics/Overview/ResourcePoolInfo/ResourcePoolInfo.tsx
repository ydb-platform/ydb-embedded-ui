import type React from 'react';

import {Text} from '@gravity-ui/uikit';

import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';

import i18n from './i18n';

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

function formatValue(value: string | undefined): React.ReactNode {
    if (value === undefined || value === '' || value === '-1') {
        return <Text color="secondary">{i18n('value_not-set')}</Text>;
    }
    return <Text variant="code-inline-2">{value}</Text>;
}

export function prepareResourcePoolItems(data: TEvDescribeSchemeResult): YDBDefinitionListItem[] {
    const properties = data.PathDescription?.ResourcePoolDescription?.Properties?.Properties || {};

    const info: YDBDefinitionListItem[] = [];

    for (const group of PROPERTY_GROUPS) {
        for (const {key, label} of group.properties) {
            const value = properties[key];
            info.push({
                name: label,
                content: formatValue(value),
                copyText: value || undefined,
            });
        }
    }

    return info;
}
