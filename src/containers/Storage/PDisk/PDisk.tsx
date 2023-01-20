import React, {useEffect, useState, useRef, useMemo} from 'react';
import cn from 'bem-cn-lite';

import {InternalLink} from '../../../components/InternalLink';

import routes, {createHref} from '../../../routes';
import {getVDisksForPDisk} from '../../../store/reducers/storage';
import {TPDiskStateInfo, TPDiskState} from '../../../types/api/pdisk';
import {TVDiskStateInfo} from '../../../types/api/vdisk';
import {stringifyVdiskId} from '../../../utils';
import {useTypedSelector} from '../../../utils/hooks';
import {getPDiskType} from '../../../utils/pdisk';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar, EDiskStateSeverity} from '../DiskStateProgressBar';
import {PDiskPopup} from '../PDiskPopup';
import {VDisk} from '../VDisk';

import {NOT_AVAILABLE_SEVERITY} from '../utils';

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

    const vdisks: TVDiskStateInfo[] | undefined = useTypedSelector((state) =>
        // @ts-expect-error selector is correct, but js infers broken type
        // unignore after rewriting reducer in ts
        getVDisksForPDisk(state, nodeId, data.PDiskId),
    );

    const [severity, setSeverity] = useState(getStateSeverity(data.State));
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef(null);

    useEffect(() => {
        const newSeverity = getStateSeverity(data.State);
        if (severity !== newSeverity) {
            setSeverity(newSeverity);
        }
    }, [data.State]);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    const pdiskAllocatedPercent = useMemo(() => {
        const {AvailableSize, TotalSize} = data;

        if (!AvailableSize || !TotalSize) {
            return undefined;
        }

        return !isNaN(Number(AvailableSize)) && !isNaN(Number(TotalSize))
            ? Math.round(((Number(TotalSize) - Number(AvailableSize)) * 100) / Number(TotalSize))
            : undefined;
    }, [data]);

    const renderVDisks = () => {
        if (!vdisks?.length) {
            return null;
        }

        return (
            <div className={b('vdisks')}>
                {vdisks.map((vdisk) => (
                    <div
                        key={stringifyVdiskId(vdisk.VDiskId)}
                        className={b('vdisks-item')}
                        style={{
                            // 1 is small enough for empty disks to be of the minimum width
                            // but if all of them are empty, `flex-grow: 1` would size them evenly
                            flexGrow: (Number(vdisk.AllocatedSize) || 1),
                        }}
                    >
                        <VDisk data={vdisk} compact />
                    </div>
                ))}
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
