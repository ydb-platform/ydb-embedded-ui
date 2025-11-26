import type {TPeerInfo} from '../../../types/api/peers';
import {safeParseNumber} from '../../../utils/utils';

export interface NodePeerRow {
    NodeId?: number;
    Host?: string;
    NodeName?: string;
    PileName?: string;
    TenantName?: string;
    ConnectTime?: string;
    ClockSkewUs?: number;
    PingTimeUs?: number;
    SendThroughput?: string;
    SentBytes?: number;
    ReceiveThroughput?: string;
    ReceivedBytes?: number;
}

export function mapPeerToNodeNetworkRow(peer: TPeerInfo): NodePeerRow {
    const fSkewUs = safeParseNumber(peer.Forward?.ClockSkewUs);
    const rSkewUs = safeParseNumber(peer.Reverse?.ClockSkewUs);
    const fPingUs = safeParseNumber(peer.Forward?.PingTimeUs);
    const rPingUs = safeParseNumber(peer.Reverse?.PingTimeUs);

    return {
        NodeId: peer.SystemState?.NodeId,
        Host: peer.SystemState?.Host,
        NodeName: peer.SystemState?.NodeName,
        PileName: peer.SystemState?.Location?.BridgePileName,
        TenantName: peer.SystemState?.Tenants?.[0],
        ConnectTime: peer.Forward?.ConnectTime,
        ClockSkewUs: (fSkewUs - rSkewUs) / 2,
        PingTimeUs: (fPingUs + rPingUs) / 2,
        SendThroughput: peer.Forward?.WriteThroughput,
        SentBytes: safeParseNumber(peer.Forward?.BytesWritten),
        ReceiveThroughput: peer.Reverse?.WriteThroughput,
        ReceivedBytes: safeParseNumber(peer.Reverse?.BytesWritten),
    };
}
