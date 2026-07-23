import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Alert, Button, ClipboardButton, Flex, Icon, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {JsonViewer} from '../../../../../../components/JsonViewer/JsonViewer';
import ShortyString from '../../../../../../components/ShortyString/ShortyString';
import {createAndDownloadFile} from '../../../../../../utils/downloadFile';
import {useTypedSelector} from '../../../../../../utils/hooks';
import {bytesToMB, safeParseNumber} from '../../../../../../utils/utils';
import i18n from '../../i18n';
import {MESSAGE_SIZE_LIMIT, b} from '../shared';

import {TopicDataSection} from './TopicDataSection';

const UNIPIKA_MAX_SIZE = 1_000_000;
const utf8Decoder = new TextDecoder('utf-8');

interface TopicMessageProps {
    message: string | unknown;
    offset?: string | number;
    size?: number;
    generalSchematizeError?: string;
    messageSchematizeError?: string;
    /**
     * When true the message value is already schematized (including string
     * primitives) and must be rendered as-is without base64 decoding.
     */
    isSchematized?: boolean;
}

export function TopicMessage({
    offset,
    size,
    message,
    generalSchematizeError,
    messageSchematizeError,
    isSchematized,
}: TopicMessageProps) {
    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const sectionScrollRef = React.useRef<HTMLDivElement>(null);

    // The message may be absent while a schematization error is still present
    // (error-only rows). In that case we render the alerts but no content/toolbar.
    const hasMessage = !isNil(message);

    const {preparedMessage, decodedMessage, isJson, rawBytes} = React.useMemo(() => {
        // A schematized value is already a parsed JSON value (object/array or a
        // primitive such as a string) and must be used as-is. Only legacy,
        // non-schematized string values are base64-encoded and need decoding.
        // A raw string value alone is ambiguous, so we rely on the
        // `isSchematized` signal derived from the response schema context rather
        // than guessing from the type.
        let preparedMessage: string | unknown = message;
        // decodedMessage is always a string, suitable for preview/clipboard. It is
        // a best-effort UTF-8 rendering and MUST NOT be used for downloading the
        // message, since non-UTF-8 binary payloads get lossily mangled (invalid
        // byte sequences become U+FFFD) - use `rawBytes` for that instead.
        let decodedMessage: string =
            typeof message === 'string' ? message : JSON.stringify(message, null, 2);
        // Raw decoded bytes of a non-schematized base64 message, exactly as sent
        // by the backend - the only safe source for downloading binary messages.
        let rawBytes: Uint8Array | undefined;

        if (typeof message === 'string' && !isSchematized) {
            try {
                const binary = atob(message);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                rawBytes = bytes;
                decodedMessage = utf8Decoder.decode(bytes);
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
                preparedMessage = decodedMessage;
                console.warn(e);
            }
        }

        let isJson = false;
        if (typeof preparedMessage === 'object' && safeParseNumber(size) <= UNIPIKA_MAX_SIZE) {
            isJson = true;
        } else if (preparedMessage && typeof preparedMessage === 'object') {
            preparedMessage = JSON.stringify(preparedMessage, null, 2);
        }

        return {preparedMessage, decodedMessage, isJson, rawBytes};
    }, [message, size, isSchematized]);

    const renderMessageContent = () => {
        if (!hasMessage) {
            return null;
        }

        if (isJson) {
            return (
                <JsonViewer
                    // key is used to reset JsonViewer state to collapsed due to performance issues on close fullscreen mode if nodes quantity is big enough https://github.com/ydb-platform/ydb-embedded-ui/issues/2265
                    key={String(isFullscreen)}
                    collapsedInitially
                    value={preparedMessage}
                    toolbarClassName={b('json-viewer-toolbar')}
                    scrollContainerRef={sectionScrollRef}
                />
            );
        }

        return (
            <div className={b('string-message')}>
                {/* key is used to reset string's state when toggle fullscreen: otherwise if very long string is expanded, it may be performance issues on open fullscreen mode https://github.com/ydb-platform/ydb-embedded-ui/issues/2265  */}
                <ShortyString
                    key={String(isFullscreen)}
                    value={
                        typeof preparedMessage === 'string'
                            ? preparedMessage
                            : JSON.stringify(preparedMessage)
                    }
                    limit={2000}
                />
            </div>
        );
    };

    const renderToolbar = () => {
        return (
            <Flex gap={1}>
                <ActionTooltip title={i18n('label_download')}>
                    <Button
                        view="flat-secondary"
                        aria-label={i18n('label_download')}
                        onClick={(e) => {
                            e.stopPropagation();
                            createAndDownloadFile(
                                rawBytes ?? decodedMessage,
                                `topic-message-${offset ?? 'unknown-offset'}`,
                            );
                        }}
                    >
                        <Icon data={ArrowDownToLine} />
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
            renderToolbar={hasMessage ? renderToolbar : undefined}
            className={b('message')}
            scrollContainerRef={sectionScrollRef}
        >
            {generalSchematizeError && (
                <Alert
                    className={b('schematize-error')}
                    theme="danger"
                    message={generalSchematizeError}
                />
            )}
            {messageSchematizeError && (
                <Alert
                    className={b('schematize-error')}
                    theme="danger"
                    message={messageSchematizeError}
                    view="outlined"
                />
            )}
            {renderMessageContent()}
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
