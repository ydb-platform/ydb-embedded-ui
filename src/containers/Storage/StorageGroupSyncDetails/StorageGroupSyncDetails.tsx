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

import {BridgeSyncStatusLabel} from '../../../components/BridgeSyncStatusLabel';
import {CellWithPopover} from '../../../components/CellWithPopover/CellWithPopover';
import {InternalLink} from '../../../components/InternalLink';
import {useStorageGroupPath} from '../../../routes';
import {useStorageGroupsHandlerHasBridgeSyncDetails} from '../../../store/reducers/capabilities/hooks';
import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import type {TBridgeGroupLink} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatDateTime} from '../../../utils/dataFormatters/dataFormatters';
import {formatMetricBytes} from '../../../utils/storageMetrics';
import {formatDurationToShortTimeFormat, parseUsToMs} from '../../../utils/timeParsers';
import {parseOptionalNonNegativeNumber} from '../../../utils/utils';

import i18n from './i18n';

import './StorageGroupSyncDetails.scss';

const b = cn('ydb-storage-group-sync-details');

export function StorageGroupSyncDetails({
    group,
    layout = 'popover',
}: {
    group: PreparedStorageGroup;
    layout?: 'popover' | 'page';
}) {
    const isPage = layout === 'page';
    const stage = group.BridgeSyncStage?.trim();
    const getGroupPath = useStorageGroupPath();
    const bridgeSyncDetailsAvailable = useStorageGroupsHandlerHasBridgeSyncDetails();
    const partners = (group.BridgeGroups ?? []).filter(
        (partner) => partner.GroupId && partner.GroupId !== String(group.GroupId),
    );
    const remaining = parseOptionalNonNegativeNumber(group.BridgeSyncRemainingBytes);
    const rate = parseOptionalNonNegativeNumber(group.BridgeSyncCopyBytesPerSecond);
    const secondsLeft = parseOptionalNonNegativeNumber(group.BridgeSyncSecondsLeft);
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
        ...(bridgeSyncDetailsAvailable
            ? [
                  {
                      id: 'BridgeSyncStatus',
                      name: () => (
                          <Text variant="body-1" color="secondary">
                              {i18n('field_sync-status')}
                          </Text>
                      ),
                      className: b('partner-cell', {status: true}),
                      template: ({BridgeSyncStatus}: TBridgeGroupLink) => (
                          <BridgeSyncStatusLabel status={BridgeSyncStatus} />
                      ),
                  },
              ]
            : []),
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
                >
                    <span tabIndex={PileName ? 0 : undefined}>
                        {PileName || EMPTY_DATA_PLACEHOLDER}
                    </span>
                </CellWithPopover>
            ),
        },
    ];

    return (
        <Flex
            className={b({layout})}
            direction={isPage ? 'row' : 'column'}
            gap={isPage ? 6 : 4}
            wrap={isPage ? 'wrap' : 'nowrap'}
        >
            <DefinitionList nameMaxWidth={200} className={b('metrics')}>
                {isPage && (
                    <DefinitionList.Item name={i18n('field_pile')}>
                        {group.PileName?.trim() || EMPTY_DATA_PLACEHOLDER}
                    </DefinitionList.Item>
                )}
                {isPage && (
                    <DefinitionList.Item name={i18n('field_stage')} qa="storage-group-sync-stage">
                        {stage ? (
                            <CellWithPopover
                                content={<Text wordBreak="break-all">{stage}</Text>}
                                placement={['top', 'bottom']}
                                fullWidth
                            >
                                <span tabIndex={0}>{stage}</span>
                            </CellWithPopover>
                        ) : (
                            EMPTY_DATA_PLACEHOLDER
                        )}
                    </DefinitionList.Item>
                )}
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
                {bridgeSyncDetailsAvailable && (
                    <DefinitionList.Item name={i18n('field_eta')}>
                        {secondsLeft === undefined
                            ? EMPTY_DATA_PLACEHOLDER
                            : formatDurationToShortTimeFormat(secondsLeft * 1000, 2, {
                                  compact: true,
                              })}
                    </DefinitionList.Item>
                )}
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
                <Flex
                    direction="column"
                    gap={2}
                    className={b('partners-section', {'with-status': bridgeSyncDetailsAvailable})}
                >
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
                <Flex direction="column" gap={2} className={b('message-section')}>
                    <Text variant="body-1" className={b('section-title')}>
                        {i18n('title_message')}
                    </Text>
                    <DefinitionList nameMaxWidth={200} className={b('metrics')}>
                        <DefinitionList.Item name={i18n('field_reported')}>
                            <Text variant="inherit" whiteSpace="nowrap">
                                {formatDateTime(reported, {defaultValue: EMPTY_DATA_PLACEHOLDER})}
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
    );
}
