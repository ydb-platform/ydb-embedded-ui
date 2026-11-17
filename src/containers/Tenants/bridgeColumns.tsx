import {ArrowsRotateLeft, Check, CircleQuestion, Clock, NodesRight} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {Icon, Label} from '@gravity-ui/uikit';
import type {IconData, LabelProps} from '@gravity-ui/uikit';

import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {BridgeSyncStatus} from '../../types/api/cluster';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

import {DATABASES_COLUMNS_IDS, DATABASES_COLUMNS_TITLES} from './constants';
import i18n from './i18n';

const syncStatusPresentation: Record<
    Exclude<BridgeSyncStatus, BridgeSyncStatus.NOT_REQUIRED>,
    {icon: IconData; theme: LabelProps['theme']; label: () => string}
> = {
    [BridgeSyncStatus.SYNCED]: {
        icon: Check,
        theme: 'success',
        label: () => i18n('value_sync-synced'),
    },
    [BridgeSyncStatus.SYNCING]: {
        icon: ArrowsRotateLeft,
        theme: 'info',
        label: () => i18n('value_sync-syncing'),
    },
    [BridgeSyncStatus.PENDING]: {
        icon: Clock,
        theme: 'warning',
        label: () => i18n('value_sync-pending'),
    },
    [BridgeSyncStatus.UNKNOWN]: {
        icon: CircleQuestion,
        theme: 'unknown',
        label: () => i18n('value_sync-unknown'),
    },
};

function getSyncStatusPresentation(status?: BridgeSyncStatus) {
    return status !== undefined && Object.hasOwn(syncStatusPresentation, status)
        ? syncStatusPresentation[status as keyof typeof syncStatusPresentation]
        : undefined;
}

function getModeLabel({BridgeMode}: PreparedTenant) {
    if (BridgeMode === true) {
        return i18n('value_bridge');
    }
    return BridgeMode === false ? i18n('value_non-bridge') : undefined;
}

function getSyncStatusLabel({BridgeSyncStatus: status}: PreparedTenant) {
    if (status === BridgeSyncStatus.NOT_REQUIRED) {
        return i18n('value_not-required');
    }
    return getSyncStatusPresentation(status)?.label();
}

export function getDatabaseBridgeColumns(): Column<PreparedTenant>[] {
    return [
        {
            name: DATABASES_COLUMNS_IDS.BridgeMode,
            header: DATABASES_COLUMNS_TITLES.BridgeMode,
            width: 100,
            sortable: true,
            defaultOrder: DataTable.ASCENDING,
            sortAccessor: getModeLabel,
            render: ({row}) =>
                row.BridgeMode === true ? (
                    <Label theme="utility" size="xs" icon={<Icon data={NodesRight} size={12} />}>
                        {getModeLabel(row)}
                    </Label>
                ) : (
                    (getModeLabel(row) ?? EMPTY_DATA_PLACEHOLDER)
                ),
        },
        {
            name: DATABASES_COLUMNS_IDS.BridgeSyncStatus,
            header: DATABASES_COLUMNS_TITLES.BridgeSyncStatus,
            width: 140,
            sortable: true,
            defaultOrder: DataTable.ASCENDING,
            sortAccessor: getSyncStatusLabel,
            render: ({row}) => {
                const label = getSyncStatusLabel(row);
                const presentation = getSyncStatusPresentation(row.BridgeSyncStatus);
                if (!presentation) {
                    return label ?? EMPTY_DATA_PLACEHOLDER;
                }
                return (
                    <Label
                        theme={presentation.theme}
                        size="xs"
                        icon={<Icon data={presentation.icon} size={12} />}
                    >
                        {label}
                    </Label>
                );
            },
        },
    ];
}
