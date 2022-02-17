import React from 'react';
import {escapeStringForRegExp} from './helpers';
import {SettingsPage} from './collect-settings';

function identity(x: any) {
    return x;
}

export function filterSettings(
    pages: Record<string, SettingsPage>,
    search = '',
    wrapFoundTitle: (title: string, search: string) => React.ReactNode = identity,
) {
    // 'abc def fg' -> abc.*?cde.*?fg
    const preparedFilter = escapeStringForRegExp(search).replace(/\s+/g, '.*?');
    const filterRe = new RegExp(preparedFilter, 'i');
    for (const page of Object.values(pages)) {
        let hidePage = true;
        for (const section of page.sections) {
            let hideSection = true;
            for (const item of section.items) {
                item.hide = Boolean(search) && !filterRe.test(item.title);
                if (item.renderTitleComponent) {
                    item.titleComponent = item.renderTitleComponent(
                        search && !item.hide ? wrapFoundTitle(item.title, search) : null,
                    );
                } else {
                    item.titleComponent =
                        search && !item.hide ? wrapFoundTitle(item.title, search) : item.title;
                }
                hideSection = hideSection && item.hide;
            }
            section.hide = hideSection;
            hidePage = hidePage && hideSection;
        }
        page.hide = hidePage;
    }
}
