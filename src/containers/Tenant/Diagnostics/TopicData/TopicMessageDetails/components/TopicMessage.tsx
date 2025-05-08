import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Button, ClipboardButton, Flex, Icon, Text} from '@gravity-ui/uikit';

import {JsonViewer} from '../../../../../../components/JsonViewer/JsonViewer';
import {unipikaConvert} from '../../../../../../components/JsonViewer/unipika/unipika';
import ShortyString from '../../../../../../components/ShortyString/ShortyString';
import {createAndDownloadStringifiedJsonFile} from '../../../../../../utils/downloadFile';
import {useTypedSelector} from '../../../../../../utils/hooks';
import {bytesToMB, safeParseNumber} from '../../../../../../utils/utils';
import i18n from '../../i18n';
import {MESSAGE_SIZE_LIMIT, b} from '../shared';

import {TopicDataSection} from './TopicDataSection';

const UNIPIKA_MAX_SIZE = 100_000;

interface TopicMessageProps {
    message: string;
    offset?: string | number;
    size?: number;
}

export function TopicMessage({offset, size, message}: TopicMessageProps) {
    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const {preparedMessage, decodedMessage, convertedMessage} = React.useMemo(() => {
        let preparedMessage = message;
        let decodedMessage = message;
        try {
            decodedMessage = atob(message);
        } catch (e) {
            console.warn(e);
        }

        try {
            const jsonMessage = JSON.parse(decodedMessage);
            if (jsonMessage && typeof jsonMessage === 'object') {
                preparedMessage = jsonMessage;
            } else {
                preparedMessage = decodedMessage;
            }
        } catch (e) {
            console.warn(e);
        }

        let convertedMessage;
        if (typeof preparedMessage === 'object' && safeParseNumber(size) <= UNIPIKA_MAX_SIZE) {
            convertedMessage = unipikaConvert(preparedMessage);
        }

        return {preparedMessage, decodedMessage, convertedMessage};
    }, [message, size]);

    const isJson = Boolean(convertedMessage);

    const messageContent = isJson ? (
        <JsonViewer
            // key is used to reset JsonViewer state to collapsed due to performance issues on close fullscreen mode if nodes quantity is big enough https://github.com/ydb-platform/ydb-embedded-ui/issues/2265
            key={String(isFullscreen)}
            collapsedInitially
            value={convertedMessage}
            maxValueWidth={50}
            toolbarClassName={b('json-viewer-toolbar')}
        />
    ) : (
        <div className={b('string-message')}>
            {/* key is used to reset string's state when toggle fullscreen: otherwise if very long string is expanded, it may be performance issues on open fullscreen mode https://github.com/ydb-platform/ydb-embedded-ui/issues/2265  */}
            <ShortyString
                key={String(isFullscreen)}
                value={JSON.stringify(preparedMessage, null, 2)}
                limit={1000}
            />
        </div>
    );

    const renderToolbar = () => {
        return (
            <Flex gap={1}>
                <ActionTooltip title={i18n('label_download')}>
                    <Button
                        view="flat-secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            createAndDownloadStringifiedJsonFile(
                                decodedMessage,
                                `topic-message-${offset ?? 'unknown-offset'}`,
                            );
                        }}
                    >
                        JSON <Icon data={ArrowDownToLine} />
                    </Button>
                </ActionTooltip>
                <ClipboardButton view="flat-secondary" text={decodedMessage} />
            </Flex>
        );
    };

    const truncated = safeParseNumber(size) > MESSAGE_SIZE_LIMIT;

    return (
        <TopicDataSection
            title={<MessageTitle truncated={truncated} />}
            renderToolbar={renderToolbar}
            className={b('message', {json: isJson})}
        >
            {messageContent}
        </TopicDataSection>
    );
}

interface MessageTitleProps {
    truncated?: boolean;
}

function MessageTitle({truncated}: MessageTitleProps) {
    return (
        <span>
            {i18n('label_message')}
            {truncated && (
                <React.Fragment>
                    {' '}
                    <Text color="secondary">
                        [
                        {i18n('label_truncated', {
                            size: bytesToMB(MESSAGE_SIZE_LIMIT),
                        })}
                        ]
                    </Text>
                </React.Fragment>
            )}
        </span>
    );
}
