import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../../../../store/reducers/capabilities/hooks';
import {storageApi} from '../../../../../store/reducers/storage/storage';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {GroupsRequiredField} from '../../../../../types/api/storage';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';
import {useAutoRefreshInterval, useSearchQuery} from '../../../../../utils/hooks';
import {getRequiredDataFields} from '../../../../../utils/tableUtils/getRequiredDataFields';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/columns/columns';
import {
    GROUPS_COLUMNS_TO_DATA_FIELDS,
    STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY,
} from '../../../../Storage/StorageGroups/columns/constants';
import type {StorageGroupsColumn} from '../../../../Storage/StorageGroups/columns/types';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

function getColumns(): [StorageGroupsColumn[], GroupsRequiredField[]] {
    const preparedColumns = getStorageTopGroupsColumns();

    const columnsIds = preparedColumns.map((column) => column.name);
    const dataFieldsRequired = getRequiredDataFields(columnsIds, GROUPS_COLUMNS_TO_DATA_FIELDS);

    return [preparedColumns, dataFieldsRequired];
}

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const query = useSearchQuery();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const [columns, fieldsRequired] = getColumns();

    const {currentData, isFetching, error} = storageApi.useGetStorageGroupsInfoQuery(
        {
            tenant,
            sort: '-Usage',
            with: 'all',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            shouldUseGroupsHandler: groupsHandlerAvailable,
            fieldsRequired,
        },
        {
            pollingInterval: autoRefreshInterval,
            skip: !capabilitiesLoaded,
        },
    );

    const loading = isFetching && currentData === undefined;

    const groups = currentData?.groups || [];

    const title = getSectionTitle({
        entity: i18n('groups'),
        postfix: i18n('by-usage'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.storage,
        }),
    });

    return (
        <TenantOverviewTableLayout
            columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
            data={groups}
            columns={columns}
            title={title}
            loading={loading || !capabilitiesLoaded}
            error={error}
        />
    );
}
