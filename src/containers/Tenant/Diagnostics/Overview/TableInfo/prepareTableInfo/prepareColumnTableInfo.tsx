import {Text} from '@gravity-ui/uikit';

import type {YDBDefinitionListItem} from '../../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TColumnTableDescription} from '../../../../../../types/api/schema';
import i18n from '../i18n';

import {prepareTTL} from './prepareTTL';

/**
 * Checks if column table is part of a column store (not standalone)
 */
const isInStoreColumnTable = (table: TColumnTableDescription) => {
    // SchemaPresetId could be 0
    return table.SchemaPresetName && table.SchemaPresetId !== undefined;
};

/**
 * Prepares general information for column tables (EPathTypeColumnTable)
 */
export function prepareColumnTableGeneralInfo(columnTable: TColumnTableDescription) {
    const left: YDBDefinitionListItem[] = [];

    left.push({
        name: i18n('field_standalone'),
        content: String(!isInStoreColumnTable(columnTable)),
    });

    if (columnTable.Sharding?.HashSharding?.Columns) {
        const columns = columnTable.Sharding.HashSharding.Columns.join(', ');
        const content = `PARTITION BY HASH(${columns})`;

        left.push({
            name: i18n('field_partitioning'),
            content: (
                <Text variant="code-2" wordBreak="break-word">
                    {content}
                </Text>
            ),
        });
    }

    if (columnTable.TtlSettings) {
        const ttlInfo = prepareTTL(columnTable?.TtlSettings);
        if (ttlInfo) {
            left.push(ttlInfo);
        }
    }

    return left;
}
