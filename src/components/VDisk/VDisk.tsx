import React from 'react';

import {STRUCTURE} from '../../containers/Node/NodePages';
import routes, {createHref, getVDiskPagePath} from '../../routes';
import {useDiskPagesAvailable} from '../../store/reducers/capabilities/hooks';
import type {NodesMap} from '../../types/store/nodesList';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk} from '../../utils/disks/types';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {InternalLink} from '../InternalLink';
import {VDiskPopup} from '../VDiskPopup/VDiskPopup';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

export interface VDiskProps {
    data?: PreparedVDisk;
    nodes?: NodesMap;
    compact?: boolean;
    inactive?: boolean;
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    progressBarClassName?: string;
}

export const VDisk = ({
    data = {},
    nodes,
    compact,
    inactive,
    showPopup,
    onShowPopup,
    onHidePopup,
    progressBarClassName,
}: VDiskProps) => {
    const isFullData = isFullVDiskData(data);

    const diskPagesAvailable = useDiskPagesAvailable();

    const [isPopupVisible, setIsPopupVisible] = React.useState(false);

    const anchor = React.useRef(null);

    const handleShowPopup = () => {
        setIsPopupVisible(true);
        onShowPopup?.();
    };

    const handleHidePopup = () => {
        setIsPopupVisible(false);
        onHidePopup?.();
    };

    let vDiskPath: string | undefined;

    if (
        diskPagesAvailable &&
        valueIsDefined(data.VDiskSlotId) &&
        valueIsDefined(data.PDiskId) &&
        valueIsDefined(data.NodeId)
    ) {
        vDiskPath = getVDiskPagePath(data.VDiskSlotId, data.PDiskId, data.NodeId);
    } else if (valueIsDefined(data.NodeId) && isFullData) {
        vDiskPath = createHref(
            routes.node,
            {id: data.NodeId, activeTab: STRUCTURE},
            {
                pdiskId: data.PDiskId,
                vdiskId: stringifyVdiskId(data.VDiskId),
            },
        );
    }

    return (
        <React.Fragment>
            <div
                className={b()}
                ref={anchor}
                onMouseEnter={handleShowPopup}
                onMouseLeave={handleHidePopup}
            >
                <InternalLink to={vDiskPath} className={b('content')}>
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                        compact={compact}
                        inactive={inactive}
                        className={progressBarClassName}
                    />
                </InternalLink>
            </div>
            <VDiskPopup
                data={data}
                nodes={nodes}
                anchorRef={anchor}
                open={isPopupVisible || showPopup}
            />
        </React.Fragment>
    );
};
