import {useThemeValue} from '@gravity-ui/uikit';
import {materialLight, vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism';

export const lightTransparent = {
    ...materialLight,
    'pre[class*="language-"]': {
        ...materialLight['pre[class*="language-"]'],
        background: 'transparent',
        margin: 0,
        lineHeight: '15px',
    },
    'code[class*="language-"]': {
        ...materialLight['code[class*="language-"]'],
        background: 'transparent',
        color: 'var(--g-color-text-primary)',
        whiteSpace: 'pre-wrap' as const,
        fontSize: '13px',
    },
    comment: {
        color: '#969896',
    },
    string: {
        color: '#a31515',
    },
    tablepath: {
        color: '#338186',
    },
    function: {
        color: '#7a3e9d',
    },
    udf: {
        color: '#7a3e9d',
    },
    type: {
        color: '#4d932d',
    },
    boolean: {
        color: '#608b4e',
    },
    constant: {
        color: '#608b4e',
    },
    variable: {
        color: '#001188',
    },
};

export const darkTransparent = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
        ...vscDarkPlus['pre[class*="language-"]'],
        background: 'transparent',
        margin: 0,
        lineHeight: '15px',
    },
    'code[class*="language-"]': {
        ...vscDarkPlus['code[class*="language-"]'],
        background: 'transparent',
        color: 'var(--g-color-text-primary)',
        whiteSpace: 'pre-wrap' as const,
        fontSize: '13px',
    },
    comment: {
        color: '#969896',
    },
    string: {
        color: '#ce9178',
    },
    tablepath: {
        color: '#338186',
    },
    function: {
        color: '#9e7bb0',
    },
    udf: {
        color: '#9e7bb0',
    },
    type: {
        color: '#6A8759',
    },
    boolean: {
        color: '#608b4e',
    },
    constant: {
        color: '#608b4e',
    },
    variable: {
        color: '#74b0df',
    },
};

const dark: Record<string, React.CSSProperties> = {
    ...darkTransparent,
    'pre[class*="language-"]': {
        ...darkTransparent['pre[class*="language-"]'],
        background: vscDarkPlus['pre[class*="language-"]'].background,
        scrollbarColor: `var(--g-color-scroll-handle) transparent`,
        lineHeight: '15px',
    },
    'code[class*="language-"]': {
        ...darkTransparent['code[class*="language-"]'],
        whiteSpace: 'pre',
        fontSize: '13px',
    },
};

const light: Record<string, React.CSSProperties> = {
    ...lightTransparent,
    'pre[class*="language-"]': {
        ...lightTransparent['pre[class*="language-"]'],
        background: 'var(--g-color-base-misc-light)',
        scrollbarColor: `var(--g-color-scroll-handle) transparent`,
        lineHeight: '15px',
    },
    'code[class*="language-"]': {
        ...lightTransparent['code[class*="language-"]'],
        whiteSpace: 'pre',
        fontSize: '13px',
    },
};

export function useSyntaxHighlighterStyle(transparentBackground?: boolean) {
    const themeValue = useThemeValue();
    const isDark = themeValue === 'dark' || themeValue === 'dark-hc';

    if (transparentBackground) {
        return isDark ? darkTransparent : lightTransparent;
    }

    return isDark ? dark : light;
}
