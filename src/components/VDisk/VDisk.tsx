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

interface VDiskProps {
    data?: PreparedVDisk;
    nodes?: NodesMap;
    compact?: boolean;
}

export const VDisk = ({data = {}, nodes, compact}: VDiskProps) => {
    const isFullData = isFullVDiskData(data);

    const diskPagesAvailable = useDiskPagesAvailable();

    const [isPopupVisible, setIsPopupVisible] = React.useState(false);

    const anchor = React.useRef(null);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
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
            <VDiskPopup data={data} nodes={nodes} anchorRef={anchor} open={isPopupVisible} />
            <div className={b()} ref={anchor} onMouseEnter={showPopup} onMouseLeave={hidePopup}>
                {vDiskPath ? (
                    <InternalLink to={vDiskPath} className={b('content')}>
                        <DiskStateProgressBar
                            diskAllocatedPercent={data.AllocatedPercent}
                            severity={data.Severity}
                            compact={compact}
                        />
                    </InternalLink>
                ) : (
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                        compact={compact}
                    />
                )}
            </div>
        </React.Fragment>
    );
};
