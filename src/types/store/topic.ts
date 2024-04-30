import type {ProcessSpeedStats} from '../../utils/bytesParsers';

export interface IPreparedConsumerData {
    name: string | undefined;
    readSpeed: ProcessSpeedStats;

    writeLag: number;
    readLag: number;
    readIdleTime: number;
}

export interface IPreparedTopicStats {
    storeSize: string;

    partitionsWriteLag: number;
    partitionsIdleTime: number;

    writeSpeed: ProcessSpeedStats;
}
