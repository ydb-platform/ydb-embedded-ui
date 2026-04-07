import {Flex, HelpMark, Text} from '@gravity-ui/uikit';

import type {StorageUsageSection} from '../../../../store/reducers/storageUsage/StorageUsage';
import {cn} from '../../../../utils/cn';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';

import {
    formatMetricBytes,
    formatOverhead,
    getConsistentMetricBytesSize,
} from './storageUsageFormatters';

import './MediaSectionSummary.scss';

const b = cn('ydb-media-section-summary');

interface MetricCardProps {
    title: string;
    value: string;
    note?: string;
}

interface MediaSectionSummaryProps {
    section: StorageUsageSection;
}

function MetricCard({title, value, note}: MetricCardProps) {
    return (
        <div className={b('metric-card')}>
            <Text variant="subheader-2">{value}</Text>
            <Flex className={b('metric-card-subtitle')} alignItems="center" gap="1">
                <Text color="secondary">{title}</Text>
                {note ? (
                    <HelpMark iconSize="s" className={b('metric-card-help-mark')}>
                        {note}
                    </HelpMark>
                ) : null}
            </Flex>
        </div>
    );
}

export function MediaSectionSummary({section}: MediaSectionSummaryProps) {
    const metricBytesSize = getConsistentMetricBytesSize([section.dataSize, section.diskUsage]);

    return (
        <div className={b('cards')}>
            <div className={b('card')}>
                <div className={b('main')}>
                    <MetricCard
                        title={i18n('field_storage-usage-data-size')}
                        value={formatMetricBytes(section.dataSize, metricBytesSize)}
                        note={i18n('context_storage-usage-data-size-description')}
                    />
                    <MetricCard
                        title={i18n('field_storage-usage-disk-usage')}
                        value={formatMetricBytes(section.diskUsage, metricBytesSize)}
                    />
                    <MetricCard
                        title={i18n('field_storage-usage-overhead')}
                        value={formatOverhead(section.diskUsage, section.dataSize)}
                        note={i18n('context_storage-usage-overhead-description')}
                    />
                </div>
            </div>
            <div className={b('card', {groups: true})}>
                <MetricCard
                    title={i18n('field_storage-usage-storage-groups')}
                    value={formatNumber(section.storageGroupsCount) || '0'}
                />
            </div>
        </div>
    );
}
