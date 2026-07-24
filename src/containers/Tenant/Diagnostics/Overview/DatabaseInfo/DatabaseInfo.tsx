import React from 'react';

import {Alert, Card, Flex, Text} from '@gravity-ui/uikit';

import {SegmentedProgress} from '../../../../../components/SegmentedProgress/SegmentedProgress';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {SchemaObjectInfo} from '../SchemaObjectInfo';

import {dbInfoKeyset} from './i18n';

import './DatabaseInfo.scss';

const b = cn('ydb-diagnostics-database-info');

interface DBInfoProps {
    data?: TEvDescribeSchemeResult;
    path: string;
}

export function DatabaseInfo({data, path}: DBInfoProps) {
    const {PathsInside, PathsLimit, ShardsInside, ShardsLimit} =
        data?.PathDescription?.DomainDescription ?? {};

    return (
        <Flex direction={'column'} className={b('wrapper')}>
            <SchemaObjectInfo data={data} path={path} />
            <Text as="div" variant="subheader-2" className={b('title')}>
                {dbInfoKeyset('title_limits-and-usage')}
            </Text>
            <Flex gap={3} direction={'column'}>
                <DBInfoStatsCard
                    value={PathsInside}
                    limit={PathsLimit}
                    title={dbInfoKeyset('title_paths')}
                    description={dbInfoKeyset('description_paths')}
                />
                <DBInfoStatsCard
                    value={ShardsInside}
                    limit={ShardsLimit}
                    title={dbInfoKeyset('title_shards')}
                    description={dbInfoKeyset('description_shards')}
                />
            </Flex>
        </Flex>
    );
}

function DBInfoStatsCard({
    value,
    limit,
    title,
    description,
}: {
    value?: string;
    limit?: string;
    title: string;
    description: string;
}) {
    const numValue = Number(value) || 0;
    const numLimit = Number(limit) || 0;

    const usage = React.useMemo(() => {
        if (!numValue || !numLimit || numValue < 0) {
            return 0;
        }

        const percentUsed = (numValue / numLimit) * 100;

        if (percentUsed > 100) {
            return 100;
        }
        if (percentUsed < 1) {
            return Math.round(percentUsed * 10) / 10;
        }
        return Math.round(percentUsed);
    }, [numValue, numLimit]);

    const labelEnd = numLimit
        ? dbInfoKeyset('text_count', {
              count: formatNumber(numValue),
              limit: formatNumber(numLimit),
          })
        : String(numValue);

    const usageLabel = numLimit ? `${usage}%` : `N/A %`;

    const renderNoLimitAlert = () => {
        if (numLimit) {
            return null;
        }
        return (
            <Alert
                className={b('alert')}
                theme="warning"
                message={dbInfoKeyset('alert_no-limit')}
            />
        );
    };

    return (
        <Card className={b('card')} view="filled">
            <Flex gap={2} direction={'column'}>
                <Flex direction={'column'}>
                    <Text variant="subheader-1">{title}</Text>
                    <Text color="secondary">{description}</Text>
                </Flex>
                <SegmentedProgress
                    value={numValue}
                    total={numLimit}
                    labelStart={usageLabel}
                    labelEnd={labelEnd}
                    displayNoLimit="filled"
                />
                {renderNoLimitAlert()}
            </Flex>
        </Card>
    );
}
