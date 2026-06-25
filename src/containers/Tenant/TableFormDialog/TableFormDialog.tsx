import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {Dialog, Text} from '@gravity-ui/uikit';
import {zodResolver} from '@hookform/resolvers/zod';
import {FormProvider, useForm, useWatch} from 'react-hook-form';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';
import {useClusterWithProxy} from '../../../store/reducers/cluster/cluster';
import {tableApi} from '../../../store/reducers/table/table';
import {
    getTablePathInfoForUpdate,
    getUpdateTableSettings,
    hasUpdateTableSettings,
} from '../../../store/reducers/table/utils';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema/schema';
import {cn} from '../../../utils/cn';
import createToast from '../../../utils/createToast';
import {prepareCommonErrorMessage} from '../../../utils/errors';

import {
    TABLE_FORM_DIALOG,
    YDB_COLUMN_PK_TYPES,
    YDB_COLUMN_TABLE_TYPES,
    YDB_PK_TYPES,
    YDB_TABLE_TYPES,
} from './constants';
import i18n from './i18n';
import {GeneralSection} from './sections/GeneralSection';
import {PartitioningSection} from './sections/PartitioningSection';
import {SettingsSection} from './sections/SettingsSection';
import {TTLSection} from './sections/TTLSection';
import {YdbColumnsSection} from './sections/YdbColumnsSection';
import {YdbIndexesSection} from './sections/YdbIndexesSection';
import type {FormMode, FormValues, OriginalTableInfo, TableType} from './types';
import {
    describeOriginalTable,
    getCreateInitialValues,
    getTableQueryArgs,
    getUpdateInitialValues,
} from './utils';
import {buildTableValidationSchema} from './validation';

import './TableFormDialog.scss';

const b = cn('ydb-table-form-dialog');

type DialogSuccessHandler = (path: string) => void;

interface CommonDialogProps {
    mode: FormMode;
    database: string;
    databaseFullPath: string;
    parentPath?: string;
    path?: string;
    onSuccess?: DialogSuccessHandler;
}

interface TableFormDialogNiceModalProps extends CommonDialogProps {
    onClose?: () => void;
}

interface TableFormDialogInnerProps extends Omit<CommonDialogProps, 'onSuccess'> {
    open: boolean;
    onClose: () => void;
    onSuccess: DialogSuccessHandler;
}

interface TableFormProps {
    mode: FormMode;
    database: string;
    databaseFullPath: string;
    parentPath?: string;
    path?: string;
    initialValues: FormValues;
    originalInfo?: OriginalTableInfo;
    originalTable?: TEvDescribeSchemeResult;
    onClose: () => void;
    onSuccess: DialogSuccessHandler;
    nameInputRef?: React.Ref<HTMLInputElement>;
}

function hasRenameConflict({
    mode,
    type,
    originalName,
    originalTable,
    name,
    addedColumnsCount,
    deletedColumnsCount,
    updateSettings,
}: {
    mode: FormMode;
    type: TableType;
    originalName?: string;
    originalTable?: TEvDescribeSchemeResult;
    name: string;
    addedColumnsCount: number;
    deletedColumnsCount: number;
    updateSettings: ReturnType<typeof getUpdateTableSettings>;
}) {
    if (
        mode !== 'update' ||
        type !== 'row' ||
        !originalTable ||
        !originalName ||
        name === originalName
    ) {
        return false;
    }

    const originalHadTtl = Boolean(
        originalTable.PathDescription?.Table?.TTLSettings?.Enabled ??
            originalTable.PathDescription?.ColumnTableDescription?.TtlSettings?.Enabled,
    );

    return (
        deletedColumnsCount > 0 ||
        addedColumnsCount > 0 ||
        hasUpdateTableSettings(updateSettings) ||
        (updateSettings?.ttl?.status === 'disabled' && originalHadTtl)
    );
}

function buildTablePath(parentPath: string, name: string) {
    const trimmedParentPath = parentPath.replace(/\/+$/, '');
    const trimmedName = name.replace(/^\/+|\/+$/g, '');
    return `${trimmedParentPath}/${trimmedName}`;
}

