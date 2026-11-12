import React from 'react';

import {Button, Dialog, Flex, Text} from '@gravity-ui/uikit';

import i18n from './i18n';
import {b} from './shared';

export function OperationError({
    status,
    message,
    id,
}: {
    status: string;
    message: string;
    id?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const close = () => setOpen(false);
    return (
        <Flex alignItems="center" gap={2}>
            <Text color="danger">{status}</Text>
            <Button
                view="normal"
                size="s"
                onClick={() => setOpen(true)}
                aria-label={i18n('action_show-details-for-operation', {id: id ?? ''})}
            >
                {i18n('action_show-details')}
            </Button>
            <Dialog open={open} onClose={close} size="m">
                <Dialog.Header caption={i18n('title_operation-error', {id: id ?? ''})} />
                <Dialog.Body>
                    <pre className={b('error-text')}>{message}</pre>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonCancel={i18n('action_close')}
                    onClickButtonCancel={close}
                />
            </Dialog>
        </Flex>
    );
}
