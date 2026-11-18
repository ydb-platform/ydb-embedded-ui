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

import {CellWithPopover} from '../../../components/CellWithPopover/CellWithPopover';
import {InternalLink} from '../../../components/InternalLink';
import {useStorageGroupPath} from '../../../routes';
import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import type {TBridgeGroupLink} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatDateTime} from '../../../utils/dataFormatters/dataFormatters';
import {parseUsToMs} from '../../../utils/timeParsers';
import {bytesToSize, parseOptionalNonNegativeNumber} from '../../../utils/utils';

import i18n from './i18n';

import './StorageGroupSyncDetails.scss';

const b = cn('ydb-storage-group-sync-details');

function formatBytes(value: number) {
    return value < 1000 ? i18n('value_bytes', {value}) : bytesToSize(value);
}

function formatRemainingBytes(bytes?: string, complete?: boolean) {
    const remaining = parseOptionalNonNegativeNumber(bytes);
    if (remaining === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const value = formatBytes(remaining);
    return complete === true ? value : i18n('value_lower-bound', {value});
}

const stageLabels = [
    ['BLOCKS', 'value_stage-blocks'],
    ['WRITE_KEEP', 'value_stage-keep-flags'],
    ['WRITE_KEEP_BARRIER_DONOTKEEP', 'value_stage-barriers'],
    ['WRITE_KEEP_BARRIER_DONOTKEEP_DATA', 'value_stage-data'],
    ['SYNCED', 'value_stage-synced'],
] as const;

export function StorageGroupSyncDetails({
    group,
    layout = 'popover',
}: {
    group: PreparedStorageGroup;
    layout?: 'popover' | 'page';
}) {
    const isPage = layout === 'page';
    const stage = stageLabels.find(([value]) => value === group.BridgeSyncStage)?.[1];
    const getGroupPath = useStorageGroupPath();
    const partners = (group.BridgeGroups ?? []).filter(
        (partner) => partner.GroupId && partner.GroupId !== String(group.GroupId),
    );
    const remainingText = formatRemainingBytes(
        group.BridgeSyncRemainingBytes,
        group.BridgeSyncRemainingBytesComplete,
    );
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
                    <DefinitionList.Item name={i18n('field_stage')}>
                        {stage ? i18n(stage) : EMPTY_DATA_PLACEHOLDER}
                    </DefinitionList.Item>
                )}
                <DefinitionList.Item
                    name={i18n('field_remaining')}
                    note={i18n('context_remaining')}
                >
                    {remainingText}
                </DefinitionList.Item>
                <DefinitionList.Item name={i18n('field_rate')}>
                    {rate === undefined
                        ? EMPTY_DATA_PLACEHOLDER
                        : i18n('value_rate', {size: formatBytes(rate)})}
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
                <Flex direction="column" gap={2} className={b('partners-section')}>
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
                        layout="horizontal"
                        message={lastError}
                        actions={
                            isPage && (
                                <ClipboardButton
                                    text={lastError}
                                    aria-label={i18n('action_copy-error')}
                                    view="flat-secondary"
                                    size="s"
                                />
                            )
                        }
                        className={b('message')}
                    />
                </Flex>
            )}
        </Flex>
    );
}
