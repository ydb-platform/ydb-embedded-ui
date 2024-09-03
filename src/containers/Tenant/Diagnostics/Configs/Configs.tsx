import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {Switch} from '@gravity-ui/uikit';
import {StringParam, useQueryParam} from 'use-query-params';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {setFeatureFlagsFilter, tenantApi} from '../../../../store/reducers/tenant/tenant';
import type {TClusterConfigFeatureFlag} from '../../../../types/api/cluster';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';

const FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY = 'featureFlagsColumnsWidth';

const columns: Column<TClusterConfigFeatureFlag>[] = [
    {
        name: 'Feature flag',
        render: ({row}) =>
            row.Current ? <b title="Default value was changed">{row.Name}</b> : row.Name,
        width: 400,
        sortable: false,
    },
    {
        name: 'Default',
        render: ({row}) => {
            switch (row.Default) {
                case true:
                    return 'Enabled';
                case false:
                    return 'Disabled';
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
        render: ({row}) => <Switch disabled checked={(row.Current ?? row.Default) || false} />,
        width: 100,
        sortable: false,
        resizeable: false,
    },
];

interface Props {
    path: string;
    database: string;
}

export const Configs = ({database}: Props) => {
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
            setSearch(featureFlagsFilter);
        }
    }, []);

    const onChange = (value: string) => {
        dispatch(setFeatureFlagsFilter(value));
        setSearch(value || undefined);
    };

    const featureFlags = featureFlagsFilter
        ? currentData.filter((item) => item.Name.toLocaleLowerCase().includes(featureFlagsFilter))
        : currentData;

    const renderContent = () => {
        if (isError) {
            return 'Error while loading configs';
        }

        if (!featureFlags.length) {
            return featureFlagsFilter ? 'Empty search result' : 'No data';
        }

        return (
            <ResizeableDataTable<TClusterConfigFeatureFlag>
                columnsWidthLSKey={FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY}
                columns={columns}
                data={featureFlags}
                settings={{
                    displayIndices: false,
                }}
            />
        );
    };

    const renderControls = () => {
        return (
            <React.Fragment>
                <Search
                    value={featureFlagsFilter}
                    onChange={onChange}
                    placeholder="Search by feature flag"
                />
            </React.Fragment>
        );
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={isFetching}>
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
