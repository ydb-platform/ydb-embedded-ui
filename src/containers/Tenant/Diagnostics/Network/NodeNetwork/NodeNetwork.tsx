import React from 'react';

import {EFlag} from '../../../../../types/api/enums';
import {cn} from '../../../../../utils/cn';
import type {NodeTooltipData} from '../NodeTooltipPopup/NodeTooltipPopup';

import './NodeNetwork.scss';

const b = cn('node-network');

function getNodeModifier(connected = 0, capacity = 0) {
    const percents = Math.floor((connected / capacity) * 100);
    if (percents === 100) {
        return EFlag.Green;
    } else if (percents >= 70) {
        return EFlag.Yellow;
    } else if (percents >= 1) {
        return EFlag.Red;
    } else {
        return EFlag.Grey;
    }
}

function noop() {}

interface NodeNetworkProps {
    onMouseEnter?: (node: HTMLDivElement, data: NodeTooltipData) => void;
    onMouseLeave?: () => void;
    nodeId: number | string;
    connected?: number;
    capacity?: number;
    rack: string;
    status?: EFlag;
    onClick?: (nodeId: number | string) => void;
    showID?: boolean;
    isBlurred?: boolean;
}

export function NodeNetwork({
    nodeId,
    connected,
    capacity,
    rack,
    status,
    onClick = noop,
    onMouseEnter = noop,
    onMouseLeave = noop,
    showID,
    isBlurred,
}: NodeNetworkProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const color = status || getNodeModifier(connected, capacity);

    return (
        <div
            ref={ref}
            className={b({
                [color.toLowerCase()]: true,
                id: showID,
                blur: isBlurred,
            })}
            onMouseEnter={() => {
                if (ref.current) {
                    onMouseEnter(ref.current, {nodeId, connected, capacity, rack});
                }
            }}
            onMouseLeave={() => {
                onMouseLeave();
            }}
            onClick={() => onClick(nodeId)}
        >
            {showID ? nodeId : null}
        </div>
    );
}
