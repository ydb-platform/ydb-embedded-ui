import * as NiceModal from '@ebay/nice-modal-react';
import {Alert, Flex} from '@gravity-ui/uikit';

import {CONFIRMATION_DIALOG} from '../../../../../components/ConfirmationDialog/ConfirmationDialog';
import {BRAND_BUTTON_CLASS} from '../../../../../utils/constants';
import i18n from '../i18n';

interface ShowMoveOffsetConfirmationParams {
    confirmMessage: string;
    alertMessage: string;
    onConfirm: () => void;
}

export function showMoveOffsetConfirmation({
    confirmMessage,
    alertMessage,
    onConfirm,
}: ShowMoveOffsetConfirmationParams) {
    NiceModal.show(CONFIRMATION_DIALOG, {
        id: CONFIRMATION_DIALOG,
        caption: i18n('title_move-offset'),
        children: (
            <Flex direction="column" gap={4}>
                {confirmMessage}
                <Alert theme="warning" message={alertMessage} />
            </Flex>
        ),
        textButtonApply: i18n('action_move-offset'),
        buttonApplyView: 'action',
        propsButtonApply: {className: BRAND_BUTTON_CLASS},
        onConfirm,
        confirmOnEnter: true,
    });
}
