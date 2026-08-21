import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import type {ButtonButtonProps} from '@gravity-ui/uikit';
import {Button, Dialog, DropdownMenu, TextInput} from '@gravity-ui/uikit';

import {
    selectActiveTab,
    selectActiveTabSavedQueryName,
    selectUserInput,
    setIsDirty,
    syncSavedQueryTab,
} from '../../../../store/reducers/query/query';
import {setQueryAction} from '../../../../store/reducers/queryActions/queryActions';
import type {SavedQuery} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {getTabTitleForSave} from '../utils/queryTabTitles';
import {hasSavedQueryName} from '../utils/savedQueries';
import {useSavedQueries} from '../utils/useSavedQueries';
import {useUpdateSavedQueryFromTab} from '../utils/useUpdateSavedQueryFromTab';

import i18n from './i18n';

import './SaveQuery.scss';

const b = cn('ydb-save-query');

export const SAVE_QUERY_DIALOG = 'save-query-dialog';

interface SaveQueryProps {
    buttonProps?: ButtonButtonProps;
}

export function useSaveQueryWithTabSync() {
    const dispatch = useTypedDispatch();
    const {saveQuery} = useSavedQueries();
    const activeTab = useTypedSelector(selectActiveTab);

    return React.useCallback(
        (tabId?: string) => {
            const targetTabId = tabId ?? activeTab?.id;

            return (queryName: string | null, queryBody: string) => {
                saveQuery(queryName, queryBody);

                if (targetTabId && queryName) {
                    dispatch(
                        syncSavedQueryTab({
                            tabId: targetTabId,
                            title: queryName,
                            savedQueryName: queryName,
                        }),
                    );
                }
            };
        },
        [activeTab, dispatch, saveQuery],
    );
}

function useSaveQueryHandler(dialogProps: SaveQueryDialogCommonProps) {
    const {savedQueries} = useSavedQueries();
    const activeTab = useTypedSelector(selectActiveTab);
    const createSaveQueryHandler = useSaveQueryWithTabSync();

    const onSaveQueryClick = React.useCallback(() => {
        const computedDefaultQueryName = getTabTitleForSave(activeTab);
        const handleSaveQuery = createSaveQueryHandler(activeTab?.id);

        NiceModal.show(SAVE_QUERY_DIALOG, {
            ...dialogProps,
            defaultQueryName: dialogProps.defaultQueryName ?? computedDefaultQueryName,
            savedQueries,
            onSaveQuery: handleSaveQuery,
        });
    }, [activeTab, createSaveQueryHandler, dialogProps, savedQueries]);

    return onSaveQueryClick;
}

interface SaveQueryButtonProps extends ButtonButtonProps {
    dialogProps: SaveQueryDialogCommonProps;
}

export function SaveQueryButton({dialogProps, children, ...buttonProps}: SaveQueryButtonProps) {
    const onSaveQueryClick = useSaveQueryHandler(dialogProps);

    return (
        <Button onClick={onSaveQueryClick} {...buttonProps}>
            {children ?? i18n('action.save')}
        </Button>
    );
}

export function SaveQuery({buttonProps = {}}: SaveQueryProps) {
    const activeTab = useTypedSelector(selectActiveTab);
    const activeTabSavedQueryName = useTypedSelector(selectActiveTabSavedQueryName);
    const currentInput = useTypedSelector(selectUserInput);
    const onSaveQueryClick = useSaveQueryHandler({queryBody: currentInput});
    const currentSavedQueryName = activeTabSavedQueryName;
    const updateSavedQueryFromTab = useUpdateSavedQueryFromTab();

    const onEditQueryClick = () => {
        if (!activeTab || !currentSavedQueryName) {
            return;
        }

        updateSavedQueryFromTab(activeTab, activeTab.title, currentInput);
    };

    const renderSaveDropdownMenu = () => {
        const items = [
            {
                action: onEditQueryClick,
                text: i18n('action.edit-existing'),
            },
            {
                action: onSaveQueryClick,
                text: i18n('action.save-as-new'),
            },
        ];
        return (
            <DropdownMenu
                items={items}
                renderSwitcher={(props) => (
                    <Button {...props} {...buttonProps}>
                        {i18n('action.edit')}
                    </Button>
                )}
                popupProps={{placement: 'top'}}
            />
        );
    };

    return currentSavedQueryName ? (
        renderSaveDropdownMenu()
    ) : (
        <SaveQueryButton {...buttonProps} dialogProps={{queryBody: currentInput}} />
    );
}

interface SaveQueryDialogCommonProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    defaultQueryName?: string;
    queryBody: string;
}

interface SaveQueryDialogProps extends SaveQueryDialogCommonProps {
    open: boolean;
    savedQueries?: SavedQuery[];
    onSaveQuery: (name: string | null, body: string) => void;
}

function SaveQueryDialog({
    onSuccess,
    onCancel,
    onClose,
    defaultQueryName,
    open,
    savedQueries,
    onSaveQuery,
    queryBody,
}: SaveQueryDialogProps) {
    const dispatch = useTypedDispatch();
    const [queryName, setQueryName] = React.useState(defaultQueryName ?? '');
    const [validationError, setValidationError] = React.useState<string>();
    const controlRef = React.useRef<HTMLInputElement>(null);

    const validateQueryName = (value: string) => {
        if (!value.trim()) {
            return i18n('error.name-not-empty');
        }
        if (savedQueries && hasSavedQueryName(savedQueries, value)) {
            return i18n('error.name-exists');
        }
        return undefined;
    };

    const onCloseDialog = () => {
        dispatch(setQueryAction('idle'));
        setQueryName('');
        setValidationError(undefined);
        onClose?.();
    };

    const onCloseWithoutSave = () => {
        onCancel?.();
        onCloseDialog();
    };

    const handleQueryNameChange = (value: string) => {
        setQueryName(value);
        setValidationError(undefined);
    };

    const onSaveClick = () => {
        onSaveQuery(queryName.trim(), queryBody);
        dispatch(setIsDirty(false));
        onCloseDialog();
        onSuccess?.();
    };

    return (
        <Dialog
            open={open}
            hasCloseButton={true}
            size="s"
            onClose={onCloseWithoutSave}
            initialFocus={controlRef}
            className={b()}
        >
            <Dialog.Header caption={i18n('action.save')} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const nextValidationError = validateQueryName(queryName);
                    setValidationError(nextValidationError);
                    if (!nextValidationError) {
                        onSaveClick();
                    }
                }}
            >
                <Dialog.Body className={b('dialog-body')}>
                    <div className={b('dialog-row')}>{i18n('description')}</div>
                    <div className={b('dialog-row')}>
                        <div className={b('control-wrapper')}>
                            <TextInput
                                id="queryName"
                                aria-label={i18n('input-label')}
                                placeholder={i18n('input-placeholder')}
                                value={queryName}
                                onUpdate={handleQueryNameChange}
                                controlRef={controlRef}
                                hasClear
                                autoComplete={false}
                                validationState={validationError ? 'invalid' : undefined}
                                errorMessage={validationError}
                            />
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply={i18n('button-apply')}
                    textButtonCancel={i18n('button-cancel')}
                    onClickButtonCancel={onCloseWithoutSave}
                    propsButtonApply={{
                        type: 'submit',
                        className: BRAND_BUTTON_CLASS,
                    }}
                />
            </form>
        </Dialog>
    );
}

export const SaveQueryDialogNiceModal = NiceModal.create((props: SaveQueryDialogProps) => {
    const modal = NiceModal.useModal();

    const handleClose = () => {
        modal.hide();
        modal.remove();
    };

    return (
        <SaveQueryDialog
            {...props}
            onClose={() => {
                props.onClose?.();
                handleClose();
            }}
            open={modal.visible}
        />
    );
});

NiceModal.register(SAVE_QUERY_DIALOG, SaveQueryDialogNiceModal);
