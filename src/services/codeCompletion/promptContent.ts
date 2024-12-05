import type Monaco from 'monaco-editor';
import {v4} from 'uuid';

import type {PromptFile} from './types';

export interface TextLimits {
    beforeCursor: number;
    afterCursor: number;
}

const DEFAULT_LIMITS: Required<TextLimits> = {
    beforeCursor: 8_000,
    afterCursor: 1_000,
};

const sessionId = v4();

export function getPromptFileContent(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position,
    limits?: Partial<TextLimits>,
): PromptFile[] | undefined {
    // Merge with defaults to ensure we always have valid numbers
    const finalLimits: Required<TextLimits> = {
        ...DEFAULT_LIMITS,
        ...limits,
    };

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
                prevText.length > finalLimits.beforeCursor
                    ? prevText.slice(prevText.length - finalLimits.beforeCursor)
                    : prevText,
            Start: {Ln: 1, Col: 1},
            End: cursorPostion,
        });
    }
    if (postText) {
        fragments.push({
            Text: postText.slice(0, finalLimits.afterCursor),
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
