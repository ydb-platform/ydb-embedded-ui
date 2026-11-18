import {ClipboardButton, Flex} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {StringParam, useQueryParams} from 'use-query-params';

import {DiskStatusLabel} from '../../components/DiskStatus/DiskStatus';
import {getPDiskStateLabel} from '../../components/PDiskInfo/statuses';
import {pDiskApi} from '../../store/reducers/pdisk/pdisk';
import {valueIsDefined} from '../../utils';
import {getPDiskId} from '../../utils/disks/helpers';

import {b} from './constants';
import {headerKeyset} from './i18n';

export function PDiskLeftControls() {
    const [{nodeId, pDiskId}] = useQueryParams({
        nodeId: StringParam,
        pDiskId: StringParam,
    });
    const {currentData} = pDiskApi.endpoints.getPdiskInfo.useQueryState(
        valueIsDefined(nodeId) && valueIsDefined(pDiskId) ? {nodeId, pDiskId} : skipToken,
    );
    const diskId = getPDiskId({nodeId, pDiskId});

    if (!diskId) {
        return null;
    }

    return (
        <Flex alignItems="center" gap={2} className={b('left-controls')}>
            <ClipboardButton
                text={diskId}
                size="s"
                view="flat-secondary"
                color="secondary"
                aria-label={headerKeyset('action_copy-pdisk-id-from-breadcrumb')}
                tooltipInitialText={headerKeyset('action_copy-pdisk-id')}
            />
            <DiskStatusLabel {...getPDiskStateLabel(currentData?.State)} size="xs" iconSize={12} />
        </Flex>
    );
}
