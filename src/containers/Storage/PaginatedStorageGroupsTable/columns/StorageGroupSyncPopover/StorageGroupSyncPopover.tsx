import {dateTimeParse} from '@gravity-ui/date-utils';
import {Xmark} from '@gravity-ui/icons';
import {Alert, Button, DefinitionList, Flex, Icon, Table, Text, Tooltip} from '@gravity-ui/uikit';
import type {TableColumnConfig} from '@gravity-ui/uikit';

import {HoverPopup} from '../../../../../components/HoverPopup/HoverPopup';
import {InternalLink} from '../../../../../components/InternalLink';
import {useStorageGroupPath} from '../../../../../routes';
import type {PreparedStorageGroup} from '../../../../../store/reducers/storage/types';
import type {TBridgeGroupLink} from '../../../../../types/api/storage';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatDateTime} from '../../../../../utils/dataFormatters/dataFormatters';
import {bytesToSize} from '../../../../../utils/utils';
import {StorageGroupSyncStatus} from '../StorageGroupSyncStatus';

import i18n from './i18n';
import {hasSyncDetails, parseSyncNumber, parseSyncTimestamp} from './utils';

import './StorageGroupSyncPopover.scss';

const b = cn('ydb-storage-group-sync-popover');

function formatBytes(value: number) {
    return value < 1000 ? i18n('value_bytes', {value}) : bytesToSize(value);
}

function SyncDetails({group, onClose}: {group: PreparedStorageGroup; onClose: VoidFunction}) {
    const getGroupPath = useStorageGroupPath();
    const partners = (group.BridgeGroups ?? []).filter(
        (partner) => partner.GroupId && partner.GroupId !== String(group.GroupId),
    );
    const remaining = parseSyncNumber(group.BridgeSyncRemainingBytes);
    const rate = parseSyncNumber(group.BridgeSyncCopyBytesPerSecond);
    const lastProgress = parseSyncTimestamp(group.BridgeSyncLastProgressTimestamp);
    const lastError = group.BridgeSyncLastError?.trim();
    const reported = parseSyncTimestamp(group.BridgeSyncLastErrorTimestamp);
    let remainingText = EMPTY_DATA_PLACEHOLDER;
    if (remaining !== undefined) {
        const value = formatBytes(remaining);
        remainingText =
            group.BridgeSyncRemainingBytesComplete === true
                ? value
                : i18n('value_lower-bound', {value});
    }
    const columns: TableColumnConfig<TBridgeGroupLink>[] = [
        {
            id: 'GroupId',
            name: i18n('field_group-id'),
            width: 100,
            template: ({GroupId}) =>
                GroupId ? (
                    <InternalLink to={getGroupPath(GroupId)}>{GroupId}</InternalLink>
                ) : (
                    EMPTY_DATA_PLACEHOLDER
                ),
        },
        {
            id: 'PileName',
            name: i18n('field_pile'),
            width: 90,
            template: ({PileName}) => (
                <Text ellipsis className={b('partner-pile')} title={PileName}>
                    {PileName || EMPTY_DATA_PLACEHOLDER}
                </Text>
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
                        {remainingText}
                    </DefinitionList.Item>
                    <DefinitionList.Item name={i18n('field_rate')}>
                        {rate === undefined
                            ? EMPTY_DATA_PLACEHOLDER
                            : i18n('value_rate', {size: formatBytes(rate)})}
                    </DefinitionList.Item>
                    <DefinitionList.Item name={i18n('field_last-progress')}>
                        {lastProgress === undefined ? (
                            EMPTY_DATA_PLACEHOLDER
                        ) : (
                            <Tooltip content={formatDateTime(lastProgress)}>
                                <span tabIndex={0}>{dateTimeParse(lastProgress)?.fromNow()}</span>
                            </Tooltip>
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
                                {reported === undefined
                                    ? EMPTY_DATA_PLACEHOLDER
                                    : formatDateTime(reported)}
                            </DefinitionList.Item>
                        </DefinitionList>
                        <Alert
                            theme="normal"
                            icon={null}
                            message={lastError}
                            className={b('message')}
                        />
                    </Flex>
                )}
            </Flex>
            <Button
                view="flat-secondary"
                size="s"
                className={b('close')}
                aria-label={i18n('action_close')}
                onClick={onClose}
            >
                <Icon data={Xmark} size={12} />
            </Button>
        </div>
    );
}

export function StorageGroupSyncPopover({group}: {group: PreparedStorageGroup}) {
    if (!hasSyncDetails(group)) {
        return <StorageGroupSyncStatus {...group} />;
    }
    return (
        <HoverPopup
            placement={['right-start', 'left-start', 'bottom-start']}
            renderPopupContent={({onClose}) => <SyncDetails group={group} onClose={onClose} />}
        >
            <Flex as="span" inline onClick={(event) => event.stopPropagation()}>
                <StorageGroupSyncStatus
                    {...group}
                    withInfo={Boolean(group.BridgeSyncLastError?.trim())}
                    interactive
                />
            </Flex>
        </HoverPopup>
    );
}
