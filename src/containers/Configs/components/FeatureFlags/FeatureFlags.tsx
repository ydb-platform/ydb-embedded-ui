import {PersonPencil} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
import {Icon, Popover, Switch} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {configsApi} from '../../../../store/reducers/configs';
import type {FeatureFlagConfig} from '../../../../types/api/featureFlags';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, YDB_POPOVER_CLASS_NAME} from '../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import i18n from '../../i18n';
import {useConfigQueryParams} from '../../useConfigsQueryParams';

import './FeatureFlags.scss';

const FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY = 'featureFlagsColumnsWidth';

const b = cn('ydb-feature-flags');

const columns: Column<FeatureFlagConfig>[] = [
    {
        name: 'Touched',
        header: '',
        render: ({row}) =>
            row.Current ? (
                <Popover
                    content={i18n('flag-touched')}
                    className={b('icon-touched', YDB_POPOVER_CLASS_NAME)}
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

interface FeatureFlagsProps {
    database?: string;
    className?: string;
}

export const FeatureFlags = ({database, className}: FeatureFlagsProps) => {
    const {search, handleSearchChange} = useConfigQueryParams();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {
        currentData = [],
        isLoading,
        error,
    } = configsApi.useGetFeatureFlagsQuery({database}, {pollingInterval: autoRefreshInterval});

    const featureFlagsFilter = search?.toLocaleLowerCase();
    const featureFlags = featureFlagsFilter
        ? currentData.filter((item) => item.Name.toLocaleLowerCase().includes(featureFlagsFilter))
        : currentData;

    return (
        <TableWithControlsLayout className={className}>
            <TableWithControlsLayout.Controls>
                <Search
                    value={featureFlagsFilter}
                    onChange={handleSearchChange}
                    placeholder={i18n('search-placeholder')}
                    width={300}
                />
            </TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={isLoading}>
                {error ? (
                    <ResponseError error={error} />
                ) : (
                    <ResizeableDataTable
                        emptyDataMessage={i18n(featureFlagsFilter ? 'search-empty' : 'no-data')}
                        columnsWidthLSKey={FEATURE_FLAGS_COLUMNS_WIDTH_LS_KEY}
                        columns={columns}
                        data={featureFlags}
                        settings={DEFAULT_TABLE_SETTINGS}
                    />
                )}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
