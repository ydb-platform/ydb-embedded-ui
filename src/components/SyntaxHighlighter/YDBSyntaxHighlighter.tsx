import React from 'react';

import {nanoid} from '@reduxjs/toolkit';
import {PrismLight as ReactSyntaxHighlighter} from 'react-syntax-highlighter';

import type {ClipboardButtonProps} from '../ClipboardButton/ClipboardButton';
import {ClipboardButton} from '../ClipboardButton/ClipboardButton';

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

export interface WithClipboardButtonProp extends ClipboardButtonProps {
    alwaysVisible?: boolean;
}

export type YDBSyntaxHighlighterProps = {
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

    const renderCopyButton = () => {
        if (!withClipboardButton) {
            return null;
        }
        const {alwaysVisible, copyText, ...rest} = withClipboardButton;
        return (
            <div className={b('sticky-container')} onClick={(e) => e.stopPropagation()}>
                <ClipboardButton
                    {...rest}
                    copyText={copyText || text}
                    className={b('copy', {
                        visible: alwaysVisible,
                    })}
                />
            </div>
        );
    };

    let paddingStyles = {};

    if (withClipboardButton?.alwaysVisible) {
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
