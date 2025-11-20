import {Icon} from '@gravity-ui/uikit';

import {useStorageQueryParams} from '../../containers/Storage/useStorageQueryParams';
import {useVDiskPagePath} from '../../routes';
import {STORAGE_TYPES} from '../../store/reducers/storage/constants';
import {EVDiskState} from '../../types/api/vdisk';
import {cn} from '../../utils/cn';
import {getVDiskStatusIcon} from '../../utils/disks/helpers';
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

    const severity = data.Severity;
    const isDonor = data.VDiskState === EVDiskState.OK && data.DonorMode;
    const isReplicating =
        data.Replicated === false && data.VDiskState === EVDiskState.OK && !data.DonorMode;

    const statusIcon = getVDiskStatusIcon(severity);
    const showIcon = statusIcon && isGroupView;

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
                        severity={severity}
                        compact={compact}
                        inactive={inactive}
                        striped={isReplicating || isDonor}
                        faded={isReplicating || isDonor}
                        className={progressBarClassName}
                        content={
                            showIcon ? (
                                <div className={b('donor-icon')}>
                                    <Icon data={statusIcon} size={12} />
                                </div>
                            ) : null
                        }
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
