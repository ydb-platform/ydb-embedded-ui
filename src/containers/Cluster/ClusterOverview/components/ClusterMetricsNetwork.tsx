import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {useSetting} from '../../../../utils/hooks/useSetting';
import {formatNetworkMetric} from '../../../../utils/metrics/formatMetricLegend';
import {calculateBaseDiagramValues} from '../../../../utils/metrics/getDiagramValues';
import i18n from '../../i18n';
import type {ClusterMetricsBaseProps} from '../shared';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsNetworkProps extends ClusterMetricsBaseProps {
    percentsValue: number;
    throughput?: string;
}

export function ClusterMetricsNetwork({
    percentsValue,
    throughput,
    collapsed,
    ...rest
}: ClusterMetricsNetworkProps) {
    const [showNetworkUtilization] = useSetting<boolean>(SETTING_KEYS.SHOW_NETWORK_UTILIZATION);
    if (!showNetworkUtilization) {
        return null;
    }
    const {status, percents, progressValue} = calculateBaseDiagramValues({
        fillWidth: percentsValue * 100,
        ...rest,
    });

    const legend = formatNetworkMetric(throughput);

    return (
        <ClusterMetricsCardContent
            status={status}
            fillWidth={Math.max(progressValue, 0.5)}
            percents={percents}
            title={i18n('title_network')}
            collapsed={collapsed}
            legend={{
                main: legend,
                secondary: i18n('context_network'),
                note: i18n('context_network-description'),
            }}
        />
    );
}
