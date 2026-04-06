import React from 'react';

import {ArrowsOppositeToDots} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {useDiskPagesAvailable} from '../../store/reducers/capabilities/hooks';
import type {ModifyDiskResponse} from '../../types/api/modifyDisk';
import type {TVDiskID} from '../../types/api/vdisk';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {ButtonWithConfirmDialog} from '../ButtonWithConfirmDialog/ButtonWithConfirmDialog';

import {evictVDiskButtonKeyset} from './i18n';

interface EvictVDiskButtonProps {
    vDiskId: Required<TVDiskID>;
    donorMode?: boolean;
    fullWidth?: boolean;
    onSuccess?: () => void;
}

export function isAllVdiskParamsDefined(vDiskId?: TVDiskID): vDiskId is Required<TVDiskID> {
    return (
        !isNil(vDiskId?.GroupID) &&
        !isNil(vDiskId?.GroupGeneration) &&
        !isNil(vDiskId?.Ring) &&
        !isNil(vDiskId?.Domain) &&
        !isNil(vDiskId?.VDisk)
    );
}

export const EvictVDiskButton = ({
    vDiskId,
    donorMode,
    fullWidth,
    onSuccess,
}: EvictVDiskButtonProps) => {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const newDiskApiAvailable = useDiskPagesAvailable();

    const handleEvictVDisk = React.useCallback(
        async (isRetry?: boolean) => {
            const requestParams = {
                groupId: vDiskId.GroupID,
                groupGeneration: vDiskId.GroupGeneration,
                failRealmIdx: vDiskId.Ring,
                failDomainIdx: vDiskId.Domain,
                vDiskIdx: vDiskId.VDisk,
                force: isRetry,
            };

            let response: ModifyDiskResponse;

            if (newDiskApiAvailable) {
                response = await window.api.vdisk.evictVDisk(requestParams);
            } else {
                response = await window.api.tablets.evictVDiskOld(requestParams);
            }

            if (response?.result === false) {
                const err = {
                    statusText: response.error,
                    retryPossible: response.forceRetryPossible,
                };
                throw err;
            }
        },
        [vDiskId, newDiskApiAvailable],
    );

    return (
        <ButtonWithConfirmDialog
            onConfirmAction={handleEvictVDisk}
            onConfirmActionSuccess={onSuccess}
            buttonDisabled={!isUserAllowedToMakeChanges || donorMode}
            buttonView="normal"
            buttonWidth={fullWidth ? 'max' : undefined}
            dialogHeader={evictVDiskButtonKeyset('title_evict-dialog')}
            dialogText={evictVDiskButtonKeyset('confirm_evict')}
            dialogWarning={evictVDiskButtonKeyset('alert_evict')}
            applyButtonText={evictVDiskButtonKeyset('action_evict-short')}
            applyButtonView="outlined-danger"
            retryButtonText={evictVDiskButtonKeyset('action_force-evict')}
            withPopover
            popoverContent={
                donorMode
                    ? evictVDiskButtonKeyset('alert_donor-mode-impossible')
                    : evictVDiskButtonKeyset('alert_not-allowed')
            }
            popoverDisabled={isUserAllowedToMakeChanges && !donorMode}
        >
            <Icon data={ArrowsOppositeToDots} />
            {evictVDiskButtonKeyset('action_evict')}
        </ButtonWithConfirmDialog>
    );
};
