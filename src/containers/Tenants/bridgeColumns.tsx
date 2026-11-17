import {NodesRight} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {Icon, Label} from '@gravity-ui/uikit';

import {
    BridgeSyncStatusLabel,
    getBridgeSyncStatusPresentation,
} from '../../components/BridgeSyncStatusLabel';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

import {DATABASES_COLUMNS_IDS, DATABASES_COLUMNS_TITLES} from './constants';
import i18n from './i18n';

function getModeLabel({BridgeMode}: PreparedTenant) {
    if (BridgeMode === true) {
        return (
            <Label theme="utility" size="xs" icon={<Icon data={NodesRight} size={12} />}>
                {i18n('value_bridge')}
            </Label>
        );
    }
    return BridgeMode === false ? i18n('value_non-bridge') : EMPTY_DATA_PLACEHOLDER;
}

export function getDatabaseBridgeColumns(): Column<PreparedTenant>[] {
    return [
        {
            name: DATABASES_COLUMNS_IDS.BridgeMode,
            header: DATABASES_COLUMNS_TITLES.BridgeMode,
            width: 100,
            sortable: true,
            defaultOrder: DataTable.ASCENDING,
            sortAccessor: ({BridgeMode}) =>
                typeof BridgeMode === 'boolean' ? Number(!BridgeMode) : undefined,
            render: ({row}) => getModeLabel(row),
        },
        {
            name: DATABASES_COLUMNS_IDS.BridgeSyncStatus,
            header: DATABASES_COLUMNS_TITLES.BridgeSyncStatus,
            width: 140,
            sortable: true,
            defaultOrder: DataTable.ASCENDING,
            sortAccessor: ({BridgeSyncStatus}) =>
                getBridgeSyncStatusPresentation(BridgeSyncStatus)?.label(),
            render: ({row}) => <BridgeSyncStatusLabel status={row.BridgeSyncStatus} />,
        },
    ];
}
