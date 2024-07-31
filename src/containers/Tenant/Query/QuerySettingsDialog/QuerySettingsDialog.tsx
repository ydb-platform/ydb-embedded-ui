import React from 'react';

import {Dialog, Link as ExternalLink, Flex, TextInput} from '@gravity-ui/uikit';
import {Controller, useForm} from 'react-hook-form';

import {
    selectQueryAction,
    setQueryAction,
} from '../../../../store/reducers/queryActions/queryActions';
import type {QuerySettings} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {
    useQueryExecutionSettings,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../utils/hooks';

import {QuerySettingsSelect} from './QuerySettingsSelect';
import {QUERY_SETTINGS_FIELD_SETTINGS} from './constants';
import i18n from './i18n';

import './QuerySettingsDialog.scss';

const b = cn('ydb-query-settings-dialog');

export function QuerySettingsDialog() {
    const dispatch = useTypedDispatch();
    const queryAction = useTypedSelector(selectQueryAction);
    const [querySettings, setQuerySettings] = useQueryExecutionSettings();

    const onClose = React.useCallback(() => {
        dispatch(setQueryAction('idle'));
    }, [dispatch]);

    const onSubmit = React.useCallback(
        (data: QuerySettings) => {
            setQuerySettings(data);
            onClose();
        },
        [onClose, setQuerySettings],
    );

    return (
        <Dialog
            open={queryAction === 'settings'}
            size="s"
            onClose={onClose}
            className={b()}
            hasCloseButton={false}
        >
            <Dialog.Header caption={i18n('action.settings')} />
            <QuerySettingsForm
                initialValues={querySettings}
                onSubmit={onSubmit}
                onClose={onClose}
            />
        </Dialog>
    );
}

interface QuerySettingsFormProps {
    initialValues: QuerySettings;
    onSubmit: (data: QuerySettings) => void;
    onClose: () => void;
}

function QuerySettingsForm({initialValues, onSubmit, onClose}: QuerySettingsFormProps) {
    const {control, handleSubmit, reset} = useForm<QuerySettings>({
        defaultValues: initialValues,
    });

    React.useEffect(() => {
        reset(initialValues);
    }, [initialValues, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Dialog.Body className={b('dialog-body')}>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="queryMode" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.queryMode.title}
                    </label>
                    <div className={b('control-wrapper')}>
                        <Controller
                            name="queryMode"
                            control={control}
                            render={({field}) => (
                                <QuerySettingsSelect
                                    setting={field.value}
                                    onUpdateSetting={field.onChange}
                                    settingOptions={QUERY_SETTINGS_FIELD_SETTINGS.queryMode.options}
                                />
                            )}
                        />
                    </div>
                </Flex>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="timeout" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
                    </label>
                    <div className={b('control-wrapper')}>
                        <Controller
                            name="timeout"
                            control={control}
                            render={({field}) => (
                                <React.Fragment>
                                    <TextInput
                                        type="number"
                                        {...field}
                                        className={b('timeout')}
                                        placeholder="60"
                                    />
                                    <span className={b('timeout-suffix')}>
                                        {i18n('form.timeout.seconds')}
                                    </span>
                                </React.Fragment>
                            )}
                        />
                    </div>
                </Flex>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="tracingLevel" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.tracingLevel.title}
                    </label>
                    <div className={b('control-wrapper')}>
                        <Controller
                            name="tracingLevel"
                            control={control}
                            render={({field}) => (
                                <QuerySettingsSelect
                                    setting={field.value}
                                    onUpdateSetting={field.onChange}
                                    settingOptions={
                                        QUERY_SETTINGS_FIELD_SETTINGS.tracingLevel.options
                                    }
                                />
                            )}
                        />
                    </div>
                </Flex>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="isolationLevel" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.isolationLevel.title}
                    </label>
                    <div className={b('control-wrapper')}>
                        <Controller
                            name="isolationLevel"
                            control={control}
                            render={({field}) => (
                                <QuerySettingsSelect
                                    setting={field.value}
                                    onUpdateSetting={field.onChange}
                                    settingOptions={
                                        QUERY_SETTINGS_FIELD_SETTINGS.isolationLevel.options
                                    }
                                />
                            )}
                        />
                    </div>
                </Flex>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="statisticsMode" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.statisticsMode.title}
                    </label>
                    <div className={b('control-wrapper')}>
                        <Controller
                            name="statisticsMode"
                            control={control}
                            render={({field}) => (
                                <QuerySettingsSelect
                                    setting={field.value}
                                    onUpdateSetting={field.onChange}
                                    settingOptions={
                                        QUERY_SETTINGS_FIELD_SETTINGS.statisticsMode.options
                                    }
                                />
                            )}
                        />
                    </div>
                </Flex>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('button-done')}
                textButtonCancel={i18n('button-cancel')}
                onClickButtonCancel={onClose}
                propsButtonApply={{
                    type: 'submit',
                }}
                renderButtons={(buttonApply, buttonCancel) => (
                    <div className={b('buttons-container')}>
                        <ExternalLink
                            href="https://ydb.tech/docs/ru/concepts/transactions"
                            target="_blank"
                            className={b('documentation-link')}
                        >
                            {i18n('docs')}
                        </ExternalLink>
                        <div className={b('main-buttons')}>
                            {buttonCancel}
                            {buttonApply}
                        </div>
                    </div>
                )}
            />
        </form>
    );
}
