import React, {useState, useRef} from 'react';
import cn from 'bem-cn-lite';

import type {NodesMap} from '../../../types/store/nodesList';

import {InternalLink} from '../../../components/InternalLink';

import type {PreparedVDisk} from '../../../utils/disks/types';
import routes, {createHref} from '../../../routes';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../../utils/disks/helpers';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar} from '../DiskStateProgressBar';
import {VDiskPopup} from '../VDiskPopup';

import './VDisk.scss';

const b = cn('vdisk-storage');

interface VDiskProps {
    data?: PreparedVDisk;
    nodes?: NodesMap;
    compact?: boolean;
}

export const VDisk = ({data = {}, nodes, compact}: VDiskProps) => {
    const isFullData = isFullVDiskData(data);

    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef(null);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    return (
        <React.Fragment>
            <VDiskPopup data={data} nodes={nodes} anchorRef={anchor} open={isPopupVisible} />
            <div className={b()} ref={anchor} onMouseEnter={showPopup} onMouseLeave={hidePopup}>
                {data.NodeId && isFullData ? (
                    <InternalLink
                        to={createHref(
                            routes.node,
                            {id: data.NodeId, activeTab: STRUCTURE},
                            {
                                pdiskId: data.PDiskId ?? data.PDisk?.PDiskId,
                                vdiskId: stringifyVdiskId(data.VDiskId),
                            },
                        )}
                        className={b('content')}
                    >
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
