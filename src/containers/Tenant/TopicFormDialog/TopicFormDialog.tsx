import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import type {SelectOption} from '@gravity-ui/uikit';
import {
    Alert,
    Dialog,
    Disclosure,
    Divider,
    Flex,
    HelpMark,
    Link,
    Popover,
    SegmentedRadioGroup,
    Select,
    Switch,
    Text,
    TextInput,
} from '@gravity-ui/uikit';
import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';
import {useClusterWithProxy} from '../../../store/reducers/cluster/cluster';
import {selectTopicFormValues, topicApi} from '../../../store/reducers/topic/topic';
import type {TopicFormValues} from '../../../store/reducers/topic/utils';
import {AutoPartitioningStrategy} from '../../../store/reducers/topic/utils';
import {cn} from '../../../utils/cn';
import createToast from '../../../utils/createToast';
import {prepareCommonErrorMessage} from '../../../utils/errors';
import {useTypedSelector} from '../../../utils/hooks';

import i18n from './i18n';
import {
    TOPIC_FORM_DIALOG,
    acceptNumber,
    buildFullTopicPath,
    formatBandwidthBytes,
    formatNumberInput,
    formatWriteQuotaSelectValue,
    getCreateTopicInitialValues,
    getUpdateTopicInitialValues,
    parseNumberInput,
} from './utils';
import {getTopicFormValidationSchema} from './validation';

import './TopicFormDialog.scss';

const b = cn('ydb-topic-form-dialog');

type TopicFormMode = 'create' | 'update';

interface CommonDialogProps {
    mode: TopicFormMode;
    database: string;
    databaseFullPath: string;
    parentPath?: string;
    topicPath?: string;
    onSuccess?: (path: string) => void;
}

interface TopicFormDialogNiceModalProps extends CommonDialogProps {
    onClose?: () => void;
}

interface TopicFormDialogProps extends CommonDialogProps {
    open: boolean;
    onClose: () => void;
}

interface TopicFormProps {
    mode: TopicFormMode;
    database: string;
    databaseFullPath: string;
    initialValues: TopicFormValues;
    onClose: () => void;
    onSuccess?: (path: string) => void;
    nameInputRef?: React.Ref<HTMLInputElement>;
}

const writeQuotaOptions: SelectOption[] = [128, 512, 1024].map((value) => ({
    content: formatBandwidthBytes(value * 1024),
    value: String(value * 1024),
}));

function isEditableAutoPartitioningMode(mode?: string) {
    return mode === AutoPartitioningStrategy.ScaleUp || mode === AutoPartitioningStrategy.Paused;
}

function MarkdownNote({text}: {text: string}) {
    const content = React.useMemo(() => {
        const parts: React.ReactNode[] = [];
        const linkRegexp = /\[([^\]]+)]\(([^)]+)\)/g;
        let lastIndex = 0;
        let match = linkRegexp.exec(text);

        while (match) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            parts.push(
                <Link key={`${match[1]}-${match.index}`} href={match[2].trim()} target="_blank">
                    {match[1]}
                </Link>,
            );
            lastIndex = linkRegexp.lastIndex;
            match = linkRegexp.exec(text);
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts;
    }, [text]);

    return (
        <Text as="div" color="secondary" className={b('label-note')}>
            {content}
        </Text>
    );
}

function FormSection({title, children}: {title?: string; children: React.ReactNode}) {
    return (
        <section className={b('section')}>
            {title ? (
                <Text as="div" variant="subheader-2" className={b('section-title')}>
                    {title}
                </Text>
            ) : null}
            {children}
        </section>
    );
}

function FormRow({
    title,
    note,
    htmlFor,
    children,
}: {
    title: string;
    note?: string;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={b('row')}>
            <div className={b('label')}>
                {htmlFor ? (
                    <label className={b('label-title')} htmlFor={htmlFor}>
                        {title}
                    </label>
                ) : (
                    <span className={b('label-title')}>{title}</span>
                )}
                {note ? (
                    <HelpMark
                        className={b('help-mark')}
                        popoverProps={{
                            placement: ['bottom', 'right'],
                            className: b('help-mark-popup'),
                        }}
                    >
                        <MarkdownNote text={note} />
                    </HelpMark>
                ) : null}
            </div>
            <div>{children}</div>
        </div>
    );
}

