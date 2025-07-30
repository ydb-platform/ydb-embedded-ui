import React from 'react';

import type {ButtonSize} from '@gravity-ui/uikit';
import {ClipboardButton} from '@gravity-ui/uikit';
import {nanoid} from '@reduxjs/toolkit';
import {PrismLight as ReactSyntaxHighlighter} from 'react-syntax-highlighter';

import i18n from './i18n';
import {b} from './shared';
import {useSyntaxHighlighterStyle} from './themes';
import type {Language} from './types';
import {yql} from './yql';

import './YDBSyntaxHighlighter.scss';

async function registerLanguage(lang: Language) {
    if (lang === 'yql') {
        ReactSyntaxHighlighter.registerLanguage('yql', yql);
    } else {
        const {default: syntax} = await import(
            `react-syntax-highlighter/dist/esm/languages/prism/${lang}`
        );
        ReactSyntaxHighlighter.registerLanguage(lang, syntax);
    }
}

interface ClipboardButtonOptions {
    alwaysVisible?: boolean;
    copyText?: string;
    withLabel?: boolean;
    size?: ButtonSize;
}

export type WithClipboardButtonProp = ClipboardButtonOptions | boolean;

type YDBSyntaxHighlighterProps = {
    text: string;
    language: Language;
    className?: string;
    transparentBackground?: boolean;
    withClipboardButton?: WithClipboardButtonProp;
};

export function YDBSyntaxHighlighter({
    text,
    language,
    className,
    transparentBackground = true,
    withClipboardButton,
}: YDBSyntaxHighlighterProps) {
    const [highlighterKey, setHighlighterKey] = React.useState('');

    const style = useSyntaxHighlighterStyle(transparentBackground);

    React.useEffect(() => {
        async function registerLangAndUpdateKey() {
            await registerLanguage(language);
            setHighlighterKey(nanoid());
        }
        registerLangAndUpdateKey();
    }, [language]);

    const clipboardButtonProps =
        typeof withClipboardButton === 'object' ? withClipboardButton : undefined;

    const renderCopyButton = () => {
        if (withClipboardButton) {
            return (
                <div className={b('sticky-container')} onClick={(e) => e.stopPropagation()}>
                    <ClipboardButton
                        view="flat-secondary"
                        size={clipboardButtonProps?.size || 'xs'}
                        className={b('copy', {
                            visible: clipboardButtonProps?.alwaysVisible,
                        })}
                        text={clipboardButtonProps?.copyText || text}
                    >
                        {clipboardButtonProps?.withLabel === false ? null : i18n('copy')}
                    </ClipboardButton>
                </div>
            );
        }

        return null;
    };

    let paddingStyles = {};

    if (
        withClipboardButton &&
        typeof withClipboardButton === 'object' &&
        withClipboardButton.alwaysVisible
    ) {
        if (withClipboardButton.withLabel) {
            paddingStyles = {paddingRight: 80};
        } else {
            paddingStyles = {paddingRight: 40};
        }
    }

    return (
        <div className={b(null, className)}>
            {renderCopyButton()}

            <ReactSyntaxHighlighter
                key={highlighterKey}
                language={language}
                style={style}
                customStyle={{height: '100%', ...paddingStyles}}
            >
                {text}
            </ReactSyntaxHighlighter>
        </div>
    );
}
