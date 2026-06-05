import type {TColumnDataLifeCycle, TTTLSettings} from '../../../../../../types/api/schema';
import {formatDurationToShortTimeFormat} from '../../../../../../utils/timeParsers';
import i18n from '../i18n';

/**
 * Prepares TTL (Time To Live) configuration for display
 * @param ttl - TTL settings from table or column table description
 * @returns Definition list item with TTL info, or undefined if TTL is not configured
 */
export function prepareTTL(ttl: TTTLSettings | TColumnDataLifeCycle) {
    // ExpireAfterSeconds could be 0
    if (ttl.Enabled && ttl.Enabled.ColumnName && ttl.Enabled.ExpireAfterSeconds !== undefined) {
        const value = i18n('value_ttl-config', {
            columnName: ttl.Enabled.ColumnName,
            expireTime: formatDurationToShortTimeFormat(ttl.Enabled.ExpireAfterSeconds * 1000, 1),
        });

        return {name: i18n('field_ttl-for-rows'), content: value};
    }
    return undefined;
}
