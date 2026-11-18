import {dateTimeParse} from '@gravity-ui/date-utils';
import {
    Alert,
    ClipboardButton,
    DefinitionList,
    Flex,
    Table,
    Text,
    Tooltip,
} from '@gravity-ui/uikit';
import type {TableColumnConfig} from '@gravity-ui/uikit';

import {BridgeSyncStatusLabel} from '../../../../../components/BridgeSyncStatusLabel';
import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {HoverPopup} from '../../../../../components/HoverPopup/HoverPopup';
import {InternalLink} from '../../../../../components/InternalLink';
import {useStorageGroupPath} from '../../../../../routes';
import type {PreparedStorageGroup} from '../../../../../store/reducers/storage/types';
import {BridgeSyncStatus} from '../../../../../types/api/cluster';
import type {TBridgeGroupLink} from '../../../../../types/api/storage';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatDateTime} from '../../../../../utils/dataFormatters/dataFormatters';
import {formatMetricBytes} from '../../../../../utils/storageMetrics';
import {parseUsToMs} from '../../../../../utils/timeParsers';
import {parseOptionalNonNegativeNumber} from '../../../../../utils/utils';

import i18n from './i18n';

import './StorageGroupSyncPopover.scss';

const b = cn('ydb-storage-group-sync-popover');

function hasSyncDetails(group: PreparedStorageGroup) {
    return (
        group.BridgeSyncStatus === BridgeSyncStatus.SYNCING ||
        group.BridgeSyncStatus === BridgeSyncStatus.PENDING
    );
}

function SyncDetails({group}: {group: PreparedStorageGroup}) {
    const getGroupPath = useStorageGroupPath();
    const partners = (group.BridgeGroups ?? []).filter(
        (partner) => partner.GroupId && partner.GroupId !== String(group.GroupId),
    );
    const remaining = parseOptionalNonNegativeNumber(group.BridgeSyncRemainingBytes);
    const rate = parseOptionalNonNegativeNumber(group.BridgeSyncCopyBytesPerSecond);
    const lastProgress = parseUsToMs(
        parseOptionalNonNegativeNumber(group.BridgeSyncLastProgressTimestamp),
        3,
    );
    const formattedLastProgress = formatDateTime(lastProgress);
    const lastError = group.BridgeSyncLastError?.trim();
    const reported = parseUsToMs(
        parseOptionalNonNegativeNumber(group.BridgeSyncLastErrorTimestamp),
        3,
    );
    const columns: TableColumnConfig<TBridgeGroupLink>[] = [
        {
            id: 'GroupId',
            name: () => (
                <Text variant="body-1" color="secondary">
                    {i18n('field_group-id')}
                </Text>
            ),
            className: b('partner-cell', {id: true}),
            template: ({GroupId}) =>
                GroupId ? (
                    <CellWithPopover
                        content={GroupId}
                        placement={['top', 'bottom']}
                        wrapperClassName={b('partner-id')}
                        fullWidth
                    >
                        <InternalLink to={getGroupPath(GroupId)}>{GroupId}</InternalLink>
                    </CellWithPopover>
                ) : (
                    EMPTY_DATA_PLACEHOLDER
                ),
        },
        {
            id: 'PileName',
            name: () => (
                <Text variant="body-1" color="secondary">
                    {i18n('field_pile')}
                </Text>
            ),
            className: b('partner-cell', {pile: true}),
            template: ({PileName}) => (
                <CellWithPopover
                    content={PileName}
                    disabled={!PileName}
                    placement={['top', 'bottom']}
                    fullWidth
                >
                    <span tabIndex={PileName ? 0 : undefined}>
                        {PileName || EMPTY_DATA_PLACEHOLDER}
                    </span>
                </CellWithPopover>
            ),
        },
    ];

    return (
        <div
            className={b()}
            data-qa="storage-group-sync-details"
            role="presentation"
            onClick={(event) => event.stopPropagation()}
        >
            <Flex direction="column" gap={4} className={b('body')}>
                <Text variant="subheader-2">{i18n('title_sync')}</Text>
                <DefinitionList nameMaxWidth={200} className={b('metrics')}>
                    <DefinitionList.Item
                        name={i18n('field_remaining')}
                        note={i18n('context_remaining')}
                    >
                        {formatMetricBytes(remaining)}
                    </DefinitionList.Item>
                    <DefinitionList.Item name={i18n('field_rate')}>
                        {rate === undefined
                            ? EMPTY_DATA_PLACEHOLDER
                            : i18n('value_rate', {size: formatMetricBytes(rate)})}
                    </DefinitionList.Item>
                    <DefinitionList.Item name={i18n('field_last-progress')}>
                        {formattedLastProgress ? (
                            <Tooltip content={formattedLastProgress}>
                                <span tabIndex={0}>{dateTimeParse(lastProgress)?.fromNow()}</span>
                            </Tooltip>
                        ) : (
                            EMPTY_DATA_PLACEHOLDER
                        )}
                    </DefinitionList.Item>
                </DefinitionList>
                {partners.length > 0 && (
                    <Flex direction="column" gap={2}>
                        <Text variant="body-1" className={b('section-title')}>
                            {i18n('title_partners')} <Text color="hint">{partners.length}</Text>
                        </Text>
                        <Table
                            className={b('partners')}
                            width="max"
                            data={partners}
                            columns={columns}
                            getRowDescriptor={({GroupId}) => ({id: GroupId})}
                        />
                    </Flex>
                )}
                {lastError && (
                    <Flex direction="column" gap={2}>
                        <Text variant="body-1" className={b('section-title')}>
                            {i18n('title_message')}
                        </Text>
                        <DefinitionList nameMaxWidth={200} className={b('metrics')}>
                            <DefinitionList.Item name={i18n('field_reported')}>
                                <Text variant="inherit" whiteSpace="nowrap">
                                    {formatDateTime(reported, {
                                        defaultValue: EMPTY_DATA_PLACEHOLDER,
                                    })}
                                </Text>
                            </DefinitionList.Item>
                        </DefinitionList>
                        <Alert
                            theme="normal"
                            icon={null}
                            message={
                                <Flex alignItems="flex-start" gap={2}>
                                    <Flex grow minWidth={0}>
                                        {lastError}
                                    </Flex>
                                    <ClipboardButton
                                        text={lastError}
                                        aria-label={i18n('action_copy-error')}
                                        view="flat-secondary"
                                        size="s"
                                    />
                                </Flex>
                            }
                            className={b('message')}
                        />
                    </Flex>
                )}
            </Flex>
        </div>
    );
}

export function StorageGroupSyncPopover({group}: {group: PreparedStorageGroup}) {
    if (!hasSyncDetails(group)) {
        return <BridgeSyncStatusLabel status={group.BridgeSyncStatus} />;
    }
    return (
        <HoverPopup
            placement={['right-start', 'left-start', 'bottom-start']}
            renderPopupContent={() => <SyncDetails group={group} />}
        >
            <Flex as="span" inline onClick={(event) => event.stopPropagation()}>
                <BridgeSyncStatusLabel status={group.BridgeSyncStatus} withInfo interactive />
            </Flex>
        </HoverPopup>
    );
}
