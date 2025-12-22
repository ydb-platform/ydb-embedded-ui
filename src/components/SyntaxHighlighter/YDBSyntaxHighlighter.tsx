import React from 'react';

import {useThemeType} from '@gravity-ui/uikit';

import type {ClipboardButtonProps} from '../ClipboardButton/ClipboardButton';
import {ClipboardButton} from '../ClipboardButton/ClipboardButton';

import {b} from './shared';
import {highlightCode} from './shikiHighlighter';
import type {Language} from './types';

import './YDBSyntaxHighlighter.scss';

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
    const [highlightedHtml, setHighlightedHtml] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState(true);

    const themeType = useThemeType();

    React.useEffect(() => {
        let cancelled = false;

        async function highlight() {
            setIsLoading(true);
            try {
                const html = await highlightCode(text, language, themeType);
                if (!cancelled) {
                    setHighlightedHtml(html);
                }
            } catch (error) {
                console.error('Failed to highlight code:', error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        highlight();

        return () => {
            cancelled = true;
        };
    }, [text, language, themeType]);

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
                    view="flat-secondary"
                />
            </div>
        );
    };

    let paddingStyles = {};
    if (withClipboardButton?.alwaysVisible) {
        if (withClipboardButton.withLabel === false) {
            paddingStyles = {paddingRight: 40};
        } else {
            paddingStyles = {paddingRight: 80};
        }
    }

    const containerStyle: React.CSSProperties = {
        ...paddingStyles,
    };

    if (transparentBackground) {
        containerStyle.background = 'transparent';
    }

    return (
        <div className={b(null, className)}>
            {renderCopyButton()}

            {isLoading || !highlightedHtml ? (
                <div
                    style={containerStyle}
                    className={b('content', {transparent: transparentBackground})}
                >
                    <pre>
                        <code>{text}</code>
                    </pre>
                </div>
            ) : (
                <div
                    className={b('content', {transparent: transparentBackground})}
                    style={containerStyle}
                    dangerouslySetInnerHTML={{__html: highlightedHtml}}
                />
            )}
        </div>
    );
}
