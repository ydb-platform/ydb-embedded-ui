import {BucketPaint} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {useStorageQueryParams} from '../../containers/Storage/useStorageQueryParams';
import {useVDiskPagePath} from '../../routes';
import {STORAGE_TYPES} from '../../store/reducers/storage/constants';
import {cn} from '../../utils/cn';
import type {PreparedVDisk} from '../../utils/disks/types';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {InternalLink} from '../InternalLink';
import {VDiskPopup} from '../VDiskPopup/VDiskPopup';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

export interface VDiskProps {
    data?: PreparedVDisk;
    compact?: boolean;
    inactive?: boolean;
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    progressBarClassName?: string;
    delayOpen?: number;
    delayClose?: number;
}

export const VDisk = ({
    data = {},
    compact,
    inactive,
    showPopup,
    onShowPopup,
    onHidePopup,
    progressBarClassName,
    delayClose,
    delayOpen,
}: VDiskProps) => {
    const {storageType} = useStorageQueryParams();
    const isGroupView = storageType === STORAGE_TYPES.groups;

    const getVDiskLink = useVDiskPagePath();
    const vDiskPath = getVDiskLink({nodeId: data.NodeId, vDiskId: data.StringifiedId});

    // Donor and replicating Vdisks have similar data.replicated and data.VDiskState params
    const isNotReplicating = data.Replicated === false && data.VDiskState === 'OK';
    // The difference is only in data.donorMode
    const isDonor = data.DonorMode;

    const isDonorIconShow = isGroupView && isDonor;

    return (
        <HoverPopup
            showPopup={showPopup}
            onShowPopup={onShowPopup}
            onHidePopup={onHidePopup}
            renderPopupContent={() => <VDiskPopup data={data} />}
            offset={{mainAxis: 2, crossAxis: 0}}
            delayClose={delayClose}
            delayOpen={delayOpen}
        >
            <div className={b()}>
                <InternalLink to={vDiskPath} className={b('content')}>
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                        compact={compact}
                        inactive={inactive}
                        striped={isNotReplicating || isDonor}
                        faded={isNotReplicating || isDonor}
                        className={progressBarClassName}
                        content={
                            isDonorIconShow ? (
                                <div className={b('donor-icon')}>
                                    <Icon data={BucketPaint} size={12} />
                                </div>
                            ) : null
                        }
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