function FixedValue({value}: {value?: string | number}) {
    return (
        <Text as="div" className={b('fixed-value')}>
            {value}
        </Text>
    );
}

function IncompatiblePopover({content, children}: {content: string; children: React.ReactElement}) {
    return (
        <Popover content={content} placement="top" hasArrow className={b('incompatible-popover')}>
            {children}
        </Popover>
    );
}

function NumericTextInput({
    id,
    value,
    onChange,
    errorMessage,
    invalid,
    endContent,
    className,
    disabled,
}: {
    id?: string;
    value?: number;
    onChange: (value: number) => void;
    errorMessage?: string;
    invalid?: boolean;
    endContent?: React.ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    const handleUpdate = React.useCallback(
        (nextValue: string) => {
            if (acceptNumber(nextValue)) {
                onChange(parseNumberInput(nextValue));
            }
        },
        [onChange],
    );

    return (
        <TextInput
            id={id}
            value={formatNumberInput(value)}
            onUpdate={handleUpdate}
            validationState={errorMessage || invalid ? 'invalid' : undefined}
            errorMessage={errorMessage}
            endContent={endContent}
            className={className}
            disabled={disabled}
        />
    );
}

function SelectNumberField({
    value,
    onChange,
    options,
    errorMessage,
    formatSelectedValue,
}: {
    value?: number;
    onChange: (value: number | undefined) => void;
    options: SelectOption[];
    errorMessage?: string;
    formatSelectedValue?: (value: number) => string;
}) {
    const handleUpdate = React.useCallback(
        ([nextValue]: string[]) => {
            onChange(nextValue ? Number(nextValue) : undefined);
        },
        [onChange],
    );

    const renderSelectedOption = React.useCallback(
        (option: SelectOption) => (
            <React.Fragment>
                {option.content ??
                    (formatSelectedValue
                        ? formatSelectedValue(Number(option.value))
                        : option.value)}
            </React.Fragment>
        ),
        [formatSelectedValue],
    );

    return (
        <div className={b('control-stack')}>
            <Select
                className={b('select-s')}
                value={value === undefined ? [] : [String(value)]}
                options={options}
                onUpdate={handleUpdate}
                validationState={errorMessage ? 'invalid' : undefined}
                renderSelectedOption={renderSelectedOption}
            />
            {errorMessage ? (
                <Text color="danger" variant="body-1">
                    {errorMessage}
                </Text>
            ) : null}
        </div>
    );
}

function formatAutoPartitioningMode(mode: string) {
    switch (mode) {
        case AutoPartitioningStrategy.ScaleUp:
            return i18n('value_auto-partitioning-scale-up');
        case AutoPartitioningStrategy.Paused:
            return i18n('value_auto-partitioning-paused');
        default:
            return mode
                .replace(/^AUTO_PARTITIONING_STRATEGY_/, '')
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/^./, (char) => char.toUpperCase());
    }
}

