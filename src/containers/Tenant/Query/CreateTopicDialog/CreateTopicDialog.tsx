import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {Button, Dialog, Text} from '@gravity-ui/uikit';
import {zodResolver} from '@hookform/resolvers/zod';
import {FormProvider, useForm} from 'react-hook-form';

import {createTopicApi} from '../../../../store/reducers/createTopic/createTopic';
import {cn} from '../../../../utils/cn';
import createToast from '../../../../utils/createToast';
import {prepareErrorMessage} from '../../../../utils/prepareErrorMessage';

import {CREATE_TOPIC_DIALOG, DEFAULT_CREATE_TOPIC_VALUES} from './constants';
import i18n from './i18n';
import type {CreateTopicFormValues} from './schema';
import {createTopicFormSchema, prepareCreateTopicPayload} from './schema';
import {GeneralSection} from './sections/GeneralSection';
import {ParametersSection} from './sections/ParametersSection';

import './CreateTopicDialog.scss';

const b = cn('ydb-create-topic-dialog');

interface CreateTopicDialogProps {
    database: string;
    open: boolean;
    onClose: () => void;
}

function CreateTopicDialog({database, open, onClose}: CreateTopicDialogProps) {
    const [apiError, setApiError] = React.useState<string | null>(null);
    const [createTopic, {isLoading}] = createTopicApi.useCreateTopicMutation();

    const form = useForm<CreateTopicFormValues>({
        defaultValues: DEFAULT_CREATE_TOPIC_VALUES,
        resolver: zodResolver(createTopicFormSchema),
        mode: 'onChange',
    });

    const onSubmit = form.handleSubmit(async (values) => {
        setApiError(null);
        try {
            await createTopic(prepareCreateTopicPayload(values, database)).unwrap();
            createToast({
                name: 'create-topic-success',
                title: i18n('toast_created-title'),
                content: i18n('toast_created-content', {name: values.name}),
                autoHiding: 5000,
                isClosable: true,
            });
            onClose();
        } catch (error) {
            setApiError(prepareErrorMessage(error) || i18n('error_required'));
        }
    });

    return (
        <Dialog open={open} onClose={onClose} size="m" className={b()}>
            <Dialog.Header caption={i18n('title_create-topic')} />
            <FormProvider {...form}>
                <form onSubmit={onSubmit}>
                    <Dialog.Body className={b('body')}>
                        <div className={b('form')}>
                            <GeneralSection />
                            <ParametersSection />
                            {apiError ? (
                                <Text color="danger" className={b('api-error')}>
                                    {apiError}
                                </Text>
                            ) : null}
                        </div>
                    </Dialog.Body>
                    <Dialog.Footer
                        textButtonApply={i18n('action_apply')}
                        textButtonCancel={i18n('action_cancel')}
                        onClickButtonCancel={onClose}
                        loading={isLoading}
                        propsButtonApply={{
                            type: 'submit',
                            disabled: isLoading,
                        }}
                    />
                </form>
            </FormProvider>
        </Dialog>
    );
}

interface CreateTopicDialogNiceModalProps {
    database: string;
}

const CreateTopicDialogNiceModal = NiceModal.create(
    ({database}: CreateTopicDialogNiceModalProps) => {
        const modal = NiceModal.useModal();

        const handleClose = React.useCallback(() => {
            modal.hide();
            modal.remove();
        }, [modal]);

        return <CreateTopicDialog database={database} open={modal.visible} onClose={handleClose} />;
    },
);

NiceModal.register(CREATE_TOPIC_DIALOG, CreateTopicDialogNiceModal);

export function openCreateTopicDialog(props: CreateTopicDialogNiceModalProps) {
    return NiceModal.show(CREATE_TOPIC_DIALOG, props);
}

interface CreateTopicButtonProps {
    database: string;
    disabled?: boolean;
}

export function CreateTopicButton({database, disabled}: CreateTopicButtonProps) {
    const onClick = React.useCallback(() => {
        openCreateTopicDialog({database});
    }, [database]);

    return (
        <Button onClick={onClick} disabled={disabled}>
            {i18n('action_create-topic')}
        </Button>
    );
}
