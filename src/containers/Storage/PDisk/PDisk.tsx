import React, {useEffect, useState, useRef, useMemo} from 'react';
import cn from 'bem-cn-lite';

import {InternalLink} from '../../../components/InternalLink';
import {Stack} from '../../../components/Stack/Stack';

import routes, {createHref} from '../../../routes';
import {selectVDisksForPDisk} from '../../../store/reducers/storage/selectors';
import {TPDiskStateInfo, TPDiskState} from '../../../types/api/pdisk';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {useTypedSelector} from '../../../utils/hooks';
import {getPDiskType} from '../../../utils/pdisk';
import {isFullVDiskData} from '../../../utils/storage';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar, EDiskStateSeverity} from '../DiskStateProgressBar';
import {PDiskPopup} from '../PDiskPopup';
import {VDisk} from '../VDisk';

import {getUsageSeverityForPDisk, NOT_AVAILABLE_SEVERITY} from '../utils';

import './PDisk.scss';

const b = cn('pdisk-storage');

const stateSeverity = {
    [TPDiskState.Initial]: EDiskStateSeverity.Grey,
    [TPDiskState.Normal]: EDiskStateSeverity.Green,
    [TPDiskState.InitialFormatRead]: EDiskStateSeverity.Yellow,
    [TPDiskState.InitialSysLogRead]: EDiskStateSeverity.Yellow,
    [TPDiskState.InitialCommonLogRead]: EDiskStateSeverity.Yellow,
    [TPDiskState.InitialFormatReadError]: EDiskStateSeverity.Red,
    [TPDiskState.InitialSysLogReadError]: EDiskStateSeverity.Red,
    [TPDiskState.InitialSysLogParseError]: EDiskStateSeverity.Red,
    [TPDiskState.InitialCommonLogReadError]: EDiskStateSeverity.Red,
    [TPDiskState.InitialCommonLogParseError]: EDiskStateSeverity.Red,
    [TPDiskState.CommonLoggerInitError]: EDiskStateSeverity.Red,
    [TPDiskState.OpenFileError]: EDiskStateSeverity.Red,
    [TPDiskState.ChunkQuotaError]: EDiskStateSeverity.Red,
    [TPDiskState.DeviceIoError]: EDiskStateSeverity.Red,
};

interface PDiskProps {
    nodeId: number;
    data?: TPDiskStateInfo;
}

const isSeverityKey = (key?: TPDiskState): key is keyof typeof stateSeverity =>
    key !== undefined && key in stateSeverity;

const getStateSeverity = (pDiskState?: TPDiskState) => {
    return isSeverityKey(pDiskState) ? stateSeverity[pDiskState] : NOT_AVAILABLE_SEVERITY;
};

export const PDisk = ({nodeId, data: rawData = {}}: PDiskProps) => {
    // NodeId in data is required for the popup
    const data = useMemo(() => ({...rawData, NodeId: nodeId}), [rawData, nodeId]);

    const vdisks = useTypedSelector((state) => selectVDisksForPDisk(state, nodeId, data.PDiskId));

    const [severity, setSeverity] = useState(getStateSeverity(data.State));
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef(null);

    const pdiskAllocatedPercent = useMemo(() => {
        const {AvailableSize, TotalSize} = data;

        if (!AvailableSize || !TotalSize) {
            return undefined;
        }

        return !isNaN(Number(AvailableSize)) && !isNaN(Number(TotalSize))
            ? Math.round(((Number(TotalSize) - Number(AvailableSize)) * 100) / Number(TotalSize))
            : undefined;
    }, [data]);

    useEffect(() => {
        const newStateSeverity = getStateSeverity(data.State);
        const newSpaceSeverityFlag = getUsageSeverityForPDisk(pdiskAllocatedPercent || 0);

        let newSeverity: number;

        if (newStateSeverity === NOT_AVAILABLE_SEVERITY || !newSpaceSeverityFlag) {
            newSeverity = newStateSeverity;
        } else {
            newSeverity = Math.max(newStateSeverity, EDiskStateSeverity[newSpaceSeverityFlag]);
        }

        setSeverity(newSeverity);
    }, [data.State, pdiskAllocatedPercent]);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    const renderVDisks = () => {
        if (!vdisks?.length) {
            return null;
        }

        return (
            <div className={b('vdisks')}>
                {vdisks.map((vdisk) => {
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
                                                data={
                                                    isFullData ? donor : {...donor, DonorMode: true}
                                                }
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
                        diskAllocatedPercent={pdiskAllocatedPercent}
                        severity={severity}
                    />
                    <div className={b('media-type')}>{getPDiskType(data)}</div>
                </InternalLink>
            </div>
        </React.Fragment>
    );
};
