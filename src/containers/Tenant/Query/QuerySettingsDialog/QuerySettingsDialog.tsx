import React from 'react';

import {Checkbox, Dialog, Link as ExternalLink, Flex, TextInput} from '@gravity-ui/uikit';
import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';

import {useTracingLevelOptionAvailable} from '../../../../store/reducers/capabilities/hooks';
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
import {querySettingsValidationSchema} from '../../../../utils/query';

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
    const {
        control,
        handleSubmit,
        formState: {errors},
    } = useForm<QuerySettings>({
        defaultValues: initialValues,
        resolver: zodResolver(querySettingsValidationSchema),
    });

    const enableTracingLevel = useTracingLevelOptionAvailable();

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Dialog.Body className={b('dialog-body')}>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="queryMode" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.queryMode.title}
                    </label>
                    <div className={b('control-wrapper', {queryMode: true})}>
                        <Controller
                            name="queryMode"
                            control={control}
                            render={({field}) => (
                                <QuerySettingsSelect
                                    id="queryMode"
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
                                        id="timeout"
                                        type="number"
                                        {...field}
                                        value={field.value?.toString()}
                                        className={b('timeout')}
                                        placeholder="60"
                                        validationState={errors.timeout ? 'invalid' : undefined}
                                        errorMessage={errors.timeout?.message}
                                        errorPlacement="inside"
                                    />
                                    <span className={b('timeout-suffix')}>
                                        {i18n('form.timeout.seconds')}
                                    </span>
                                </React.Fragment>
                            )}
                        />
                    </div>
                </Flex>
                {enableTracingLevel && (
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
                                        id="tracingLevel"
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
                )}
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="transactionMode" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.transactionMode.title}
                    </label>
                    <div className={b('control-wrapper', {transactionMode: true})}>
                        <Controller
                            name="transactionMode"
                            control={control}
                            render={({field}) => (
                                <QuerySettingsSelect
                                    id="transactionMode"
                                    setting={field.value}
                                    onUpdateSetting={field.onChange}
                                    settingOptions={
                                        QUERY_SETTINGS_FIELD_SETTINGS.transactionMode.options
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
                    <div className={b('control-wrapper', {statisticsMode: true})}>
                        <Controller
                            name="statisticsMode"
                            control={control}
                            render={({field}) => (
                                <QuerySettingsSelect
                                    id="statisticsMode"
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
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="limitRows" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.limitRows.title}
                    </label>
                    <div className={b('control-wrapper')}>
                        <Controller
                            name="limitRows"
                            control={control}
                            render={({field}) => (
                                <TextInput
                                    id="limitRows"
                                    type="number"
                                    {...field}
                                    value={field.value?.toString()}
                                    className={b('limit-rows')}
                                    placeholder="10000"
                                    validationState={errors.limitRows ? 'invalid' : undefined}
                                    errorMessage={errors.limitRows?.message}
                                    errorPlacement="inside"
                                />
                            )}
                        />
                    </div>
                </Flex>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <label htmlFor="showPlanToSvg" className={b('field-title')}>
                        {QUERY_SETTINGS_FIELD_SETTINGS.showPlanToSvg.title}
                    </label>
                    <div className={b('control-wrapper')}>
                        <Controller
                            name="showPlanToSvg"
                            control={control}
                            render={({field: {value, onChange, ...field}}) => (
                                <Checkbox
                                    id="showPlanToSvg"
                                    checked={Boolean(value)}
                                    onUpdate={onChange}
                                    {...field}
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
                            href="https://ydb.tech/docs"
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
