import {ContentWithPopup} from '../../../../../components/ContentWithPopup/ContentWithPopup';
import {InfoViewer} from '../../../../../components/InfoViewer';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import type {
    DiskErasureGroupsStats,
    DiskGroupsStats,
} from '../../../../../store/reducers/cluster/types';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import i18n from '../../../i18n';

import './DiskGroupsStatsBars.scss';

const b = cn('ydb-disk-groups-stats');

interface DiskGroupsStatsProps {
    stats: DiskGroupsStats;
}

export const DiskGroupsStatsBars = ({stats}: DiskGroupsStatsProps) => {
    return (
        <div className={b()}>
            {Object.values(stats).map((erasureStats) => (
                <ContentWithPopup
                    placement={['right']}
                    key={erasureStats.erasure}
                    content={<GroupsStatsPopupContent stats={erasureStats} />}
                >
                    <ProgressViewer
                        className={b('bar')}
                        value={erasureStats.createdGroups}
                        capacity={erasureStats.totalGroups}
                    />
                </ContentWithPopup>
            ))}
        </div>
    );
};

interface GroupsStatsPopupContentProps {
    stats: DiskErasureGroupsStats;
}

function GroupsStatsPopupContent({stats}: GroupsStatsPopupContentProps) {
    const {diskType, erasure, allocatedSize, availableSize} = stats;

    const sizeToConvert = getSizeWithSignificantDigits(Math.max(allocatedSize, availableSize), 2);

    const convertedAllocatedSize = formatBytes({value: allocatedSize, size: sizeToConvert});
    const convertedAvailableSize = formatBytes({value: availableSize, size: sizeToConvert});

    const usage = Math.round((allocatedSize / (allocatedSize + availableSize)) * 100);

    const info = [
        {
            label: i18n('disk-type'),
            value: diskType,
        },
        {
            label: i18n('erasure'),
            value: erasure,
        },
        {
            label: i18n('allocated'),
            value: convertedAllocatedSize,
        },
        {
            label: i18n('available'),
            value: convertedAvailableSize,
        },
        {
            label: i18n('usage'),
            value: usage + '%',
        },
    ];

    return <InfoViewer dots={true} info={info} className={b('popup-content')} size="s" />;
}
