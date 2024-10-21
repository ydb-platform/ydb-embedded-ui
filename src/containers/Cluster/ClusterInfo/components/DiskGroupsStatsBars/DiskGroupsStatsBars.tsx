import {DefinitionList} from '@gravity-ui/components';

import {ContentWithPopup} from '../../../../../components/ContentWithPopup/ContentWithPopup';
import type {DiskErasureGroupsStats} from '../../../../../store/reducers/cluster/types';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import i18n from '../../../i18n';

import './DiskGroupsStatsBars.scss';

const b = cn('ydb-disk-groups-stats');

interface DiskGroupsStatsProps {
    stats: DiskErasureGroupsStats;
    children: React.ReactNode;
}

export const DiskGroupsErasureStats = ({stats, children}: DiskGroupsStatsProps) => {
    return (
        <div className={b()}>
            <ContentWithPopup
                placement={['right']}
                pinOnClick
                content={<GroupsStatsPopupContent stats={stats} />}
            >
                {children}
            </ContentWithPopup>
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
            name: i18n('disk-type'),
            content: diskType,
        },
        {
            name: i18n('erasure'),
            content: erasure,
        },
        {
            name: i18n('allocated'),
            content: convertedAllocatedSize,
        },
        {
            name: i18n('available'),
            content: convertedAvailableSize,
        },
        {
            name: i18n('usage'),
            content: usage + '%',
        },
    ];

    return <DefinitionList items={info} className={b('popup-content')} responsive />;
}
