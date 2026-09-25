import type {TColumnDataLifeCycle, TTTLSettings} from '../../../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../../utils/constants';
import {formatDurationToShortTimeFormat} from '../../../../../../utils/timeParsers';
import i18n from '../i18n';

/**
 * Prepares TTL (Time To Live) configuration for display
 * @param ttl - TTL settings from table or column table description
 * @returns Definition list item with TTL info, or undefined if TTL is not configured
 */
export function prepareTTL(ttl: TTTLSettings | TColumnDataLifeCycle) {
    const enabled = ttl.Enabled;
    if (!enabled?.ColumnName) {
        return undefined;
    }

    if (enabled.Tiers?.length) {
        const tiers = enabled.Tiers.flatMap((tier) => {
            const seconds = tier.ApplyAfterSeconds;
            if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
                return [];
            }

            const expireTime = formatDurationToShortTimeFormat(seconds * 1000, 1);
            if (tier.EvictToExternalStorage) {
                return [
                    i18n('value_ttl-evict', {
                        storageName: tier.EvictToExternalStorage.Storage || EMPTY_DATA_PLACEHOLDER,
                        expireTime,
                    }),
                ];
            }
            if (tier.Delete) {
                return [i18n('value_ttl-delete', {expireTime})];
            }
            return [i18n('value_ttl-unknown-action', {expireTime})];
        });

        // Nonempty tiers supersede the legacy expiry, even if all delays are invalid.
        if (!tiers.length) {
            return undefined;
        }

        return {
            name: i18n('field_ttl-for-rows'),
            content: i18n('value_ttl-tiered-config', {
                columnName: enabled.ColumnName,
                tiers: tiers.join('; '),
            }),
        };
    }

    // ExpireAfterSeconds could be 0
    if (enabled.ExpireAfterSeconds !== undefined) {
        const value = i18n('value_ttl-config', {
            columnName: enabled.ColumnName,
            expireTime: formatDurationToShortTimeFormat(enabled.ExpireAfterSeconds * 1000, 1),
        });

        return {name: i18n('field_ttl-for-rows'), content: value};
    }
    return undefined;
}
