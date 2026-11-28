import React from 'react';

import {Select} from '@gravity-ui/uikit';

import type {PreparedTenant} from '../../store/reducers/tenants/types';

import i18n from './i18n';

interface ClusterFilterProps {
    rows: PreparedTenant[];
    value: string[];
    onChange: (values: string[]) => void;
}

export function ClusterFilter({rows, value, onChange}: ClusterFilterProps) {
    const options = React.useMemo(() => {
        const names = new Set(value);
        for (const {Cluster} of rows) {
            if (Cluster) {
                names.add(Cluster);
            }
        }
        return Array.from(names)
            .sort()
            .map((name) => ({value: name, content: name}));
    }, [rows, value]);
    const label = i18n('field_cluster');

    return (
        <Select
            label={`${label}:`}
            aria-label={label}
            placeholder={i18n('value_all')}
            filterPlaceholder={i18n('context_search-clusters')}
            filterable
            multiple
            hasCounter={value.length > 1}
            hasClear
            width={200}
            popupWidth="fit"
            options={options}
            value={value}
            onUpdate={onChange}
        />
    );
}
