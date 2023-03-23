import cn from 'bem-cn-lite';

import type {IPreparedTopicStats} from '../../../../../types/store/topic';

import {Loader} from '../../../../../components/Loader';
import {InfoViewerItem, InfoViewer} from '../../../../../components/InfoViewer';
import {SpeedMultiMeter} from '../../../../../components/SpeedMultiMeter';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {LagPopoverContent} from '../../../../../components/LagPopoverContent';
import {ResponseError} from '../../../../../components/Errors/ResponseError';

import {useTypedSelector} from '../../../../../utils/hooks';
import {formatDurationToShortTimeFormat} from '../../../../../utils/timeParsers';
import {formatBps, formatBytes} from '../../../../../utils';

import {selectPreparedTopicStats} from '../../../../../store/reducers/topic';

import i18n from './i18n';

import './TopicStats.scss';

const b = cn('ydb-overview-topic-stats');

const prepareTopicInfo = (data: IPreparedTopicStats): Array<InfoViewerItem> => {
    return [
        {label: 'Store size', value: formatBytes(data.storeSize)},
        {
            label: (
                <LabelWithPopover
                    text={'Write idle time'}
                    popoverContent={
                        <LagPopoverContent text={i18n('writeIdleTimePopover')} type="write" />
                    }
                />
            ),
            value: formatDurationToShortTimeFormat(data.partitionsIdleTime),
        },
        {
            label: (
                <LabelWithPopover
                    text={'Write lag'}
                    popoverContent={
                        <LagPopoverContent text={i18n('writeLagPopover')} type="write" />
                    }
                />
            ),
            value: formatDurationToShortTimeFormat(data.partitionsWriteLag),
        },
        {
            label: 'Average write speed',
            value: <SpeedMultiMeter data={data.writeSpeed} withValue={false} />,
        },
    ];
};

const prepareBytesWrittenInfo = (data: IPreparedTopicStats): Array<InfoViewerItem> => {
    const writeSpeed = data.writeSpeed;

    return [
        {
            label: 'per minute',
            value: formatBps(writeSpeed.perMinute),
        },
        {
            label: 'per hour',
            value: formatBps(writeSpeed.perHour),
        },
        {
            label: 'per day',
            value: formatBps(writeSpeed.perDay),
        },
    ];
};

export const TopicStats = () => {
    const {error, loading, wasLoaded} = useTypedSelector((state) => state.topic);

    const data = useTypedSelector(selectPreparedTopicStats);

    if (loading && !wasLoaded) {
        return (
            <div className={b()}>
                <Loader size="s" />
            </div>
        );
    }

    // If there is at least some empty data object
    // we initialize its fields with zero values
    // so no data at all is considered to be error as well
    if (error || !data) {
        return (
            <div className={b()}>
                <div className={b('title')}>Stats</div>
                <ResponseError error={error} />
            </div>
        );
    }

    return (
        <div className={b()}>
            <div className={b('title')}>Stats</div>
            <div className={b('info')}>
                <InfoViewer info={prepareTopicInfo(data)} multilineLabels />
            </div>
            <div className={b('bytes-written')}>
                <InfoViewer info={prepareBytesWrittenInfo(data)} />
            </div>
        </div>
    );
};
