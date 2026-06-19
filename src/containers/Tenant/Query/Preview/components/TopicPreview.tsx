import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {useSchemaTopicDataAvailable} from '../../../../../store/reducers/capabilities/hooks';
import {useClusterWithProxy} from '../../../../../store/reducers/cluster/cluster';
import {partitionsApi} from '../../../../../store/reducers/partitions/partitions';
import {topicApi} from '../../../../../store/reducers/topic';
import type {TopicDataRequest} from '../../../../../types/api/topic';
import {useClusterNameFromQuery} from '../../../../../utils/hooks/useDatabaseFromQuery';
import {safeParseNumber} from '../../../../../utils/utils';
import i18n from '../i18n';
import {b} from '../shared';
import type {PreviewContainerProps} from '../types';

import {Preview} from './PreviewView';
import {TopicPreviewTable} from './TopicPreviewTable';

const TOPIC_PREVIEW_LIMIT = 100;

export function TopicPreview({database, path, databaseFullPath}: PreviewContainerProps) {
    const useMetaProxy = useClusterWithProxy();
    const schemaTopicDataAvailable = useSchemaTopicDataAvailable();
    const clusterName = useClusterNameFromQuery();
    const {
        data: partitions,
        isLoading: partitionsLoading,
        error: partitionsError,
    } = partitionsApi.useGetPartitionsQuery({path, database, databaseFullPath, useMetaProxy});

    const firstPartition = React.useMemo(() => {
        return partitions?.[0];
    }, [partitions]);

    const queryParams = React.useMemo(() => {
        const firstPartitionId = firstPartition?.partitionId;
        if (!firstPartition || isNil(firstPartitionId)) {
            return skipToken;
        }
        const params: TopicDataRequest & {clusterName?: string; useMeta?: boolean} = {
            database,
            path,
            clusterName,
            partition: String(firstPartitionId),
            limit: TOPIC_PREVIEW_LIMIT,
            offset: safeParseNumber(firstPartition.endOffset) - TOPIC_PREVIEW_LIMIT,
            message_size_limit: 100,
            useMeta: schemaTopicDataAvailable,
        };

        return params;
    }, [database, path, clusterName, firstPartition, schemaTopicDataAvailable]);

    const {currentData, error, isFetching} = topicApi.useGetTopicDataQuery(queryParams);

    const loading = partitionsLoading || (isFetching && currentData === undefined);

    const offsetsRange = React.useMemo(() => {
        if (!firstPartition) {
            return undefined;
        }
        return {
            start: safeParseNumber(firstPartition.startOffset),
            end: Math.max(safeParseNumber(firstPartition.endOffset) - 1, 0),
        };
    }, [firstPartition]);

    // A topic has an associated schema when the response carries schema context
    // (`SchemaPath`). In that case messages are returned already schematized as
    // JSON values (objects/arrays/primitives, including strings) and must not be
    // base64-decoded. A failed schematization (`SchematizeError`) falls back to
    // the legacy base64 shape.
    const isResponseSchematized = Boolean(currentData?.SchemaPath) && !currentData?.SchematizeError;

    const renderResult = React.useCallback(() => {
        return (
            <Flex direction="column">
                <Flex className={b('partition-info')} alignItems="center" gap={2}>
                    {!isNil(firstPartition?.partitionId) && (
                        <Text variant="body-2">
                            {i18n('label_partition-id', {id: firstPartition.partitionId})}
                        </Text>
                    )}
                    {offsetsRange && (
                        <Text variant="body-2" color="secondary">
                            ({i18n('label_offsets-range', offsetsRange)})
                        </Text>
                    )}
                </Flex>
                {currentData && (
                    <TopicPreviewTable
                        messages={currentData.Messages?.toReversed() ?? []}
                        isSchematized={isResponseSchematized}
                    />
                )}
            </Flex>
        );
    }, [offsetsRange, firstPartition, currentData, isResponseSchematized]);

    const offsetsQuantity =
        safeParseNumber(currentData?.EndOffset) - safeParseNumber(currentData?.StartOffset);

    return (
        <Preview
            path={path}
            renderResult={renderResult}
            loading={loading}
            error={partitionsError || error}
            truncated={offsetsQuantity > TOPIC_PREVIEW_LIMIT}
            quantity={currentData?.Messages?.length ?? 0}
        />
    );
}
