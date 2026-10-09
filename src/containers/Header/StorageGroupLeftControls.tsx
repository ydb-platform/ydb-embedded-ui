import {ClipboardButton, Flex} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {StringParam, useQueryParams} from 'use-query-params';

import {storageApi} from '../../store/reducers/storage/storage';
import {valueIsDefined} from '../../utils';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {StorageGroupStateLabel} from '../Storage/StorageGroupStateLabel';

import {b} from './constants';
import {headerKeyset} from './i18n';

export function StorageGroupLeftControls() {
    const [{groupId}] = useQueryParams({groupId: StringParam});
    const database = useDatabaseFromQuery();
    const {currentData} = storageApi.endpoints.getStorageGroupsInfo.useQueryState(
        valueIsDefined(groupId)
            ? {groupId, with: 'all', fieldsRequired: 'all', database}
            : skipToken,
    );

    if (!groupId) {
        return null;
    }

    return (
        <Flex alignItems="center" gap={2} className={b('left-controls')}>
            <ClipboardButton
                text={groupId}
                view="flat-secondary"
                size="s"
                aria-label={headerKeyset('action_copy-group-id-from-breadcrumb')}
                tooltipInitialText={headerKeyset('action_copy-group-id')}
            />
            <StorageGroupStateLabel state={currentData?.groups?.[0]?.State} size="xs" />
        </Flex>
    );
}
