import type {TPeerInfo} from '../../../../types/api/peers';
import {prepareNodeSystemState} from '../../../../utils/nodes';
import type {PreparedNodeSystemState} from '../../../../utils/nodes';
import {safeParseNumber} from '../../../../utils/utils';

export interface NodePeerRow extends PreparedNodeSystemState {
    PileName?: string;
    ConnectTime?: string;
    ClockSkewUs?: number;
    PingTimeUs?: number;
    SendThroughput?: string;
    BytesSend?: number;
    ReceiveThroughput?: string;
    BytesReceived?: number;
}

export function mapPeerToNodeNetworkRow(peer: TPeerInfo): NodePeerRow {
    const system = prepareNodeSystemState(peer.SystemState);

    const fSkewUs = safeParseNumber(peer.Forward?.ClockSkewUs);
    const rSkewUs = safeParseNumber(peer.Reverse?.ClockSkewUs);
    const fPingUs = safeParseNumber(peer.Forward?.PingTimeUs);
    const rPingUs = safeParseNumber(peer.Reverse?.PingTimeUs);

    return {
        ...system,
        PileName: peer.SystemState?.Location?.BridgePileName,
        ConnectTime: peer.Forward?.ConnectTime,
        ClockSkewUs: (fSkewUs - rSkewUs) / 2,
        PingTimeUs: (fPingUs + rPingUs) / 2,
        SendThroughput: peer.Forward?.WriteThroughput,
        BytesSend: safeParseNumber(peer.Forward?.BytesWritten),
        ReceiveThroughput: peer.Reverse?.WriteThroughput,
        BytesReceived: safeParseNumber(peer.Reverse?.BytesWritten),
    };
}
