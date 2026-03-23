import type {QueryTabState} from '../../../../store/reducers/query/types';
import i18n from '../i18n';

const QUERY_TEXT_TAB_TITLE_MAX_LENGTH = 60;

export function getNewQueryTitle(counter: number): string {
    if (counter === 0) {
        return i18n('editor-tabs.default-title');
    }
    return i18n('editor-tabs.default-title-indexed', {index: counter});
}

export function getQueryTextTabTitle(queryText: string): string {
    const firstNonEmptyLine = queryText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);

    if (!firstNonEmptyLine) {
        return i18n('editor-tabs.default-title');
    }

    return firstNonEmptyLine.slice(0, QUERY_TEXT_TAB_TITLE_MAX_LENGTH);
}

export function isDefaultNewQueryTitle(title: string): boolean {
    const baseTitle = i18n('editor-tabs.default-title');
    if (title === baseTitle) {
        return true;
    }

    const prefix = baseTitle + ' ';
    if (title.startsWith(prefix)) {
        const suffix = title.slice(prefix.length);
        return /^\d+$/.test(suffix);
    }

    return false;
}

/**
 * Returns the tab title suitable for pre-filling the "Save query" dialog name,
 * or undefined if the tab is missing.
 */
export function getTabTitleForSave(tab: QueryTabState | undefined): string | undefined {
    if (!tab) {
        return undefined;
    }
    return tab.title || i18n('editor-tabs.default-title');
}