function TopicForm({
    mode,
    database,
    databaseFullPath,
    initialValues,
    onClose,
    onSuccess,
    nameInputRef,
}: TopicFormProps) {
    const validationSchema = React.useMemo(
        () => getTopicFormValidationSchema(initialValues.shards),
        [initialValues.shards],
    );
    const [createTopic, createTopicResponse] = topicApi.useCreateTopicMutation();
    const [updateTopic, updateTopicResponse] = topicApi.useUpdateTopicMutation();

    const {
        control,
        handleSubmit,
        setValue,
        trigger,
        watch,
        formState: {dirtyFields, errors},
    } = useForm<TopicFormValues>({
        defaultValues: initialValues,
        resolver: zodResolver(validationSchema),
        mode: 'onChange',
    });

    const isSubmitting = createTopicResponse.isLoading || updateTopicResponse.isLoading;

    const autoPartitioningEnabled = watch('autoPartitioning.enabled');
    const autoPartitioningMode = watch('autoPartitioning.mode');
    const shards = watch('shards');
    const writeQuotaBytes = watch('writeQuotaBytes');
    const minPartitions = watch('autoPartitioning.minPartitions');
    const maxPartitions = watch('autoPartitioning.maxPartitions');
    const minPartitionsError = errors.autoPartitioning?.minPartitions?.message;
    const maxPartitionsError = errors.autoPartitioning?.maxPartitions?.message;
    const autoPartitioningRangeError = minPartitionsError ?? maxPartitionsError;

    React.useEffect(() => {
        if (!autoPartitioningEnabled) {
            return;
        }
        trigger(['autoPartitioning.minPartitions', 'autoPartitioning.maxPartitions']);
    }, [autoPartitioningEnabled, minPartitions, maxPartitions, trigger]);

    const autoPartitioningModeOptions = React.useMemo(() => {
        const options = [
            {
                content: i18n('value_auto-partitioning-scale-up'),
                value: AutoPartitioningStrategy.ScaleUp,
            },
            {
                content: i18n('value_auto-partitioning-paused'),
                value: AutoPartitioningStrategy.Paused,
            },
        ];

        if (!autoPartitioningMode || isEditableAutoPartitioningMode(autoPartitioningMode)) {
            return options;
        }

        return [
            {
                content: formatAutoPartitioningMode(autoPartitioningMode),
                value: autoPartitioningMode,
            },
            ...options,
        ];
    }, [autoPartitioningMode]);

    const throughputInfo = React.useMemo(() => {
        if (autoPartitioningEnabled) {
            return i18n('context_throughput-info-range', {
                from: minPartitions ? formatBandwidthBytes(minPartitions * writeQuotaBytes) : '_',
                to: maxPartitions ? formatBandwidthBytes(maxPartitions * writeQuotaBytes) : '_',
            });
        }

        return i18n('context_throughput-info', {
            speed: formatBandwidthBytes(Number(shards || 0) * writeQuotaBytes),
        });
    }, [autoPartitioningEnabled, maxPartitions, minPartitions, shards, writeQuotaBytes]);

    const handleTopicSubmit = handleSubmit(async (data) => {
        const preservePartitionCountLimit =
            mode === 'update' &&
            !data.autoPartitioning.enabled &&
            !dirtyFields.shards &&
            !dirtyFields.autoPartitioning?.enabled;

        const preparedData = {
            ...data,
            partitionCountLimit: initialValues.partitionCountLimit,
            ...(preservePartitionCountLimit ? {preservePartitionCountLimit} : {}),
        };

        try {
            if (mode === 'create') {
                await createTopic({database, formData: preparedData}).unwrap();
            } else {
                await updateTopic({database, formData: preparedData}).unwrap();
            }

            createToast({
                name: `topic-${mode}-success`,
                title:
                    mode === 'create' ? i18n('alert_create-success') : i18n('alert_update-success'),
                theme: 'success',
                autoHiding: 5000,
            });
            onSuccess?.(buildFullTopicPath(preparedData, databaseFullPath));
        } catch (error) {
            createToast({
                name: `topic-${mode}-error`,
                title: mode === 'create' ? i18n('alert_create-error') : i18n('alert_update-error'),
                content: prepareCommonErrorMessage(error),
                theme: 'danger',
                autoHiding: 5000,
            });
        }
    });

    const autoPartitioningCannotBeDisabled =
        mode === 'update' && initialValues.autoPartitioning.enabled;
    const autoPartitioningDisabledReason = autoPartitioningCannotBeDisabled
        ? i18n('context_auto-partitioning-mode-disabled')
        : undefined;

    return (
        <form onSubmit={handleTopicSubmit} className={b('form')}>
            <Dialog.Body className={b('body')}>
                <div className={b('scroll-container')}>
                    <div className={b('scroll-content')}>
                        <FormSection>
                            {mode === 'create' ? (
                                <FormRow
                                    title={i18n('field_name')}
                                    note={i18n('context_field-name')}
                                    htmlFor="topicName"
                                >
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({field}) => (
                                            <TextInput
                                                controlRef={nameInputRef}
                                                id="topicName"
                                                value={field.value ?? ''}
                                                onUpdate={field.onChange}
                                                validationState={
                                                    errors.name ? 'invalid' : undefined
                                                }
                                                errorMessage={errors.name?.message}
                                                className={b('control')}
                                                autoComplete={false}
                                                autoFocus
                                                disabled={isSubmitting}
                                            />
                                        )}
                                    />
                                </FormRow>
                            ) : (
                                <FormRow title={i18n('field_name')}>
                                    <FixedValue value={initialValues.name} />
                                </FormRow>
                            )}
                        </FormSection>
                        <FormSection title={i18n('title_topic-parameters')}>
                            <FormRow
                                title={i18n('field_shard-write-quota')}
                                note={i18n('context_shards-write-quota')}
                            >
                                <Controller
                                    name="writeQuotaBytes"
                                    control={control}
                                    render={({field}) => (
                                        <div className={b('control-stack')}>
                                            <SelectNumberField
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={writeQuotaOptions}
                                                errorMessage={errors.writeQuotaBytes?.message}
                                                formatSelectedValue={formatWriteQuotaSelectValue}
                                            />
                                            <Text color="secondary">{throughputInfo}</Text>
                                        </div>
                                    )}
                                />
                            </FormRow>
                            <Divider className={b('divider')} />
                            <FormRow
                                title={i18n('field_auto-partitioning')}
                                note={i18n('context_auto-partitioning')}
                            >
                                <div className={b('control-stack')}>
                                    <Flex gap={3} alignItems="center" className={b('switch-row')}>
                                        <Controller
                                            name="autoPartitioning.enabled"
                                            control={control}
                                            render={({field}) => {
                                                const switchControl = (
                                                    <Switch
                                                        checked={field.value}
                                                        disabled={
                                                            isSubmitting ||
                                                            autoPartitioningCannotBeDisabled
                                                        }
                                                        onUpdate={(enabled) => {
                                                            if (
                                                                enabled &&
                                                                !isEditableAutoPartitioningMode(
                                                                    autoPartitioningMode,
                                                                )
                                                            ) {
                                                                setValue(
                                                                    'autoPartitioning.mode',
                                                                    AutoPartitioningStrategy.ScaleUp,
                                                                    {
                                                                        shouldDirty: true,
                                                                        shouldTouch: true,
                                                                    },
                                                                );
                                                            }

                                                            field.onChange(enabled);
                                                        }}
                                                    />
                                                );

                                                if (!autoPartitioningDisabledReason) {
                                                    return switchControl;
                                                }

                                                return (
                                                    <IncompatiblePopover
                                                        content={autoPartitioningDisabledReason}
                                                    >
                                                        <span
                                                            className={b('popover-target')}
                                                            tabIndex={0}
                                                        >
                                                            {switchControl}
                                                        </span>
                                                    </IncompatiblePopover>
                                                );
                                            }}
                                        />
                                    </Flex>
                                </div>
                            </FormRow>
                            {autoPartitioningEnabled ? (
                                <div className={b('full-width-alert')}>
                                    <Alert
                                        theme="warning"
                                        message={i18n('confirm_auto-partitioning-message')}
                                    />
                                </div>
                            ) : null}
                            {autoPartitioningEnabled ? (
                                <React.Fragment>
                                    <FormRow
                                        title={i18n('field_shards')}
                                        note={i18n('context_shards')}
                                    >
                                        <div className={b('control-stack')}>
                                            <div className={b('dual-inputs')}>
                                                <Controller
                                                    name="autoPartitioning.minPartitions"
                                                    control={control}
                                                    render={({field}) => (
                                                        <NumericTextInput
                                                            value={field.value}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                                setValue('shards', value || 0);
                                                            }}
                                                            invalid={Boolean(minPartitionsError)}
                                                            className={b('input-s')}
                                                            disabled={isSubmitting}
                                                            endContent={
                                                                <span
                                                                    className={b('input-details')}
                                                                >
                                                                    {i18n('value_min')}
                                                                </span>
                                                            }
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    name="autoPartitioning.maxPartitions"
                                                    control={control}
                                                    render={({field}) => (
                                                        <NumericTextInput
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            invalid={Boolean(maxPartitionsError)}
                                                            className={b('input-s')}
                                                            disabled={isSubmitting}
                                                            endContent={
                                                                <span
                                                                    className={b('input-details')}
                                                                >
                                                                    {i18n('value_max')}
                                                                </span>
                                                            }
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {autoPartitioningRangeError ? (
                                                <Text color="danger" variant="body-1">
                                                    {autoPartitioningRangeError}
                                                </Text>
                                            ) : null}
                                        </div>
                                    </FormRow>
                                    <Disclosure
                                        className={b('disclosure')}
                                        arrowPosition="end"
                                        summary={
                                            <Text variant="subheader-1">
                                                {i18n('title_auto-partitioning-settings')}
                                            </Text>
                                        }
                                    >
                                        <Disclosure.Details>
                                            <div className={b('settings-content')}>
                                                <FormRow
                                                    title={i18n('field_auto-partitioning-mode')}
                                                    note={i18n('context_auto-partitioning-mode')}
                                                >
                                                    <Controller
                                                        name="autoPartitioning.mode"
                                                        control={control}
                                                        render={({field}) => (
                                                            <SegmentedRadioGroup
                                                                value={field.value}
                                                                onUpdate={field.onChange}
                                                                disabled={isSubmitting}
                                                            >
                                                                {autoPartitioningModeOptions.map(
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
                                                </FormRow>
                                                <FormRow
                                                    title={i18n(
                                                        'field_auto-partitioning-stabilization-window',
                                                    )}
                                                    note={i18n(
                                                        'context_auto-partitioning-stabilization-window',
                                                    )}
                                                >
                                                    <Controller
                                                        name="autoPartitioning.stabilizationWindow"
                                                        control={control}
                                                        render={({field}) => (
                                                            <NumericTextInput
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                errorMessage={
                                                                    errors.autoPartitioning
                                                                        ?.stabilizationWindow
                                                                        ?.message
                                                                }
                                                                className={b('input-s')}
                                                                disabled={isSubmitting}
                                                                endContent={
                                                                    <span
                                                                        className={b(
                                                                            'input-details',
                                                                        )}
                                                                    >
                                                                        {i18n('value_seconds')}
                                                                    </span>
                                                                }
                                                            />
                                                        )}
                                                    />
                                                </FormRow>
                                                <FormRow
                                                    title={i18n(
                                                        'field_auto-partitioning-up-utilization',
                                                    )}
                                                    note={i18n(
                                                        'context_auto-partitioning-up-utilization',
                                                    )}
                                                >
                                                    <Controller
                                                        name="autoPartitioning.upUtilization"
                                                        control={control}
                                                        render={({field}) => (
                                                            <NumericTextInput
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                errorMessage={
                                                                    errors.autoPartitioning
                                                                        ?.upUtilization?.message
                                                                }
                                                                className={b('input-s')}
                                                                disabled={isSubmitting}
                                                                endContent={
                                                                    <span
                                                                        className={b(
                                                                            'input-details',
                                                                        )}
                                                                    >
                                                                        %
                                                                    </span>
                                                                }
                                                            />
                                                        )}
                                                    />
                                                </FormRow>
                                            </div>
                                        </Disclosure.Details>
                                    </Disclosure>
                                </React.Fragment>
                            ) : (
                                <FormRow
                                    title={i18n('field_shards')}
                                    note={i18n('context_shards')}
                                    htmlFor="shards"
                                >
                                    <div className={b('control-stack')}>
                                        <Controller
                                            name="shards"
                                            control={control}
                                            render={({field}) => (
                                                <NumericTextInput
                                                    id="shards"
                                                    value={field.value}
                                                    onChange={(value) => {
                                                        field.onChange(value);
                                                        setValue(
                                                            'autoPartitioning.minPartitions',
                                                            value,
                                                        );

                                                        if (
                                                            value !== undefined &&
                                                            maxPartitions !== undefined &&
                                                            maxPartitions <= value
                                                        ) {
                                                            setValue(
                                                                'autoPartitioning.maxPartitions',
                                                                value + 1,
                                                            );
                                                        }
                                                        trigger('autoPartitioning.maxPartitions');
                                                    }}
                                                    errorMessage={errors.shards?.message}
                                                    className={b('input-s')}
                                                    disabled={isSubmitting}
                                                />
                                            )}
                                        />
                                        <Text color="secondary">{i18n('context_shards-info')}</Text>
                                    </div>
                                </FormRow>
                            )}
                        </FormSection>
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={mode === 'create' ? i18n('action_create') : i18n('action_update')}
                textButtonCancel={i18n('action_cancel')}
                onClickButtonCancel={onClose}
                loading={isSubmitting}
                propsButtonApply={{type: 'submit', view: 'action'}}
            />
        </form>
    );
}

function TopicFormDialog({
    open,
    mode,
    database,
    databaseFullPath,
    parentPath,
    topicPath,
    onClose,
    onSuccess,
}: TopicFormDialogProps) {
    const nameInputRef = React.useRef<HTMLInputElement>(null);
    const useMetaProxy = useClusterWithProxy();
    const topicQuery = topicApi.useGetTopicQuery(
        {path: topicPath ?? '', database, databaseFullPath, useMetaProxy},
        {skip: mode !== 'update' || !topicPath, refetchOnMountOrArgChange: true},
    );
    const topicFormValues = useTypedSelector((state) => {
        if (mode !== 'update' || !topicPath) {
            return undefined;
        }

        return selectTopicFormValues(state, topicPath, database, databaseFullPath, useMetaProxy);
    });

    const initialValues = React.useMemo(() => {
        if (mode === 'create') {
            return getCreateTopicInitialValues({databaseFullPath, parentPath});
        }

        if (!topicPath || !topicFormValues) {
            return undefined;
        }

        return getUpdateTopicInitialValues({
            databaseFullPath,
            formData: topicFormValues,
            topicPath,
        });
    }, [databaseFullPath, mode, parentPath, topicFormValues, topicPath]);

    const renderContent = () => {
        if (mode === 'update' && !topicPath) {
            return (
                <Dialog.Body className={b('body')}>
                    <Text color="danger">{i18n('error_topic-path-required')}</Text>
                </Dialog.Body>
            );
        }

        if (mode === 'update' && topicQuery.error) {
            return (
                <Dialog.Body className={b('body')}>
                    <ResponseError
                        error={topicQuery.error}
                        defaultMessage={i18n('error_load-topic')}
                    />
                </Dialog.Body>
            );
        }

        if (!initialValues) {
            return (
                <Dialog.Body className={b('body')}>
                    <div className={b('loader')}>
                        <Loader size="m" />
                    </div>
                </Dialog.Body>
            );
        }

        return (
            <TopicForm
                key={`${mode}-${topicPath ?? parentPath ?? database}`}
                mode={mode}
                database={database}
                databaseFullPath={databaseFullPath}
                initialValues={initialValues}
                onClose={onClose}
                onSuccess={onSuccess}
                nameInputRef={nameInputRef}
            />
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            size="m"
            initialFocus={mode === 'create' ? nameInputRef : undefined}
            className={b()}
            modalClassName={b('modal')}
            disableHeightTransition
        >
            <Dialog.Header
                caption={mode === 'create' ? i18n('title_topic-create') : i18n('title_topic-edit')}
            />
            {renderContent()}
        </Dialog>
    );
}

export const TopicFormDialogNiceModal = NiceModal.create((props: TopicFormDialogNiceModalProps) => {
    const modal = NiceModal.useModal();

    const handleClose = () => {
        modal.hide();
        modal.remove();
    };

    return (
        <TopicFormDialog
            {...props}
            open={modal.visible}
            onSuccess={(path) => {
                props.onSuccess?.(path);
                modal.resolve(path);
                handleClose();
            }}
            onClose={() => {
                props.onClose?.();
                modal.resolve(null);
                handleClose();
            }}
        />
    );
});

NiceModal.register(TOPIC_FORM_DIALOG, TopicFormDialogNiceModal);

export function openTopicFormDialog(
    props: Omit<TopicFormDialogNiceModalProps, 'id'>,
): Promise<string | null> {
    return NiceModal.show(TOPIC_FORM_DIALOG, {
        id: TOPIC_FORM_DIALOG,
        ...props,
    }) as Promise<string | null>;
}
