import React from 'react';

import {PersonPencil} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
import {Icon, Popover, Switch} from '@gravity-ui/uikit';
import {StringParam, useQueryParam} from 'use-query-params';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {setFeatureFlagsFilter, tenantApi} from '../../../../store/reducers/tenant/tenant';
import type {FeatureFlagConfig} from '../../../../types/api/featureFlags';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';

import i18n from './i18n';

import './Configs.scss';

const FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY = 'featureFlagsColumnsWidth';

const b = cn('ydb-diagnostics-configs');

const columns: Column<FeatureFlagConfig>[] = [
    {
        name: 'Touched',
        header: '',
        render: ({row}) =>
            row.Current ? (
                <Popover
                    content={i18n('flag-touched')}
                    className={b('icon-touched')}
                    placement="left"
                >
                    <Icon data={PersonPencil} />
                </Popover>
            ) : null,
        width: 36,
        sortable: false,
        resizeable: false,
    },
    {
        name: 'Name',
        get header() {
            return i18n('td-feature-flag');
        },
        render: ({row}) => (row.Current ? <b>{row.Name}</b> : row.Name),
        width: 400,
        sortable: true,
        sortAccessor: ({Current, Name}) => {
            return Number(!Current) + Name.toLowerCase();
        },
    },
    {
        name: 'Default',
        get header() {
            return i18n('td-default');
        },
        render: ({row}) => {
            switch (row.Default) {
                case true:
                    return i18n('enabled');
                case false:
                    return i18n('disabled');
                default:
                    return '-';
            }
        },
        width: 100,
        sortable: false,
        resizeable: false,
    },
    {
        name: 'Current',
        get header() {
            return i18n('td-current');
        },
        render: ({row}) => <Switch disabled checked={(row.Current ?? row.Default) || false} />,
        width: 100,
        sortable: false,
        resizeable: false,
    },
];

interface FeatureFlagsListsProps {
    isError?: boolean;
    featureFlags: FeatureFlagConfig[];
    featureFlagsFilter?: string;
}

const FeatureFlagsList = ({isError, featureFlags, featureFlagsFilter}: FeatureFlagsListsProps) => {
    if (isError) {
        return i18n('error-msg');
    }

    if (!featureFlags.length) {
        return i18n(featureFlagsFilter ? 'search-empty' : 'no-data');
    }

    return (
        <ResizeableDataTable
            columnsWidthLSKey={FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY}
            columns={columns}
            data={featureFlags}
            settings={DEFAULT_TABLE_SETTINGS}
        />
    );
};

interface ConfigsProps {
    database: string;
}

export const Configs = ({database}: ConfigsProps) => {
    const dispatch = useTypedDispatch();
    const [search, setSearch] = useQueryParam('search', StringParam);
    const {currentData = [], isFetching, isError} = tenantApi.useGetClusterConfigQuery({database});
    const featureFlagsFilter = useTypedSelector(
        (state) => state.tenant.featureFlagsFilter,
    )?.toLocaleLowerCase();

    // sync store and query filter
    React.useEffect(() => {
        if (search) {
            dispatch(setFeatureFlagsFilter(search));
        } else if (featureFlagsFilter) {
            setSearch(featureFlagsFilter, 'replaceIn');
        }
    }, []);

    const onChange = (value: string) => {
        dispatch(setFeatureFlagsFilter(value));
        setSearch(value || undefined, 'replaceIn');
    };

    const featureFlags = featureFlagsFilter
        ? currentData.filter((item) => item.Name.toLocaleLowerCase().includes(featureFlagsFilter))
        : currentData;

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>
                <Search
                    value={featureFlagsFilter}
                    onChange={onChange}
                    placeholder={i18n('search-placeholder')}
                />
            </TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={isFetching}>
                <FeatureFlagsList
                    isError={isError}
                    featureFlags={featureFlags}
                    featureFlagsFilter={featureFlagsFilter}
                />
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
