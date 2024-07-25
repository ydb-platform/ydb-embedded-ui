import React from 'react';

import {Dialog, Link as ExternalLink, Flex, TextInput} from '@gravity-ui/uikit';
import {Controller, useForm} from 'react-hook-form';

import {
    selectQueryAction,
    setQueryAction,
} from '../../../../store/reducers/queryActions/queryActions';
import type {
    IsolationLevel,
    QueryMode,
    StatisticsMode,
    TracingLevel,
} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {
    ISOLATION_LEVELS,
    QUERY_MODES,
    STATISTICS_MODES,
    TRACING_LEVELS,
} from '../../../../utils/query';

import {QuerySettingsSelect} from './QuerySettingsSelect';
import {
    ISOLATION_LEVEL_SELECT_OPTIONS,
    QUERY_MODE_SELECT_OPTIONS,
    STATISTICS_MODE_SELECT_OPTIONS,
    TRACING_LEVEL_SELECT_OPTIONS,
} from './constants';
import i18n from './i18n';

import './QuerySettingsDialog.scss';

const b = cn('ydb-query-settings-dialog');

type FormValues = {
    queryMode: QueryMode;
    timeout: string;
    isolationLevel: IsolationLevel;
    statisticsMode: StatisticsMode;
    tracingLevel: TracingLevel;
};

export function QuerySettingsDialog() {
    const dispatch = useTypedDispatch();
    const queryAction = useTypedSelector(selectQueryAction);
    const {control, handleSubmit, reset} = useForm<FormValues>({
        defaultValues: {
            queryMode: QUERY_MODES.script,
            timeout: '60',
            isolationLevel: ISOLATION_LEVELS.serializable,
            statisticsMode: STATISTICS_MODES.none,
            tracingLevel: TRACING_LEVELS.detailed,
        },
    });

    const onCloseDialog = () => {
        dispatch(setQueryAction('idle'));
        reset();
    };

    const onSaveClick = (data: FormValues) => {
        console.log('Form Data:', data);
        // dispatch(saveQuerySettings(data));
        onCloseDialog();
    };

    return (
        <Dialog
            open={queryAction === 'settings'}
            size="s"
            onClose={onCloseDialog}
            className={b()}
            hasCloseButton={false}
        >
            <Dialog.Header caption={i18n('action.settings')} />
            <form onSubmit={handleSubmit(onSaveClick)}>
                <Dialog.Body className={b('dialog-body')}>
                    <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                        <label htmlFor="queryMode" className={b('field-title')}>
                            {i18n('form.query-mode')}
                        </label>
                        <div className={b('control-wrapper')}>
                            <Controller
                                name="queryMode"
                                control={control}
                                render={({field}) => (
                                    <QuerySettingsSelect
                                        setting={field.value}
                                        onUpdateSetting={field.onChange}
                                        settingOptions={QUERY_MODE_SELECT_OPTIONS}
                                    />
                                )}
                            />
                        </div>
                    </Flex>
                    <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                        <label htmlFor="timeout" className={b('field-title')}>
                            {i18n('form.timeout')}
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
                            {i18n('form.tracing-level')}
                        </label>
                        <div className={b('control-wrapper')}>
                            <Controller
                                name="tracingLevel"
                                control={control}
                                render={({field}) => (
                                    <QuerySettingsSelect
                                        setting={field.value}
                                        onUpdateSetting={field.onChange}
                                        settingOptions={TRACING_LEVEL_SELECT_OPTIONS}
                                    />
                                )}
                            />
                        </div>
                    </Flex>
                    <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                        <label htmlFor="isolationLevel" className={b('field-title')}>
                            {i18n('form.isolation-level')}
                        </label>
                        <div className={b('control-wrapper')}>
                            <Controller
                                name="isolationLevel"
                                control={control}
                                render={({field}) => (
                                    <QuerySettingsSelect
                                        setting={field.value}
                                        onUpdateSetting={field.onChange}
                                        settingOptions={ISOLATION_LEVEL_SELECT_OPTIONS}
                                    />
                                )}
                            />
                        </div>
                    </Flex>
                    <Flex direction="row" alignItems="flex-start" className={b('dialog-row')}>
                        <label htmlFor="statisticsMode" className={b('field-title')}>
                            {i18n('form.statistics-mode')}
                        </label>
                        <div className={b('control-wrapper')}>
                            <Controller
                                name="statisticsMode"
                                control={control}
                                render={({field}) => (
                                    <QuerySettingsSelect
                                        setting={field.value}
                                        onUpdateSetting={field.onChange}
                                        settingOptions={STATISTICS_MODE_SELECT_OPTIONS}
                                    />
                                )}
                            />
                        </div>
                    </Flex>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply={i18n('button-done')}
                    textButtonCancel={i18n('button-cancel')}
                    onClickButtonCancel={onCloseDialog}
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
        </Dialog>
    );
}
