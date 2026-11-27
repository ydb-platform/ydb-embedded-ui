import React from 'react';

import {Select} from '@gravity-ui/uikit';

import {tenantsApi} from '../../store/reducers/tenants/tenants';
import {uiFactory} from '../../uiFactory/uiFactory';

import {cloudOptions} from './clouds';
import i18n from './i18n';

interface CloudFilterProps {
    ids: string[];
    environmentName?: string;
    value: string[];
    onChange: (values: string[]) => void;
}

export function CloudFilter({ids, environmentName, value, onChange}: CloudFilterProps) {
    const [open, setOpen] = React.useState(false);
    const cloudNames = tenantsApi.endpoints.getDatabaseCloudNames;
    const args = React.useMemo(() => ({ids, environmentName}), [ids, environmentName]);
    const canResolve = Boolean(uiFactory.resolveCloudName);
    const {currentData, isFetching, isUninitialized} = cloudNames.useQueryState(args, {
        skip: !canResolve,
    });
    // Keep resolved labels on the closed control and fetch uncached IDs only while open.
    cloudNames.useQuerySubscription(args, {
        skip: !canResolve || (!open && !currentData),
    });
    const loading = open && canResolve && !currentData && (isFetching || isUninitialized);
    const options = React.useMemo(
        () => cloudOptions(ids, currentData ?? [], value),
        [ids, currentData, value],
    );

    return (
        <Select
            label={`${i18n('label_cloud')}:`}
            aria-label={i18n('label_cloud')}
            placeholder={i18n('value_all')}
            filterPlaceholder={i18n('placeholder_search-clouds')}
            filterable
            multiple
            hasCounter={value.length > 1}
            hasClear
            width={200}
            popupWidth="fit"
            loading={loading}
            options={loading ? [] : options}
            value={value}
            filterOption={(option, filter) => {
                const query = filter.trim().toLowerCase();
                return (
                    String(option.content).toLowerCase().includes(query) ||
                    option.value.toLowerCase().includes(query)
                );
            }}
            onOpenChange={setOpen}
            onUpdate={onChange}
        />
    );
}
