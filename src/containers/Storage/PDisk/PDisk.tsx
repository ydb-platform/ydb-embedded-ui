import React, {useEffect, useState, useRef, useMemo} from 'react';
import cn from 'bem-cn-lite';

import {InternalLink} from '../../../components/InternalLink';

import routes, {createHref} from '../../../routes';
import {TPDiskStateInfo, TPDiskState} from '../../../types/api/pdisk';
import {getPDiskType} from '../../../utils/pdisk';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar, EDiskStateSeverity} from '../DiskStateProgressBar';
import {PDiskPopup} from '../PDiskPopup';

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

    return (
        <React.Fragment>
            <PDiskPopup data={data} anchorRef={anchor} open={isPopupVisible} />
            <div className={b()} ref={anchor} onMouseEnter={showPopup} onMouseLeave={hidePopup}>
                <InternalLink
                    to={createHref(
                        routes.node,
                        {id: nodeId, activeTab: STRUCTURE},
                        {pdiskId: data.PDiskId || ''},
                    )}
                    className={b('content')}
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
