import React from 'react';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import routes, {createHref, getPDiskPagePath} from '../../../routes';
import {useDiskPagesAvailable} from '../../../store/reducers/capabilities/hooks';
import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import type {PreparedPDisk} from '../../../utils/disks/types';
import {STRUCTURE} from '../../Node/NodePages';

import './PDisk.scss';

const b = cn('pdisk-storage');

interface PDiskProps {
    data?: PreparedPDisk;
    vDisks?: TVDiskStateInfo[];
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    className?: string;
    progressBarClassName?: string;
}

export const PDisk = ({
    data = {},
    vDisks,
    showPopup,
    onShowPopup,
    onHidePopup,
    className,
    progressBarClassName,
}: PDiskProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);

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
                                compact={true}
                                stackClassName={b('donors-stack')}
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
            <PDiskPopup data={data} anchorRef={anchor} open={isPopupVisible || showPopup} />
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
        </React.Fragment>
    );
};
