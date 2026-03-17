import React from 'react';

import {Card, Flex, HelpMark, Label, Text} from '@gravity-ui/uikit';

import {InfoViewerTitle} from '../../../../../components/InfoViewerTitle/InfoViewerTitle';
import {SegmentedProgress} from '../../../../../components/SegmentedProgress/SegmentedProgress';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import {formatDateTime, formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {isDomain} from '../../../ObjectSummary/transformPath';

import {dbInfoKeyset} from './i18n';

import './DatabaseInfo.scss';

const b = cn('ydb-diagnostics-database-info');

interface DBInfoProps {
    data?: TEvDescribeSchemeResult;
    path: string;
}

export function DatabaseInfo({data, path}: DBInfoProps) {
    const items = React.useMemo(() => {
        return prepareDatabaseInfo({data, path});
    }, [data, path]);

    const {PathsInside, PathsLimit, ShardsInside, ShardsLimit} =
        data?.PathDescription?.DomainDescription ?? {};

    return (
        <Flex direction={'column'} className={b('wrapper')}>
            <YDBDefinitionList items={items} />
            <InfoViewerTitle className={b('title')}>
                {dbInfoKeyset('title_limits-and-usage')}
            </InfoViewerTitle>
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

function prepareDatabaseInfo({data, path}: DBInfoProps): YDBDefinitionListItem[] {
    const items: YDBDefinitionListItem[] = [];

    const {Path, PathId} = data || {};
    const {PathVersion, CreateStep} = data?.PathDescription?.Self || {};

    const created = formatDateTime(CreateStep);

    items.push(
        {
            name: dbInfoKeyset('title_type'),
            content: <TypeLabel data={data} path={path} />,
        },
        {
            name: dbInfoKeyset('title_id'),
            content: PathId,
            copyText: PathId,
        },
        {
            name: dbInfoKeyset('title_version'),
            content: PathVersion,
            copyText: PathVersion,
        },
    );

    if (Number(CreateStep)) {
        items.push({
            name: dbInfoKeyset('title_created'),
            content: created,
            copyText: created,
        });
    }

    items.push({
        name: dbInfoKeyset('title_path'),
        content: Path,
        copyText: Path,
    });

    return items;
}

function TypeLabel({data, path}: DBInfoProps) {
    const isDomainDB = isDomain(path, data?.PathDescription?.Self?.PathType);
    const dbType = isDomainDB ? dbInfoKeyset('title_domain') : dbInfoKeyset('title_sub-domain');
    const dbTypeNote = isDomainDB
        ? dbInfoKeyset('description_domain')
        : dbInfoKeyset('description_sub-domain');

    return (
        <Label theme={'normal'}>
            <Flex gap="2" wrap="nowrap">
                {dbType}
                <HelpMark popoverProps={{placement: ['right', 'bottom']}}>
                    <Flex className={b('note')}>{dbTypeNote}</Flex>
                </HelpMark>
            </Flex>
        </Label>
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
    const usage = React.useMemo(() => {
        const numValue = Number(value);
        const numLimit = Number(limit);

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
    }, [value, limit]);

    return (
        <Card className={b('card')} view="filled">
            <Flex gap={2} direction={'column'}>
                <Flex direction={'column'}>
                    <Text variant="subheader-1">{title}</Text>
                    <Text color="secondary">{description}</Text>
                </Flex>
                <SegmentedProgress
                    value={Number(value ?? 0)}
                    total={Number(limit ?? 0)}
                    labelStart={`${usage}%`}
                    labelEnd={dbInfoKeyset('text_count', {
                        count: formatNumber(value ?? 0),
                        limit: formatNumber(limit ?? 0),
                    })}
                />
            </Flex>
        </Card>
    );
}
