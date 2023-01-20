import React, {useEffect, useState, useRef, useMemo} from 'react';
import cn from 'bem-cn-lite';

import {Popup} from '@gravity-ui/uikit';

import {InfoViewer} from '../../../components/InfoViewer';
import {InternalLink} from '../../../components/InternalLink';

import routes, {createHref} from '../../../routes';
import {EFlag} from '../../../types/api/enums';
import {TPDiskStateInfo, TPDiskState} from '../../../types/api/pdisk';
import {getPDiskId} from '../../../utils';
import {getPDiskType} from '../../../utils/pdisk';
import {bytesToGB} from '../../../utils/utils';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar, EDiskStateSeverity} from '../DiskStateProgressBar';

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

export const PDisk = ({nodeId, data = {}}: PDiskProps) => {
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
    /* eslint-disable */
    const preparePdiskData = () => {
        const {AvailableSize, TotalSize, State, PDiskId, NodeId, Path, Realtime, Device} = data;
        const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

        const pdiskData: {label: string; value: string | number}[] = [
            {label: 'PDisk', value: getPDiskId({NodeId, PDiskId})},
        ];

        pdiskData.push({label: 'State', value: State || 'not available'});
        pdiskData.push({label: 'Type', value: getPDiskType(data) || 'unknown'});
        NodeId && pdiskData.push({label: 'Node Id', value: NodeId});

        Path && pdiskData.push({label: 'Path', value: Path});
        pdiskData.push({
            label: 'Available',
            value: `${bytesToGB(AvailableSize)} of ${bytesToGB(TotalSize)}`,
        });
        Realtime &&
            errorColors.includes(Realtime) &&
            pdiskData.push({label: 'Realtime', value: Realtime});
        Device && errorColors.includes(Device) && pdiskData.push({label: 'Device', value: Device});
        return pdiskData;
    };
    /* eslint-enable */

    const renderPopup = () => (
        <Popup
            className={b('popup-wrapper')}
            anchorRef={anchor}
            open={isPopupVisible}
            placement={['top', 'bottom']}
            // bigger offset for easier switching to neighbour nodes
            // matches the default offset for popup with arrow out of a sense of beauty
            offset={[0, 12]}
        >
            <InfoViewer title="PDisk" info={preparePdiskData()} size="s" />
        </Popup>
    );

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
            {renderPopup()}
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
}
