import type {Column} from '@gravity-ui/react-data-table';

import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {MyDatabasesTableColumn} from '../../uiFactory/types';

import {DATABASES_COLUMNS_TITLES, DATABASES_DEFAULT_COLUMNS} from './constants';

export function extendDatabaseColumns(
    base: Column<PreparedTenant>[],
    additional: readonly MyDatabasesTableColumn[] = [],
) {
    const titles: Record<string, string> = {...DATABASES_COLUMNS_TITLES};
    const defaults: string[] = [...DATABASES_DEFAULT_COLUMNS];
    const anchors = new Set(base.map(({name}) => name));
    const insertions = new Map<string | undefined, Column<PreparedTenant>[]>();
    for (const {after, settingsTitle, visibleByDefault, ...column} of additional) {
        if (Object.hasOwn(titles, column.name)) {
            continue;
        }
        titles[column.name] = settingsTitle;
        if (visibleByDefault) {
            defaults.push(column.name);
        }
        const anchor = after && anchors.has(after) ? after : undefined;
        const siblings = insertions.get(anchor) ?? [];
        siblings.push(column);
        insertions.set(anchor, siblings);
    }
    const columns = base.flatMap((column) => [column, ...(insertions.get(column.name) ?? [])]);
    columns.push(...(insertions.get(undefined) ?? []));
    return {columns, titles, defaults};
}