function TableForm({
    mode,
    database,
    databaseFullPath,
    parentPath,
    path,
    initialValues,
    originalInfo,
    originalTable,
    onClose,
    onSuccess,
    nameInputRef,
}: TableFormProps) {
    const [createTable, createState] = tableApi.useCreateTableMutation();
    const [updateTable, updateState] = tableApi.useUpdateTableMutation();

    const validationSchema = React.useMemo(
        () => buildTableValidationSchema({mode, originalInfo}),
        [mode, originalInfo],
    );

    const methods = useForm<FormValues>({
        defaultValues: initialValues,
        resolver: zodResolver(validationSchema),
        mode: 'onChange',
    });

    const {
        control,
        handleSubmit,
        clearErrors,
        setValue,
        setError,
        trigger,
        formState: {dirtyFields, errors},
    } = methods;
    const name = useWatch({control, name: 'name'});
    const type: TableType = useWatch({control, name: 'type'});
    const columns = useWatch({control, name: 'columns'});
    const deletedColumns = useWatch({control, name: 'deletedColumns'});
    const settings = useWatch({control, name: 'settings'});

    const previousTypeRef = React.useRef<TableType>(initialValues.type);
    React.useEffect(() => {
        if (mode === 'update') {
            return;
        }
        if (type === previousTypeRef.current) {
            return;
        }

        previousTypeRef.current = type;

        const nextValues = getCreateInitialValues(type);
        setValue('columns', nextValues.columns, {shouldValidate: false});
        setValue('secondaryIndexes', nextValues.secondaryIndexes, {shouldValidate: false});
        setValue('partitionKey', nextValues.partitionKey, {shouldValidate: false});
        setValue('partitionCount', nextValues.partitionCount, {shouldValidate: false});
        setValue('settings', nextValues.settings, {shouldValidate: false});
        trigger([
            'columns',
            'secondaryIndexes',
            'partitionKey',
            'partitionCount',
            'settings',
        ]).catch(() => undefined);
    }, [mode, type, setValue, trigger]);

    const isSubmitting = createState.isLoading || updateState.isLoading;
    const renameConflictMessage = i18n('error_rename-with-other-changes');
    const updateSettings = getUpdateTableSettings(settings, dirtyFields.settings);
    const hasNameConflict = hasRenameConflict({
        mode,
        type,
        originalName: originalInfo?.name,
        originalTable,
        name,
        addedColumnsCount: columns.length,
        deletedColumnsCount: deletedColumns.length,
        updateSettings,
    });

    React.useEffect(() => {
        if (hasNameConflict) {
            setError('name', {type: 'manual', message: renameConflictMessage});
            return;
        }

        if (errors.name?.message === renameConflictMessage) {
            clearErrors('name');
        }
    }, [clearErrors, errors.name?.message, hasNameConflict, renameConflictMessage, setError]);

    const handleFormSubmit = handleSubmit(async (formValues) => {
        if (hasNameConflict) {
            setError('name', {type: 'manual', message: renameConflictMessage});
            return;
        }

        try {
            if (mode === 'create') {
                const fullName = buildTablePath(parentPath ?? databaseFullPath, formValues.name);
                await createTable({
                    database,
                    formValues: {...formValues, name: fullName},
                }).unwrap();
                createToast({
                    name: 'table-create-success',
                    title: i18n('alert_create-success'),
                    theme: 'success',
                    autoHiding: 5000,
                });
                onSuccess(fullName);
                return;
            }

            if (!originalTable || !path) {
                throw new Error('Original table is required for update');
            }
            const nextUpdateSettings = getUpdateTableSettings(
                formValues.settings,
                dirtyFields.settings,
            );

            await updateTable({
                database,
                formValues,
                originalTable,
                updateSettings: nextUpdateSettings,
            }).unwrap();
            createToast({
                name: 'table-update-success',
                title: i18n('alert_update-success'),
                theme: 'success',
                autoHiding: 5000,
            });

            const {updatedTablePath} = getTablePathInfoForUpdate(originalTable, formValues.name);
            onSuccess(updatedTablePath);
        } catch (error) {
            createToast({
                name: `table-${mode}-error`,
                title: mode === 'create' ? i18n('alert_create-error') : i18n('alert_update-error'),
                content: prepareCommonErrorMessage(error),
                theme: 'danger',
                autoHiding: 5000,
            });
        }
    });

    const showIndexes = type === 'row' && mode === 'create';
    const showSettings = type === 'row';
    const showPartitioning = type === 'column' && mode === 'create';

    const columnTypes = type === 'column' ? YDB_COLUMN_TABLE_TYPES : YDB_TABLE_TYPES;
    const pkTypes = type === 'column' ? YDB_COLUMN_PK_TYPES : YDB_PK_TYPES;
    const keyNullable = type !== 'column';

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleFormSubmit} className={b('form')}>
                <Dialog.Body className={b('body')}>
                    <div className={b('scroll-container')}>
                        <div className={b('scroll-content')}>
                            <GeneralSection mode={mode} nameInputRef={nameInputRef} />
                            <YdbColumnsSection
                                mode={mode}
                                types={columnTypes}
                                pkTypes={pkTypes}
                                keyNullable={keyNullable}
                                originalInfo={originalInfo}
                            />
                            {showIndexes ? <YdbIndexesSection /> : null}
                            <TTLSection originalInfo={originalInfo} />
                            {showSettings ? <SettingsSection mode={mode} /> : null}
                            {showPartitioning ? <PartitioningSection pkTypes={pkTypes} /> : null}
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply={
                        mode === 'create' ? i18n('action_create') : i18n('action_update')
                    }
                    textButtonCancel={i18n('action_cancel')}
                    onClickButtonCancel={onClose}
                    loading={isSubmitting}
                    propsButtonApply={{
                        type: 'submit',
                        view: 'action',
                        disabled: isSubmitting,
                    }}
                />
            </form>
        </FormProvider>
    );
}

