import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {useSetting} from '../../../../store/reducers/settings/useSetting';
import {formatBytes} from '../../../../utils/bytesParsers';
import i18n from '../../i18n';
import type {ClusterMetricsBaseProps} from '../shared';
import {calculateBaseDiagramValues} from '../utils';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsNetworkProps extends ClusterMetricsBaseProps {
    percentsValue: number;
    throughput?: string;
}

function formatStorageLegend(value?: string) {
    return formatBytes({value, withSpeedLabel: true});
}

export function ClusterMetricsNetwork({
    percentsValue,
    throughput,
    collapsed,
    ...rest
}: ClusterMetricsNetworkProps) {
    const {value: showNetworkUtilization} = useSetting<boolean>(
        SETTING_KEYS.SHOW_NETWORK_UTILIZATION,
    );
    if (!showNetworkUtilization) {
        return null;
    }
    const {status, percents, fill} = calculateBaseDiagramValues({
        fillWidth: percentsValue * 100,
        ...rest,
    });

    const legend = formatStorageLegend(throughput);

    return (
        <ClusterMetricsCardContent
            status={status}
            fillWidth={fill}
            title={i18n('title_network')}
            collapsed={collapsed}
            legend={{
                main: legend,
                secondary: i18n('context_network'),
                note: i18n('context_network-description'),
            }}
        >
            <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
        </ClusterMetricsCardContent>
    );
}
