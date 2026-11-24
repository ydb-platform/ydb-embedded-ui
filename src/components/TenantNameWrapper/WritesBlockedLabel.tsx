import {Label, Tooltip} from '@gravity-ui/uikit';

import type {TTenant} from '../../types/api/tenant';

import i18n from './i18n';

export function WritesBlockedLabel({tenant}: {tenant: TTenant}) {
    const reason = tenant.DomainState?.StorageSpaceExhausted
        ? i18n('context_storage-exhausted')
        : i18n('context_quota-blocked');

    return (
        <Tooltip content={reason}>
            <span tabIndex={0}>
                <Label theme="danger" size="xs">
                    {i18n('value_writes-blocked')}
                </Label>
            </span>
        </Tooltip>
    );
}
