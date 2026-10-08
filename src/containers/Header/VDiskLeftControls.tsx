import {ClipboardButton, Flex} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {StringParam, useQueryParams} from 'use-query-params';

import {VDiskStateLabel} from '../../components/VDiskStatus';
import {vDiskApi} from '../../store/reducers/vdisk/vdisk';

import {b} from './constants';
import {headerKeyset} from './i18n';

export function VDiskLeftControls() {
    const [{vDiskId, nodeId, database}] = useQueryParams({
        vDiskId: StringParam,
        nodeId: StringParam,
        database: StringParam,
    });
    const {currentData} = vDiskApi.endpoints.getVDiskData.useQueryState(
        vDiskId
            ? {vDiskId, nodeId: nodeId ?? undefined, database: database ?? undefined}
            : skipToken,
    );

    if (!vDiskId) {
        return null;
    }

    return (
        <Flex alignItems="center" gap={2} className={b('left-controls')}>
            <ClipboardButton
                text={vDiskId}
                size="s"
                view="flat-secondary"
                color="secondary"
                aria-label={headerKeyset('action_copy-vdisk-id')}
                tooltipInitialText={headerKeyset('action_copy-vdisk-id')}
            />
            <VDiskStateLabel state={currentData?.VDiskState} size="xs" />
        </Flex>
    );
}
