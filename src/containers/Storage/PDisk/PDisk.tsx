import React from 'react';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import routes, {createHref, getPDiskPagePath} from '../../../routes';
import {useDiskPagesAvailable} from '../../../store/reducers/capabilities/hooks';
import {selectNodesMap} from '../../../store/reducers/nodesList';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {useTypedSelector} from '../../../utils/hooks';
import {STRUCTURE} from '../../Node/NodePages';

import './PDisk.scss';

const b = cn('pdisk-storage');

interface PDiskProps {
    data?: PreparedPDisk;
    vDisks?: PreparedVDisk[];
    inactiveVdisks?: PreparedVDisk[];
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    className?: string;
    progressBarClassName?: string;
}

export const PDisk = ({
    data = {},
    vDisks,
    inactiveVdisks,
    showPopup,
    onShowPopup,
    onHidePopup,
    className,
    progressBarClassName,
}: PDiskProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);

    const nodes = useTypedSelector(selectNodesMap);
    const diskPagesAvailable = useDiskPagesAvailable();

    const anchor = React.useRef(null);

    const {NodeId, PDiskId} = data;
    const pDiskIdsDefined = valueIsDefined(NodeId) && valueIsDefined(PDiskId);

    const handleShowPopup = () => {
        setIsPopupVisible(true);
        onShowPopup?.();
    };

    const handleHidePopup = () => {
        setIsPopupVisible(false);
        onHidePopup?.();
    };

    const renderVDisks = () => {
        if (!vDisks?.length) {
            return null;
        }

        return (
            <div className={b('vdisks')}>
                {vDisks.map((vdisk) => {
                    return (
                        <div
                            key={stringifyVdiskId(vdisk.VDiskId)}
                            className={b('vdisks-item')}
                            style={{
                                // 1 is small enough for empty disks to be of the minimum width
                                // but if all of them are empty, `flex-grow: 1` would size them evenly
                                flexGrow: Number(vdisk.AllocatedSize) || 1,
                            }}
                        >
                            <VDiskWithDonorsStack
                                data={vdisk}
                                inactive={inactiveVdisks?.includes(vdisk)}
                                stackClassName={b('donors-stack')}
                                compact
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    let pDiskPath: string | undefined;

    if (pDiskIdsDefined) {
        pDiskPath = createHref(routes.node, {id: NodeId, activeTab: STRUCTURE}, {pdiskId: PDiskId});
    }

    if (pDiskIdsDefined && diskPagesAvailable) {
        pDiskPath = getPDiskPagePath(PDiskId, NodeId);
    }

    return (
        <React.Fragment>
            <div className={b(null, className)} ref={anchor}>
                {renderVDisks()}
                <InternalLink
                    to={pDiskPath}
                    className={b('content')}
                    onMouseEnter={handleShowPopup}
                    onMouseLeave={handleHidePopup}
                >
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                        className={progressBarClassName}
                    />
                    <div className={b('media-type')}>{data.Type}</div>
                </InternalLink>
            </div>
            <PDiskPopup
                data={data}
                nodes={nodes}
                anchorRef={anchor}
                open={isPopupVisible || showPopup}
            />
        </React.Fragment>
    );
};
