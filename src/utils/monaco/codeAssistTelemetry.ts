import type Monaco from 'monaco-editor';
import {v4} from 'uuid';

import type {DiscardReason, PromptFile, TelemetryEvent} from '../../types/api/codeAssistant';

const limitBeforeCursor = 8_000;
const limitAfterCursor = 1_000;

const sessionId = v4();

export function getPromptFileContent(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position,
): PromptFile[] | undefined {
    const linesContent = model.getLinesContent();
    const prevTextInCurrentLine = linesContent[position.lineNumber - 1].slice(
        0,
        position.column - 1,
    );
    const postTextInCurrentLine = linesContent[position.lineNumber - 1].slice(position.column - 1);
    const prevText = linesContent
        .slice(0, position.lineNumber - 1)
        .concat([prevTextInCurrentLine])
        .join('\n');
    const postText = [postTextInCurrentLine]
        .concat(linesContent.slice(position.lineNumber))
        .join('\n');
    const cursorPostion = {Ln: position.lineNumber, Col: position.column};

    const fragments = [];
    if (prevText) {
        fragments.push({
            Text:
                prevText.length > limitBeforeCursor
                    ? prevText.slice(prevText.length - limitBeforeCursor)
                    : prevText,
            Start: {Ln: 1, Col: 1},
            End: cursorPostion,
        });
    }
    if (postText) {
        fragments.push({
            Text: postText.slice(0, limitAfterCursor),
            Start: cursorPostion,
            End: {
                Ln: linesContent.length,
                Col: linesContent[linesContent.length - 1].length,
            },
        });
    }

    return fragments.length
        ? [
              {
                  Fragments: fragments,
                  Cursor: cursorPostion,
                  Path: `${sessionId}/query.yql`,
              },
          ]
        : undefined;
}

interface SendCodeAssistTelemetry {
    requestId: string;
}

interface SendCodeAssistTelemetryAccept extends SendCodeAssistTelemetry {
    type: 'accept';

    acceptedText: string;
}
interface SendCodeAssistTelemetryDecline extends SendCodeAssistTelemetry {
    type: 'decline';
    suggestionText: string;
    reason: DiscardReason;
    hitCount: number;
}
interface SendCodeAssistTelemetryIgnore extends SendCodeAssistTelemetry {
    type: 'ignore';
    suggestionText: string;
}
type SendCodeAssistTelemetryProps =
    | SendCodeAssistTelemetryAccept
    | SendCodeAssistTelemetryDecline
    | SendCodeAssistTelemetryIgnore;

function isAcceptType(data: SendCodeAssistTelemetryProps): data is SendCodeAssistTelemetryAccept {
    return data.type === 'accept';
}
function isDeclineType(data: SendCodeAssistTelemetryProps): data is SendCodeAssistTelemetryDecline {
    return data.type === 'decline';
}
function isIgnoreType(data: SendCodeAssistTelemetryProps): data is SendCodeAssistTelemetryIgnore {
    return data.type === 'ignore';
}

export function sendCodeAssistTelemetry(props: SendCodeAssistTelemetryProps) {
    let data: TelemetryEvent | null = null;
    const timestamp = Date.now();
    if (isAcceptType(props)) {
        const {requestId, acceptedText} = props;
        data = {
            Accepted: {
                RequestId: requestId,
                Timestamp: timestamp,
                AcceptedText: acceptedText,
                ConvertedText: acceptedText,
            },
        };
    } else if (isDeclineType(props)) {
        const {requestId, suggestionText, reason, hitCount} = props;
        data = {
            Discarded: {
                RequestId: requestId,
                Timestamp: timestamp,
                DiscardReason: reason,
                DiscardedText: suggestionText,
                CacheHitCount: hitCount,
            },
        };
    } else if (isIgnoreType(props)) {
        const {requestId, suggestionText} = props;
        data = {
            Ignored: {
                RequestId: requestId,
                Timestamp: timestamp,
                IgnoredText: suggestionText,
            },
        };
    }
    if (data) {
        try {
            window.api.codeAssistant?.sendCodeAssistTelemetry(data);
        } catch (e) {
            console.error(e);
        }
    }
}
