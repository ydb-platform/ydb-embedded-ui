import {createHighlighter} from 'shiki';
import type {Highlighter} from 'shiki';

import {yqlDarkTheme, yqlLightTheme} from './themes';
import type {Language, Theme} from './types';

import yqlGrammar from 'monaco-yql-languages/build/yql/YQL.tmLanguage.json';

// Custom themes for YQL
const YQL_LIGHT_THEME = 'yql-light';
const YQL_DARK_THEME = 'yql-dark';

// Standard themes for other languages
const STANDARD_LIGHT_THEME = 'github-light';
const STANDARD_DARK_THEME = 'github-dark';

// Cache the highlighter promise to prevent multiple instances
let highlighterPromise: Promise<Highlighter> | null = null;

// Track what's already loaded
const loadedLanguages = new Set<Language>();
const loadedThemes = new Set<Theme>();

/**
 * Get or create the single highlighter instance
 */
async function getHighlighter(): Promise<Highlighter> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: [],
            langs: [],
        });
    }
    return highlighterPromise;
}

/**
 * Ensure language is loaded into the highlighter
 */
async function ensureLanguageLoaded(lang: Language): Promise<void> {
    if (loadedLanguages.has(lang)) {
        return;
    }

    const hl = await getHighlighter();

    try {
        if (lang === 'yql') {
            await hl.loadLanguage(yqlGrammar);
        } else {
            await hl.loadLanguage(lang);
        }
        loadedLanguages.add(lang);
    } catch (error) {
        console.error(`Failed to load language: ${lang}`, error);
        throw error;
    }
}

/**
 * Ensure theme is loaded into the highlighter
 */
async function ensureThemeLoaded(themeName: Theme): Promise<void> {
    if (loadedThemes.has(themeName)) {
        return;
    }

    const hl = await getHighlighter();

    try {
        if (themeName === YQL_LIGHT_THEME) {
            await hl.loadTheme(yqlLightTheme);
        } else if (themeName === YQL_DARK_THEME) {
            await hl.loadTheme(yqlDarkTheme);
        } else {
            await hl.loadTheme(themeName);
        }
        loadedThemes.add(themeName);
    } catch (error) {
        console.error(`Failed to load theme: ${themeName}`, error);
        throw error;
    }
}

/**
 * Highlight code with Shiki
 * Uses a single highlighter instance with on-demand loading of languages and themes
 */
export async function highlightCode(
    code: string,
    lang: Language,
    theme: 'light' | 'dark',
): Promise<string> {
    // Determine theme name
    const isYql = lang === 'yql';
    const isDark = theme === 'dark';

    let themeName: Theme = isDark ? STANDARD_DARK_THEME : STANDARD_LIGHT_THEME;
    if (isYql) {
        themeName = isDark ? YQL_DARK_THEME : YQL_LIGHT_THEME;
    }

    // Load language and theme if needed
    await Promise.all([ensureLanguageLoaded(lang), ensureThemeLoaded(themeName)]);

    const hl = await getHighlighter();

    return hl.codeToHtml(code, {
        lang,
        theme: themeName,
    });
}
