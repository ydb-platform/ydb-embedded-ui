import React, {useEffect, useState, useRef, useMemo} from 'react';
import cn from 'bem-cn-lite';
import _ from 'lodash';
import {Popup} from '@yandex-cloud/uikit';
//@ts-ignore
import {bytesToGB} from '../../../utils/utils';
//@ts-ignore
import routes, {createHref} from '../../../routes';
//@ts-ignore
import {getPDiskId} from '../../../utils';
import {getPDiskType} from '../../../utils/pdisk';
import {TPDiskStateInfo, TPDiskState} from '../../../types/api/storage';
import DiskStateProgressBar, {
    diskProgressColors,
} from '../DiskStateProgressBar/DiskStateProgressBar';
import {STRUCTURE} from '../../Node/NodePages';

import {colorSeverity, NOT_AVAILABLE_SEVERITY} from '../utils';

import './Pdisk.scss';

const b = cn('pdisk-storage');

const stateSeverity = {
    [TPDiskState.Initial]: 0,
    [TPDiskState.Normal]: 1,
    [TPDiskState.InitialFormatRead]: 3,
    [TPDiskState.InitialSysLogRead]: 3,
    [TPDiskState.InitialCommonLogRead]: 3,
    [TPDiskState.InitialFormatReadError]: 5,
    [TPDiskState.InitialSysLogReadError]: 5,
    [TPDiskState.InitialSysLogParseError]: 5,
    [TPDiskState.InitialCommonLogReadError]: 5,
    [TPDiskState.InitialCommonLogParseError]: 5,
    [TPDiskState.CommonLoggerInitError]: 5,
    [TPDiskState.OpenFileError]: 5,
    [TPDiskState.ChunkQuotaError]: 5,
    [TPDiskState.DeviceIoError]: 5,
};

interface PDiskProps extends TPDiskStateInfo {
    Host?: string;
}

const isSeverityKey = (key?: TPDiskState): key is keyof typeof stateSeverity =>
    key !== undefined && key in stateSeverity;

const getStateSeverity = (pDiskState?: TPDiskState) => {
    return isSeverityKey(pDiskState) ? stateSeverity[pDiskState] : NOT_AVAILABLE_SEVERITY;
};

function Pdisk(props: PDiskProps) {
    const [severity, setSeverity] = useState(getStateSeverity(props.State));
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef(null);

    useEffect(() => {
        const newSeverity = getStateSeverity(props.State);
        if (severity !== newSeverity) {
            setSeverity(newSeverity);
        }
    }, [props.State]);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };
    /* eslint-disable */
    const preparePdiskData = () => {
        const {AvailableSize, TotalSize, State, PDiskId, NodeId, Host, Path, Realtime, Device} =
            props;
        const errorColors = [
            diskProgressColors[colorSeverity.Orange as keyof typeof diskProgressColors],
            diskProgressColors[colorSeverity.Red as keyof typeof diskProgressColors],
            diskProgressColors[colorSeverity.Yellow as keyof typeof diskProgressColors],
        ];

        const pdiskData: {property: string; value: string | number}[] = [
            {property: 'PDisk', value: getPDiskId({NodeId, PDiskId})},
        ];

        pdiskData.push({property: 'State', value: State || 'not available'});
        pdiskData.push({property: 'Type', value: getPDiskType(props) || 'unknown'});
        NodeId && pdiskData.push({property: 'Node Id', value: NodeId});

        Host && pdiskData.push({property: 'Host', value: Host});
        Path && pdiskData.push({property: 'Path', value: Path});
        pdiskData.push({
            property: 'Available',
            value: `${bytesToGB(AvailableSize)} of ${bytesToGB(TotalSize)}`,
        });
        Realtime &&
            errorColors.includes(Realtime) &&
            pdiskData.push({property: 'Realtime', value: Realtime});
        Device &&
            errorColors.includes(Device) &&
            pdiskData.push({property: 'Device', value: Device});
        return pdiskData;
    };
    /* eslint-enable */

    const renderPopup = () => {
        const pdiskData = preparePdiskData();
        return (
            <Popup
                className={b('popup-wrapper')}
                anchorRef={anchor}
                open={isPopupVisible}
                placement={['top', 'bottom']}
                hasArrow
            >
                <div className={b('popup-content')}>
                    <div className={b('popup-section-name')}>PDisk</div>
                    {_.map(pdiskData, (row) => (
                        <React.Fragment key={row.property}>
                            <div className={b('property')}>{row.property}</div>
                            <div className={b('value')}>{row.value}</div>
                        </React.Fragment>
                    ))}
                </div>
            </Popup>
        );
    };

    const pdiskAllocatedPercent = useMemo(() => {
        const {AvailableSize, TotalSize} = props;

        if (!AvailableSize || !TotalSize) {
            return;
        }
        return !isNaN(Number(AvailableSize)) && !isNaN(Number(TotalSize))
            ? Math.round(((Number(TotalSize) - Number(AvailableSize)) * 100) / Number(TotalSize))
            : undefined;
    }, [props.AvailableSize, props.TotalSize]);

    return (
        <React.Fragment>
            {renderPopup()}
            <div className={b()} ref={anchor} onMouseEnter={showPopup} onMouseLeave={hidePopup}>
                <DiskStateProgressBar
                    diskAllocatedPercent={pdiskAllocatedPercent}
                    severity={severity as keyof typeof diskProgressColors}
                    href={createHref(
                        routes.node,
                        {id: props.NodeId, activeTab: STRUCTURE},
                        {pdiskId: props.PDiskId || ''},
                    )}
                />
            </div>
        </React.Fragment>
    );
}

export default Pdisk;
