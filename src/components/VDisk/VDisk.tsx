import React, {useState, useRef} from 'react';
import cn from 'bem-cn-lite';

import type {NodesMap} from '../../types/store/nodesList';

import type {PreparedVDisk} from '../../utils/disks/types';
import routes, {createHref} from '../../routes';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';

import {STRUCTURE} from '../../containers/Node/NodePages';

import {VDiskPopup} from '../VDiskPopup/VDiskPopup';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {InternalLink} from '../InternalLink';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

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
