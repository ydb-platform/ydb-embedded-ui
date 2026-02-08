import type {QueryTabState} from '../../../../store/reducers/query/types';
import i18n from '../i18n';

export function getNewQueryTitle(counter: number): string {
    if (counter === 0) {
        return i18n('editor-tabs.default-title');
    }
    return i18n('editor-tabs.default-title-indexed', {index: counter});
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
 * or undefined if the tab has no meaningful title (empty or default "New Query").
 */
export function getTabTitleForSave(tab: QueryTabState | undefined): string | undefined {
    if (!tab?.title) {
        return undefined;
    }

    if (tab.isTitleUserDefined) {
        return tab.title;
    }

    if (isDefaultNewQueryTitle(tab.title)) {
        return undefined;
    }

    return tab.title;
}
