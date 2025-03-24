import React from 'react';

import {Button, Dialog, Flex, TextInput, Tooltip} from '@gravity-ui/uikit';
import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';

import {useTracingLevelOptionAvailable} from '../../../../store/reducers/capabilities/hooks';
import {
    selectQueryAction,
    setQueryAction,
} from '../../../../store/reducers/queryActions/queryActions';
import type {QuerySettings} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {USE_SHOW_PLAN_SVG_KEY} from '../../../../utils/constants';
import {
    useQueryExecutionSettings,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../utils/hooks';
import {QUERY_MODES, querySettingsValidationSchema} from '../../../../utils/query';

import {QuerySettingsSelect} from './QuerySettingsSelect';
import {QuerySettingsTimeout} from './QuerySettingsTimeout';
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
        setValue,
        watch,
        formState: {errors},
    } = useForm<QuerySettings>({
        defaultValues: initialValues,
        resolver: zodResolver(querySettingsValidationSchema),
    });

    const [useShowPlanToSvg] = useSetting<boolean>(USE_SHOW_PLAN_SVG_KEY);
    const enableTracingLevel = useTracingLevelOptionAvailable();

    const timeout = watch('timeout');
    const queryMode = watch('queryMode');

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
                                    onUpdateSetting={(mode) => {
                                        field.onChange(mode);

                                        if (mode !== 'query' && timeout === null) {
                                            setValue('timeout', '');
                                        } else if (mode === 'query') {
                                            setValue('timeout', null);
                                        }
                                    }}
                                    settingOptions={QUERY_SETTINGS_FIELD_SETTINGS.queryMode.options}
                                />
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
                    <Tooltip
                        className={b('statistics-mode-tooltip')}
                        disabled={!useShowPlanToSvg}
                        openDelay={0}
                        content={i18n('tooltip_plan-to-svg-statistics')}
                    >
                        <div className={b('control-wrapper', {statisticsMode: true})}>
                            <Controller
                                name="statisticsMode"
                                control={control}
                                render={({field}) => (
                                    <QuerySettingsSelect
                                        id="statisticsMode"
                                        disabled={useShowPlanToSvg}
                                        setting={field.value}
                                        onUpdateSetting={field.onChange}
                                        settingOptions={
                                            QUERY_SETTINGS_FIELD_SETTINGS.statisticsMode.options
                                        }
                                    />
                                )}
                            />
                        </div>
                    </Tooltip>
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
                                    endContent={
                                        <span className={b('postfix')}>
                                            {i18n('form.limit.rows')}
                                        </span>
                                    }
                                />
                            )}
                        />
                    </div>
                </Flex>
                <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                    <Controller
                        name="timeout"
                        control={control}
                        render={({field}) => (
                            <QuerySettingsTimeout
                                id="timeout"
                                value={typeof field.value === 'string' ? undefined : field.value}
                                onChange={field.onChange}
                                onToggle={(enabled) => field.onChange(enabled ? '' : null)}
                                validationState={errors.timeout ? 'invalid' : undefined}
                                errorMessage={errors.timeout?.message}
                                isDisabled={queryMode !== QUERY_MODES.query}
                            />
                        )}
                    />
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
                        <Button
                            href="https://ydb.tech/docs"
                            target="_blank"
                            view="outlined"
                            size="l"
                        >
                            {i18n('docs')}
                        </Button>
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
