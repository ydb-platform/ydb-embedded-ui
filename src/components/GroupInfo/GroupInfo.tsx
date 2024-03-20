import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import {valueIsDefined} from '../../utils';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';

import type {InfoViewerProps} from '../InfoViewer/InfoViewer';
import {InfoViewer} from '../InfoViewer';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {groupInfoKeyset} from './i18n';

interface GroupInfoProps<T extends Partial<PreparedStorageGroup>>
    extends Omit<InfoViewerProps, 'info'> {
    data: T;
}

export function GroupInfo<T extends Partial<PreparedStorageGroup>>({
    data,
    ...infoViewerProps
}: GroupInfoProps<T>) {
    const {GroupID, PoolName, Used, Limit, ErasureSpecies} = data;

    const groupInfo = [];

    if (valueIsDefined(GroupID)) {
        groupInfo.push({label: groupInfoKeyset('group-id'), value: GroupID});
    }
    if (valueIsDefined(PoolName)) {
        groupInfo.push({label: groupInfoKeyset('pool-name'), value: PoolName});
    }
    if (valueIsDefined(ErasureSpecies)) {
        groupInfo.push({label: groupInfoKeyset('erasure'), value: ErasureSpecies});
    }
    if (Number(Used) >= 0 && Number(Limit) >= 0) {
        groupInfo.push({
            label: groupInfoKeyset('size'),
            value: (
                <ProgressViewer
                    value={Used}
                    capacity={Limit}
                    formatValues={formatStorageValuesToGb}
                    colorizeProgress={true}
                />
            ),
        });
    }

    return <InfoViewer info={groupInfo} {...infoViewerProps} />;
}
