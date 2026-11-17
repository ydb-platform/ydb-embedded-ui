import React from 'react';

import {
    Button,
    Dialog,
    Disclosure,
    HelpMark,
    SegmentedRadioGroup,
    Switch,
    TextArea,
    TextInput,
} from '@gravity-ui/uikit';
import {zodResolver} from '@hookform/resolvers/zod';
import type {FieldErrors} from 'react-hook-form';
import {Controller, useForm} from 'react-hook-form';
import type {z} from 'zod';

import {
    useSnapshotReadWriteAvailable,
    useTracingLevelOptionAvailable,
} from '../../../../store/reducers/capabilities/hooks';
import {
    selectQueryAction,
    setQueryAction,
} from '../../../../store/reducers/queryActions/queryActions';
import type {QuerySettings} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../../../utils/constants';
import {
    useQueryExecutionSettings,
    useQueryStreamingSetting,
    useResourcePools,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../utils/hooks';
import {
    RESOURCE_POOL_NO_OVERRIDE_VALUE,
    TRACING_LEVELS,
    TRANSACTION_MODES,
    isStreamingSupportedForMode,
    querySettingsValidationSchema,
} from '../../../../utils/query';
import {reachMetricaGoal} from '../../../../utils/yaMetrica';
import {useCurrentSchema} from '../../TenantContext';

import {QuerySettingsSelect} from './QuerySettingsSelect';
import {QuerySettingsTimeout} from './QuerySettingsTimeout';
import {QUERY_SETTINGS_FIELD_SETTINGS} from './constants';
import {getQuerySettingsMetricaParams} from './getQuerySettingsMetricaParams';
import i18n from './i18n';

import './QuerySettingsDialog.scss';

const b = cn('ydb-query-settings-dialog');

export function QuerySettingsDialog() {
    const dispatch = useTypedDispatch();
    const queryAction = useTypedSelector(selectQueryAction);
    const [querySettings, setQuerySettings] = useQueryExecutionSettings();
    const onClose = React.useCallback(() => dispatch(setQueryAction('idle')), [dispatch]);
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
            contentOverflow="auto"
            onClose={onClose}
            className={b()}
            aria-label={i18n('action.settings')}
        >
            <Dialog.Header className={b('header')} caption={i18n('action.settings')} />
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

type QuerySettingsFormInput = z.input<typeof querySettingsValidationSchema>;

const advancedFields = [
    'queryMode',
    'tracingLevel',
    'outputChunkMaxSize',
    'pragmas',
    'timeout',
] as const;

function SettingRow({
    name,
    help,
    children,
}: {
    name: keyof QuerySettings;
    help?: string;
    children: React.ReactNode;
}) {
    const title = QUERY_SETTINGS_FIELD_SETTINGS[name].title;
    return (
        <div className={b('dialog-row')}>
            <div className={b('field-title')}>
                <label htmlFor={name}>{title}</label>
                {help && (
                    <HelpMark aria-label={i18n('context_field-help', {field: title})}>
                        {help}
                    </HelpMark>
                )}
            </div>
            <div className={b('control-wrapper', {[name]: true})}>{children}</div>
        </div>
    );
}

function QuerySettingsForm({initialValues, onSubmit, onClose}: QuerySettingsFormProps) {
    const [openedSettings] = React.useState(initialValues);
    const [advancedExpanded, setAdvancedExpanded] = React.useState(false);
    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: {errors},
    } = useForm<QuerySettingsFormInput, unknown, QuerySettings>({
        defaultValues: openedSettings,
        resolver: zodResolver(querySettingsValidationSchema),
    });
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const enableSnapshotReadWrite = useSnapshotReadWriteAvailable();
    const [isQueryStreamingEnabled] = useQueryStreamingSetting();
    const {database} = useCurrentSchema();
    const {resourcePools, isLoading: isResourcePoolsLoading} = useResourcePools(
        database,
        openedSettings.resourcePool,
    );
    const resourcePoolOptions = React.useMemo(
        () => [
            {
                value: RESOURCE_POOL_NO_OVERRIDE_VALUE,
                content: i18n('form.resource-pool.no-override'),
            },
            ...resourcePools.map((name) => ({value: name, content: name})),
        ],
        [resourcePools],
    );

    const timeout = watch('timeout');
    const resourcePool = watch('resourcePool');
    const queryMode = watch('queryMode');
    const transactionMode = watch('transactionMode');
    const statisticsMode = watch('statisticsMode');

    React.useEffect(() => {
        if (
            isResourcePoolsLoading ||
            !resourcePool ||
            resourcePool === RESOURCE_POOL_NO_OVERRIDE_VALUE
        ) {
            return;
        }
        if (!resourcePools.includes(resourcePool)) {
            setValue('resourcePool', RESOURCE_POOL_NO_OVERRIDE_VALUE);
        }
    }, [isResourcePoolsLoading, resourcePools, resourcePool, setValue]);

    React.useEffect(() => {
        if (!enableSnapshotReadWrite && transactionMode === TRANSACTION_MODES.snapshotrw) {
            setValue('transactionMode', TRANSACTION_MODES.implicit);
        }
    }, [enableSnapshotReadWrite, transactionMode, setValue]);

    const transactionModeOptions = React.useMemo(
        () =>
            QUERY_SETTINGS_FIELD_SETTINGS.transactionMode.options.filter((option) => {
                // Keep a previously saved mode available for this draft, including undoing an unsaved change.
                return (
                    option.value !== TRANSACTION_MODES.snapshotrw ||
                    (enableSnapshotReadWrite &&
                        openedSettings.transactionMode === TRANSACTION_MODES.snapshotrw)
                );
            }),
        [enableSnapshotReadWrite, openedSettings.transactionMode],
    );

    const submit = (data: QuerySettings) => {
        const params = getQuerySettingsMetricaParams(openedSettings, data);
        if (params) {
            reachMetricaGoal('applyQuerySettings', params);
        }
        onSubmit(data);
    };
    const showErrors = (formErrors: FieldErrors<QuerySettingsFormInput>) => {
        if (advancedFields.some((field) => formErrors[field])) {
            setAdvancedExpanded(true);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit, showErrors)}>
            <Dialog.Body className={b('dialog-body')}>
                <SettingRow name="statisticsMode">
                    <Controller
                        name="statisticsMode"
                        control={control}
                        render={({field}) => (
                            <SegmentedRadioGroup
                                {...field}
                                aria-label={QUERY_SETTINGS_FIELD_SETTINGS.statisticsMode.title}
                                onUpdate={field.onChange}
                            >
                                {QUERY_SETTINGS_FIELD_SETTINGS.statisticsMode.options.map(
                                    (option) => (
                                        <SegmentedRadioGroup.Option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.content}
                                        </SegmentedRadioGroup.Option>
                                    ),
                                )}
                            </SegmentedRadioGroup>
                        )}
                    />
                    <div className={b('description')}>
                        {
                            QUERY_SETTINGS_FIELD_SETTINGS.statisticsMode.options.find(
                                (option) => option.value === statisticsMode,
                            )?.text
                        }
                    </div>
                </SettingRow>
                <SettingRow name="limitRows" help={i18n('context_limit-rows')}>
                    <Controller
                        name="limitRows"
                        control={control}
                        render={({field}) => (
                            <TextInput
                                id="limitRows"
                                type="number"
                                {...field}
                                value={field.value?.toString() ?? ''}
                                className={b('limit-rows')}
                                placeholder="10000"
                                validationState={errors.limitRows ? 'invalid' : undefined}
                                errorMessage={errors.limitRows?.message}
                                errorPlacement="inside"
                                endContent={
                                    <span className={b('postfix')}>{i18n('form.limit.rows')}</span>
                                }
                            />
                        )}
                    />
                </SettingRow>
                <SettingRow name="transactionMode" help={i18n('context_transaction-mode')}>
                    <Controller
                        name="transactionMode"
                        control={control}
                        render={({field}) => (
                            <QuerySettingsSelect
                                id="transactionMode"
                                ariaLabel={QUERY_SETTINGS_FIELD_SETTINGS.transactionMode.title}
                                setting={field.value}
                                onUpdateSetting={field.onChange}
                                settingOptions={transactionModeOptions}
                            />
                        )}
                    />
                </SettingRow>
                <SettingRow name="resourcePool" help={i18n('context_resource-pool')}>
                    <Controller
                        name="resourcePool"
                        control={control}
                        render={({field}) => (
                            <QuerySettingsSelect
                                id="resourcePool"
                                ariaLabel={QUERY_SETTINGS_FIELD_SETTINGS.resourcePool.title}
                                setting={field.value ?? RESOURCE_POOL_NO_OVERRIDE_VALUE}
                                disabled={isResourcePoolsLoading || !resourcePools.length}
                                onUpdateSetting={field.onChange}
                                settingOptions={resourcePoolOptions}
                            />
                        )}
                    />
                </SettingRow>
                <Disclosure
                    className={b('advanced')}
                    summary={i18n('action_advanced-settings')}
                    expanded={advancedExpanded}
                    onUpdate={setAdvancedExpanded}
                    arrowPosition="end"
                    keepMounted
                >
                    <Disclosure.Summary>
                        {(_props, summary) =>
                            React.cloneElement(summary, {className: b('advanced-toggle')})
                        }
                    </Disclosure.Summary>
                    <div className={b('advanced-fields')} hidden={!advancedExpanded}>
                        <SettingRow name="queryMode" help={i18n('context_query-type')}>
                            <Controller
                                name="queryMode"
                                control={control}
                                render={({field}) => (
                                    <QuerySettingsSelect
                                        id="queryMode"
                                        ariaLabel={QUERY_SETTINGS_FIELD_SETTINGS.queryMode.title}
                                        setting={field.value}
                                        onUpdateSetting={(mode) => {
                                            field.onChange(mode);
                                            if (mode !== 'query' && timeout === null) {
                                                setValue('timeout', '');
                                            } else if (mode === 'query') {
                                                setValue('timeout', null);
                                            }
                                        }}
                                        settingOptions={
                                            QUERY_SETTINGS_FIELD_SETTINGS.queryMode.options
                                        }
                                    />
                                )}
                            />
                        </SettingRow>
                        {enableTracingLevel && (
                            <SettingRow name="tracingLevel" help={i18n('context_tracing')}>
                                <Controller
                                    name="tracingLevel"
                                    control={control}
                                    render={({field}) => (
                                        <div className={b('tracing')}>
                                            <Switch
                                                checked={field.value !== TRACING_LEVELS.off}
                                                controlProps={{'aria-label': i18n('field_tracing')}}
                                                onUpdate={(enabled) =>
                                                    field.onChange(
                                                        enabled
                                                            ? TRACING_LEVELS.toplevel
                                                            : TRACING_LEVELS.off,
                                                    )
                                                }
                                            />
                                            <QuerySettingsSelect
                                                id="tracingLevel"
                                                ariaLabel={i18n('form.tracing-level')}
                                                disabled={field.value === TRACING_LEVELS.off}
                                                setting={
                                                    field.value === TRACING_LEVELS.off
                                                        ? TRACING_LEVELS.toplevel
                                                        : field.value
                                                }
                                                onUpdateSetting={field.onChange}
                                                settingOptions={QUERY_SETTINGS_FIELD_SETTINGS.tracingLevel.options.filter(
                                                    (option) => option.value !== TRACING_LEVELS.off,
                                                )}
                                            />
                                        </div>
                                    )}
                                />
                            </SettingRow>
                        )}
                        {isQueryStreamingEnabled && (
                            <SettingRow
                                name="outputChunkMaxSize"
                                help={i18n('context_output-chunk-max-size')}
                            >
                                <Controller
                                    name="outputChunkMaxSize"
                                    control={control}
                                    render={({field}) => (
                                        <TextInput
                                            id="outputChunkMaxSize"
                                            type="number"
                                            {...field}
                                            value={field.value?.toString() ?? ''}
                                            className={b('output-chunk-max-size')}
                                            placeholder="1000000"
                                            validationState={
                                                errors.outputChunkMaxSize ? 'invalid' : undefined
                                            }
                                            errorMessage={errors.outputChunkMaxSize?.message}
                                            errorPlacement="inside"
                                            endContent={
                                                <span className={b('postfix')}>
                                                    {i18n('form.output.chunk.max.size.bytes')}
                                                </span>
                                            }
                                        />
                                    )}
                                />
                            </SettingRow>
                        )}
                        <SettingRow name="pragmas" help={i18n('context_query-prefix')}>
                            <Controller
                                name="pragmas"
                                control={control}
                                render={({field}) => (
                                    <TextArea
                                        id="pragmas"
                                        {...field}
                                        className={b('pragmas')}
                                        placeholder="PRAGMA OrderedColumns;"
                                        rows={3}
                                        hasClear
                                        validationState={errors.pragmas ? 'invalid' : undefined}
                                        errorMessage={errors.pragmas?.message}
                                        errorPlacement="inside"
                                    />
                                )}
                            />
                        </SettingRow>
                        <div className={b('dialog-row')}>
                            <Controller
                                name="timeout"
                                control={control}
                                render={({field}) => (
                                    <QuerySettingsTimeout
                                        id="timeout"
                                        value={field.value as string | number | null | undefined}
                                        onChange={field.onChange}
                                        onToggle={(enabled) => field.onChange(enabled ? '' : null)}
                                        validationState={errors.timeout ? 'invalid' : undefined}
                                        errorMessage={errors.timeout?.message}
                                        isDisabled={!isStreamingSupportedForMode(queryMode)}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </Disclosure>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('button-done')}
                textButtonCancel={i18n('button-cancel')}
                onClickButtonCancel={onClose}
                propsButtonApply={{type: 'submit', className: BRAND_BUTTON_CLASS}}
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
