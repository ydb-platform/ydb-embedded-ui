import {Label} from '@gravity-ui/uikit';

import type {EDecommitStatus} from '../../../types/api/pdisk';
import {pDiskPageKeyset} from '../i18n';

interface DecommissionLabelProps {
    decommission?: EDecommitStatus;
}

function getDecommissionLabelText(decommission: string) {
    return pDiskPageKeyset('decommission-label', {decommission});
}

export function DecommissionLabel({decommission}: DecommissionLabelProps) {
    if (decommission === 'DECOMMIT_IMMINENT') {
        return (
            <Label theme="danger" size="m">
                {getDecommissionLabelText(pDiskPageKeyset('decommission-imminent'))}
            </Label>
        );
    }
    if (decommission === 'DECOMMIT_PENDING') {
        return (
            <Label theme="warning" size="m">
                {getDecommissionLabelText(pDiskPageKeyset('decommission-pending'))}
            </Label>
        );
    }
    if (decommission === 'DECOMMIT_REJECTED') {
        return (
            <Label theme="normal" size="m">
                {getDecommissionLabelText(pDiskPageKeyset('decommission-rejected'))}
            </Label>
        );
    }

    // Don't display status for undefined, NONE or UNSET decommission
    return null;
}