function TableFormDialog({
    open,
    mode,
    database,
    databaseFullPath,
    parentPath,
    path,
    onClose,
    onSuccess,
}: TableFormDialogInnerProps) {
    const nameInputRef = React.useRef<HTMLInputElement>(null);
    const useMetaProxy = useClusterWithProxy();
    const tableQuery = tableApi.useGetTableQuery(
        getTableQueryArgs({mode, path, database, databaseFullPath, useMetaProxy}),
        {refetchOnMountOrArgChange: true},
    );

    const originalTable = mode === 'update' ? tableQuery.data : undefined;
    const originalInfo = React.useMemo(() => describeOriginalTable(originalTable), [originalTable]);

    const initialValues = React.useMemo<FormValues | undefined>(() => {
        if (mode === 'create') {
            return getCreateInitialValues('row');
        }
        if (!originalTable) {
            return undefined;
        }
        return getUpdateInitialValues(originalTable);
    }, [mode, originalTable]);

    const renderContent = () => {
        if (mode === 'update' && !path) {
            return (
                <Dialog.Body className={b('body')}>
                    <Text color="danger">{i18n('error_load-table')}</Text>
                </Dialog.Body>
            );
        }
        if (mode === 'update' && tableQuery.error) {
            return (
                <Dialog.Body className={b('body')}>
                    <ResponseError
                        error={tableQuery.error}
                        defaultMessage={i18n('error_load-table')}
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
            <TableForm
                key={`${mode}-${path ?? database}`}
                mode={mode}
                database={database}
                databaseFullPath={databaseFullPath}
                parentPath={parentPath}
                path={path}
                initialValues={initialValues}
                originalInfo={originalInfo}
                originalTable={originalTable}
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
            size="l"
            initialFocus={mode === 'create' ? nameInputRef : undefined}
            className={b()}
            modalClassName={b('modal')}
            disableHeightTransition
        >
            <Dialog.Header
                caption={mode === 'create' ? i18n('title_create') : i18n('title_update')}
            />
            {renderContent()}
        </Dialog>
    );
}

export const TableFormDialogNiceModal = NiceModal.create((props: TableFormDialogNiceModalProps) => {
    const modal = NiceModal.useModal();

    const handleClose = () => {
        modal.hide();
        modal.remove();
    };

    return (
        <TableFormDialog
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

NiceModal.register(TABLE_FORM_DIALOG, TableFormDialogNiceModal);

export function openTableFormDialog(
    props: Omit<TableFormDialogNiceModalProps, 'id'>,
): Promise<string | null> {
    return NiceModal.show(TABLE_FORM_DIALOG, {
        id: TABLE_FORM_DIALOG,
        ...props,
    }) as Promise<string | null>;
}
