import {ClipboardButton} from '@gravity-ui/uikit';
import {PrismLight as ReactSyntaxHighlighter} from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';

import i18n from './i18n';
import {b} from './shared';
import {useSyntaxHighlighterStyle} from './themes';
import type {Language} from './types';
import {yql} from './yql';

import './YDBSyntaxHighlighter.scss';

ReactSyntaxHighlighter.registerLanguage('bash', bash);
ReactSyntaxHighlighter.registerLanguage('cpp', cpp);
ReactSyntaxHighlighter.registerLanguage('csharp', csharp);
ReactSyntaxHighlighter.registerLanguage('go', go);
ReactSyntaxHighlighter.registerLanguage('java', java);
ReactSyntaxHighlighter.registerLanguage('javascript', javascript);
ReactSyntaxHighlighter.registerLanguage('php', php);
ReactSyntaxHighlighter.registerLanguage('python', python);
ReactSyntaxHighlighter.registerLanguage('yql', yql);

type YDBSyntaxHighlighterProps = {
    text: string;
    language: Language;
    className?: string;
    transparentBackground?: boolean;
    withCopy?: boolean;
};

export function YDBSyntaxHighlighter({
    text,
    language,
    className,
    transparentBackground,
    withCopy,
}: YDBSyntaxHighlighterProps) {
    const style = useSyntaxHighlighterStyle(transparentBackground);

    const renderCopyButton = () => {
        if (withCopy) {
            return (
                <div className={b('sticky-container')}>
                    <ClipboardButton
                        view="flat-secondary"
                        size="s"
                        className={b('copy')}
                        text={text}
                    >
                        {i18n('copy')}
                    </ClipboardButton>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={b('wrapper', className)}>
            {renderCopyButton()}

            <ReactSyntaxHighlighter
                language={language}
                style={style}
                customStyle={{height: '100%'}}
            >
                {text}
            </ReactSyntaxHighlighter>
        </div>
    );
}
