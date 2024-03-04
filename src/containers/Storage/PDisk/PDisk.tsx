import React, {useState, useRef} from 'react';
import cn from 'bem-cn-lite';

import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import {InternalLink} from '../../../components/InternalLink';
import {Stack} from '../../../components/Stack/Stack';

import type {PreparedPDisk} from '../../../utils/disks/types';
import routes, {createHref} from '../../../routes';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../../utils/disks/helpers';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar} from '../DiskStateProgressBar';
import {PDiskPopup} from '../PDiskPopup';
import {VDisk} from '../VDisk';

import './PDisk.scss';

const b = cn('pdisk-storage');

interface PDiskProps {
    nodeId: number;
    data?: PreparedPDisk;
    vDisks?: TVDiskStateInfo[];
}

export const PDisk = ({nodeId, data = {}, vDisks}: PDiskProps) => {
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef(null);

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
                    const donors = vdisk.Donors;

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
                            {donors && donors.length ? (
                                <Stack
                                    className={b('donors-stack')}
                                    key={stringifyVdiskId(vdisk.VDiskId)}
                                >
                                    <VDisk data={vdisk} compact />
                                    {donors.map((donor) => {
                                        const isFullData = isFullVDiskData(donor);

                                        return (
                                            <VDisk
                                                compact
                                                data={donor}
                                                key={stringifyVdiskId(
                                                    isFullData ? donor.VDiskId : donor,
                                                )}
                                            />
                                        );
                                    })}
                                </Stack>
                            ) : (
                                <VDisk data={vdisk} compact />
                            )}
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
