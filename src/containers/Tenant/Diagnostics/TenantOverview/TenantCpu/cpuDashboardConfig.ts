import type {MetricDescription} from '../../../../../components/MetricChart';
import type {PoolName} from '../../../../../types/api/nodes';
import type {ChartConfig} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

const pools: PoolName[] = ['IC', 'IO', 'Batch', 'User', 'System'];

const getPoolMetricConfig = (poolName: PoolName): MetricDescription => {
    return {
        target: `resources.cpu.${poolName}.usage`,
        title: poolName,
    };
};

export const cpuDashboardConfig: ChartConfig[] = [
    {
        title: i18n('charts.cpu-usage'),
        metrics: pools.map(getPoolMetricConfig),
        options: {
            dataType: 'percent',
        },
    },
];
