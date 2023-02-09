import cn from 'bem-cn-lite';
import {isEmpty} from 'lodash/fp';

import type {DescribeTopicResult} from '../../../../../types/api/topic';

import {Loader} from '../../../../../components/Loader';
import {InfoViewerItem, formatObject, InfoViewer} from '../../../../../components/InfoViewer';

import {formatTopicStats} from '../../../../../components/InfoViewer/formatters';

import {useTypedSelector} from '../../../../../utils/hooks';
import {convertBytesObjectToSpeed} from '../../../../../utils/bytesParsers';
import {formatBps} from '../../../../../utils';

import i18n from './i18n';

import './TopicStats.scss';

const b = cn('ydb-overview-topic-stats');

const prepareTopicInfo = (data: DescribeTopicResult): Array<InfoViewerItem> => {
    return [
        ...formatObject(formatTopicStats, {
            ...data.topic_stats,
        }),
    ];
};

const prepareBytesWrittenInfo = (data: DescribeTopicResult): Array<InfoViewerItem> => {
    const preparedBytes = convertBytesObjectToSpeed(data?.topic_stats?.bytes_written);

    return [
        {
            label: 'per minute',
            value: formatBps(preparedBytes.perMinute),
        },
        {
            label: 'per hour',
            value: formatBps(preparedBytes.perHour),
        },
        {
            label: 'per day',
            value: formatBps(preparedBytes.perDay),
        },
    ];
};

export const TopicStats = () => {
    const {data, error, loading, wasLoaded} = useTypedSelector((state) => state.topic);

    if (loading && !wasLoaded) {
        return (
            <div className={b()}>
                <Loader size="s" />
            </div>
        );
    }

    // There are several backed versions with different behaviour
    // Possible returns on older versions:
    // 1. Error when trying to access endpoint
    // 2. No data
    // 3. HTML page of Internal Viewer with an error
    // 4. Data with no topic stats
    // 5. Topic Stats as an empty object
    if (
        error ||
        !data ||
        typeof data !== 'object' ||
        !data.topic_stats ||
        isEmpty(data.topic_stats)
    ) {
        return (
            <div className={b()}>
                <div className={b('title')}>Stats</div>
                <div className="error">{i18n('notSupportedVersion')}</div>
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
