import React from 'react';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import routes, {createHref} from '../../../routes';
import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import {cn} from '../../../utils/cn';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import type {PreparedPDisk} from '../../../utils/disks/types';
import {STRUCTURE} from '../../Node/NodePages';

import './PDisk.scss';

const b = cn('pdisk-storage');

interface PDiskProps {
    nodeId: number;
    data?: PreparedPDisk;
    vDisks?: TVDiskStateInfo[];
}

export const PDisk = ({nodeId, data = {}, vDisks}: PDiskProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);

    const anchor = React.useRef(null);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
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

    return (
        <React.Fragment>
            <PDiskPopup data={data} anchorRef={anchor} open={isPopupVisible} />
            <div className={b()} ref={anchor}>
                {renderVDisks()}
                <InternalLink
                    to={createHref(
                        routes.node,
                        {id: nodeId, activeTab: STRUCTURE},
                        {pdiskId: data.PDiskId || ''},
                    )}
                    className={b('content')}
                    onMouseEnter={showPopup}
                    onMouseLeave={hidePopup}
                >
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                    />
                    <div className={b('media-type')}>{data.Type}</div>
                </InternalLink>
            </div>
        </React.Fragment>
    );
};
