import {ProgressViewer} from '../../components/ProgressViewer/ProgressViewer';
import {formatStorageValues} from '../../utils/dataFormatters/dataFormatters';

import type {ClusterDataAggregation} from '../../store/reducers/clusters/types';

import {b} from './shared';
import i18n from './i18n';

interface ClustersStatisticsProps {
    count: number;
    stats: ClusterDataAggregation;
}

export const ClustersStatistics = ({count, stats}: ClustersStatisticsProps) => {
    const {
        NodesTotal,
        NodesAlive,
        Hosts,
        Tenants,
        LoadAverage,
        NumberOfCpus,
        StorageUsed,
        StorageTotal,
    } = stats;

    return (
        <div className={b('aggregation')}>
            <div className={b('aggregation-value-container')}>
                <span className={b('aggregation-label')}>{i18n('statistics_clusters')}</span>
                {count}
            </div>
            <div className={b('aggregation-value-container')}>
                <span className={b('aggregation-label')}>{i18n('statistics_hosts')}</span>
                {Hosts}
            </div>
            <div className={b('aggregation-value-container')}>
                <span className={b('aggregation-label')}>{i18n('statistics_tenants')}</span>
                {Tenants}
            </div>
            <div className={b('aggregation-value-container')}>
                <span className={b('aggregation-label')}>{i18n('statistics_nodes')}</span>
                <ProgressViewer
                    size="ns"
                    value={NodesAlive}
                    capacity={NodesTotal}
                    colorizeProgress={true}
                    inverseColorize={true}
                />
            </div>
            <div className={b('aggregation-value-container')}>
                <span className={b('aggregation-label')}>{i18n('statistics_load')}</span>
                <ProgressViewer
                    size="ns"
                    value={LoadAverage}
                    capacity={NumberOfCpus}
                    colorizeProgress={true}
                />
            </div>
            <div className={b('aggregation-value-container')}>
                <span className={b('aggregation-label')}>{i18n('statistics_storage')}</span>
                <ProgressViewer
                    size="ns"
                    value={StorageUsed}
                    capacity={StorageTotal}
                    formatValues={formatStorageValues}
                    colorizeProgress={true}
                />
            </div>
        </div>
    );
};
