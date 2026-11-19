import {Flex, Text} from '@gravity-ui/uikit';

import {BridgeSyncStatusLabel} from '../../../../../components/BridgeSyncStatusLabel';
import {HoverPopup} from '../../../../../components/HoverPopup/HoverPopup';
import type {PreparedStorageGroup} from '../../../../../store/reducers/storage/types';
import {BridgeSyncStatus} from '../../../../../types/api/cluster';
import {cn} from '../../../../../utils/cn';
import {StorageGroupSyncDetails} from '../../../StorageGroupSyncDetails/StorageGroupSyncDetails';

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
    return (
        <div
            className={b()}
            data-qa="storage-group-sync-details"
            role="presentation"
            onClick={(event) => event.stopPropagation()}
        >
            <Flex direction="column" gap={4} className={b('body')}>
                <Text variant="subheader-2">{i18n('title_sync')}</Text>
                <StorageGroupSyncDetails group={group} />
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
