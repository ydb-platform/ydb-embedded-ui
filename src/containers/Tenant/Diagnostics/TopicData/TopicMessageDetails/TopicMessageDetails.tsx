import React from 'react';

import {Flex, Icon, Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {LoaderWrapper} from '../../../../../components/LoaderWrapper/LoaderWrapper';
import {topicApi} from '../../../../../store/reducers/topic';
import type {TopicDataRequest} from '../../../../../types/api/topic';
import {isResponseError} from '../../../../../utils/response';
import {safeParseNumber} from '../../../../../utils/utils';
import i18n from '../i18n';
import {useTopicDataQueryParams} from '../useTopicDataQueryParams';

import {TopicMessage} from './components/TopicMessage';
import {TopicMessageGeneralInfo} from './components/TopicMessageGeneralInfo';
import {TopicMessageMetadata} from './components/TopicMessageMetadata';
import {MESSAGE_SIZE_LIMIT, b} from './shared';

import cryCatIcon from '../../../../../assets/icons/cry-cat.svg';

import './TopicMessageDetails.scss';

interface TopicMessageDetailsProps {
    database: string;
    path: string;
    clusterName?: string;
    useMeta?: boolean;
}

export function TopicMessageDetails({
    database,
    path,
    clusterName,
    useMeta,
}: TopicMessageDetailsProps) {
    const {selectedPartition, activeOffset} = useTopicDataQueryParams();

    const queryParams = React.useMemo(() => {
        if (isNil(selectedPartition) || isNil(activeOffset)) {
            return skipToken;
        }
        const params: TopicDataRequest & {clusterName?: string; useMeta?: boolean} = {
            database,
            path,
            clusterName,
            partition: selectedPartition,
            limit: 1,
            message_size_limit: MESSAGE_SIZE_LIMIT,
            useMeta,
        };
        const parsedOffset = safeParseNumber(activeOffset);
        params.offset = parsedOffset;
        params.last_offset = parsedOffset + 1;
        return params;
    }, [selectedPartition, activeOffset, database, path, clusterName, useMeta]);

    const {currentData, error, isFetching} = topicApi.useGetTopicDataQuery(queryParams);

    const messageDetails = currentData?.Messages?.[0];

    const renderMessageGeneralInfo = () => {
        if (!messageDetails) {
            return null;
        }
        return (
            <TopicMessageGeneralInfo
                messageData={messageDetails}
                schemaInfo={{
                    ProtoMessageName: currentData?.ProtoMessageName,
                    Protoseq: currentData?.Protoseq,
                    SchemaPath: currentData?.SchemaPath,
                }}
            />
        );
    };

    const renderMessageMeta = () => {
        const metadata = messageDetails?.MessageMetadata;

        if (!metadata) {
            return null;
        }

        return <TopicMessageMetadata data={metadata} />;
    };

    const renderMessage = () => {
        const message = messageDetails?.Message;
        const generalSchematizeError = currentData?.SchematizeError;
        const messageSchematizeError = messageDetails?.SchematizeError;

        // A message is schematized (a parsed JSON value, including string
        // primitives) when the response carries schema context (`SchemaPath`)
        // and neither the response nor the message reported a schematization
        // error. Such values must be rendered as-is, without base64 decoding.
        const isSchematized =
            Boolean(currentData?.SchemaPath) && !generalSchematizeError && !messageSchematizeError;

        // Render the section whenever there is a message OR a schematization
        // error to report. Use isNil instead of a broad falsy check so valid
        // falsy schematized values (0, false, '') are not dropped.
        if (isNil(message) && !generalSchematizeError && !messageSchematizeError) {
            return null;
        }
        return (
            <TopicMessage
                message={message}
                offset={messageDetails?.Offset}
                size={messageDetails?.OriginalSize}
                generalSchematizeError={generalSchematizeError}
                messageSchematizeError={messageSchematizeError}
                isSchematized={isSchematized}
            />
        );
    };

    const renderContent = () => {
        const responseError = isResponseError(error);
        const notFoundError = responseError && error.status === 404;
        const noMessages = currentData && !currentData.Messages?.length;
        const isEmpty = Boolean(noMessages || notFoundError);
        if (isEmpty) {
            return (
                <Flex
                    direction="column"
                    grow="grow"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                >
                    <Text variant="subheader-2">
                        {i18n('context_message-not-found', {offset: activeOffset})}
                    </Text>
                    <Icon data={cryCatIcon} size={100} />
                </Flex>
            );
        } else if (error) {
            let text = i18n('context_get-data-error');
            if (responseError && typeof error.data === 'string') {
                text = error.data;
            } else if (responseError && error.statusText) {
                text = error.statusText;
            }
            return (
                <Text color="danger" variant="body-2">
                    {text}
                </Text>
            );
        }

        return (
            <Flex direction="column" gap={4} height="100%">
                {renderMessageGeneralInfo()}
                {renderMessageMeta()}
                {renderMessage()}
            </Flex>
        );
    };

    return (
        <LoaderWrapper loading={isFetching}>
            <div className={b()}>{renderContent()}</div>
        </LoaderWrapper>
    );
}
