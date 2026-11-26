import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {Dialog, Text} from '@gravity-ui/uikit';
import {zodResolver} from '@hookform/resolvers/zod';
import {FormProvider, useForm, useWatch} from 'react-hook-form';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';
import {useClusterWithProxy} from '../../../store/reducers/cluster/cluster';
import {documentTablesApi} from '../../../store/reducers/documentTables';
import {tableApi} from '../../../store/reducers/table/table';
import {
    getTablePathInfoForUpdate,
    getUpdateTableSettings,
    hasUpdateTableSettings,
} from '../../../store/reducers/table/utils';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema/schema';
import type {DocumentTableContext} from '../../../uiFactory/types';
import {cn} from '../../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../../utils/constants';
import createToast from '../../../utils/createToast';
import {prepareCommonErrorMessage} from '../../../utils/errors';
import {transformPath} from '../ObjectSummary/transformPath';
import {isDocumentTable} from '../utils';

import {
    TABLE_FORM_DIALOG,
    YDB_COLUMN_PK_TYPES,
    YDB_COLUMN_TABLE_TYPES,
    YDB_PK_TYPES,
    YDB_TABLE_TYPES,
} from './constants';
import i18n from './i18n';
import {DocumentColumnsSection} from './sections/DocumentColumnsSection';
import {DocumentIndexesSection} from './sections/DocumentIndexesSection';
import {GeneralSection} from './sections/GeneralSection';
import {PartitioningSection} from './sections/PartitioningSection';
import {SettingsSection} from './sections/SettingsSection';
import {TTLSection} from './sections/TTLSection';
import {YdbColumnsSection} from './sections/YdbColumnsSection';
import {YdbIndexesSection} from './sections/YdbIndexesSection';
import type {DialogFormValues, FormMode, OriginalTableInfo, TableType} from './types';
import {
    describeOriginalTable,
    getCreateInitialValues,
    getTableQueryArgs,
    getUpdateInitialValues,
} from './utils';
import {buildTableValidationSchema} from './validation';

import './TableFormDialog.scss';

const b = cn('ydb-table-form-dialog');
const defaultTableTypes: readonly TableType[] = ['row', 'column'];

const ydbColumnOptions = {
    row: {types: YDB_TABLE_TYPES, pkTypes: YDB_PK_TYPES, keyNullable: true},
    column: {types: YDB_COLUMN_TABLE_TYPES, pkTypes: YDB_COLUMN_PK_TYPES, keyNullable: false},
};

type DialogSuccessHandler = (path: string, type: TableType) => void;

interface CommonDialogProps {
    mode: FormMode;
    database: string;
    databaseFullPath: string;
    parentPath?: string;
    path?: string;
    availableTypes?: readonly TableType[];
    getDocumentTableContext?: (path: string) => DocumentTableContext | undefined;
    isCurrentDatabase?: () => boolean;
    onSuccess?: DialogSuccessHandler;
}

interface TableFormDialogNiceModalProps extends CommonDialogProps {
    onClose?: () => void;
    onRefresh?: (path: string, type: TableType, dialogOpen: boolean) => void;
}

interface TableFormDialogInnerProps extends Omit<CommonDialogProps, 'onSuccess'> {
    open: boolean;
    onClose: () => void;
    onSuccess: DialogSuccessHandler;
}

interface TableFormProps extends Omit<CommonDialogProps, 'onSuccess'> {
    availableTypes: readonly TableType[];
    initialValues: DialogFormValues;
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
    hasAddedOrDeletedColumns,
    updateSettings,
}: {
    mode: FormMode;
    type: TableType;
    originalName?: string;
    originalTable?: TEvDescribeSchemeResult;
    name: string;
    hasAddedOrDeletedColumns: boolean;
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
        hasAddedOrDeletedColumns ||
        hasUpdateTableSettings(updateSettings) ||
        (updateSettings?.ttl?.status === 'disabled' && originalHadTtl)
    );
}

function TableForm({
    mode,
    database,
    databaseFullPath,
    parentPath,
    path,
    initialValues,
    availableTypes,
    getDocumentTableContext,
    isCurrentDatabase = () => true,
    originalInfo,
    originalTable,
    onClose,
    onSuccess,
    nameInputRef,
}: TableFormProps) {
    const [createTable, createState] = tableApi.useCreateTableMutation();
    const [createDocumentTable, documentCreateState] =
        documentTablesApi.useCreateDocumentTableMutation();
    const [updateTable, updateState] = tableApi.useUpdateTableMutation();

    const directoryPath = (parentPath ?? databaseFullPath).replace(/\/+$/, '');
    const relativeDirectory =
        directoryPath === databaseFullPath ? '' : transformPath(directoryPath, databaseFullPath);
    const validationSchema = React.useMemo(
        () => buildTableValidationSchema({mode, originalInfo, relativeDirectory}),
        [mode, originalInfo, relativeDirectory],
    );

    const methods = useForm<DialogFormValues>({
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

        const previousType = previousTypeRef.current;
        previousTypeRef.current = type;

        const nextValues = getCreateInitialValues(type);
        if (nextValues.type === 'document' || previousType === 'document') {
            return;
        }
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

    const isSubmitting =
        createState.isLoading || updateState.isLoading || documentCreateState.isLoading;
    const renameConflictMessage = i18n('error_rename-with-other-changes');
    const dirtySettings = 'settings' in dirtyFields ? dirtyFields.settings : undefined;
    const updateSettings = getUpdateTableSettings(settings, dirtySettings);
    const hasNameConflict = hasRenameConflict({
        mode,
        type,
        originalName: originalInfo?.name,
        originalTable,
        name,
        hasAddedOrDeletedColumns: Boolean(columns?.length || deletedColumns?.length),
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
        if (isSubmitting || !availableTypes.length) {
            return;
        }
        if (!isCurrentDatabase()) {
            onClose();
            return;
        }
        if (hasNameConflict) {
            setError('name', {type: 'manual', message: renameConflictMessage});
            return;
        }

        try {
            if (mode === 'create') {
                const fullName = `${directoryPath}/${formValues.name}`;
                if (formValues.type === 'document') {
                    const context = getDocumentTableContext?.(fullName);
                    if (!context?.connectionId) {
                        throw new Error(i18n('alert_table-type-unavailable'));
                    }
                    await createDocumentTable({
                        context,
                        definition: formValues.document,
                    }).unwrap();
                } else {
                    await createTable({
                        database,
                        formValues: {...formValues, name: fullName},
                    }).unwrap();
                }
                createToast({
                    name: 'table-create-success',
                    title:
                        formValues.type === 'document'
                            ? i18n('alert_document-create-started')
                            : i18n('alert_create-success'),
                    theme: 'success',
                    autoHiding: 5000,
                });
                onSuccess(fullName, formValues.type);
                return;
            }

            if (!originalTable || !path || formValues.type === 'document') {
                throw new Error('Original table is required for update');
            }
            const nextUpdateSettings = getUpdateTableSettings(formValues.settings, dirtySettings);

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
            onSuccess(updatedTablePath, formValues.type);
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

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleFormSubmit} className={b('form')}>
                <Dialog.Body className={b('body')}>
                    <div className={b('scroll-container')}>
                        <div className={b('scroll-content')}>
                            <GeneralSection
                                mode={mode}
                                nameInputRef={nameInputRef}
                                availableTypes={availableTypes}
                            />
                            {type === 'document' ? (
                                <React.Fragment>
                                    <DocumentColumnsSection />
                                    <DocumentIndexesSection />
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <YdbColumnsSection
                                        mode={mode}
                                        tableType={type}
                                        {...ydbColumnOptions[type]}
                                        originalInfo={originalInfo}
                                    />
                                    {showIndexes ? <YdbIndexesSection /> : null}
                                    <TTLSection originalInfo={originalInfo} />
                                    {showSettings ? <SettingsSection mode={mode} /> : null}
                                    {showPartitioning ? (
                                        <PartitioningSection pkTypes={YDB_COLUMN_PK_TYPES} />
                                    ) : null}
                                </React.Fragment>
                            )}
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
                        className: BRAND_BUTTON_CLASS,
                        disabled: isSubmitting || !availableTypes.length,
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
    availableTypes = defaultTableTypes,
    getDocumentTableContext,
    isCurrentDatabase,
    onClose,
    onSuccess,
}: TableFormDialogInnerProps) {
    const nameInputRef = React.useRef<HTMLInputElement>(null);
    const useMetaProxy = useClusterWithProxy();
    const tableQuery = tableApi.useGetTableQuery(
        getTableQueryArgs({mode, path, database, databaseFullPath, useMetaProxy}),
        {refetchOnMountOrArgChange: true},
    );

    const originalTable = mode === 'update' ? tableQuery.currentData : undefined;
    const originalInfo = React.useMemo(() => describeOriginalTable(originalTable), [originalTable]);

    const initialValues = React.useMemo<DialogFormValues | undefined>(() => {
        if (mode === 'create') {
            return getCreateInitialValues(availableTypes[0]);
        }
        if (!originalTable) {
            return undefined;
        }
        return getUpdateInitialValues(originalTable);
    }, [mode, availableTypes, originalTable]);

    const renderContent = () => {
        if (mode === 'update' && (!path || isDocumentTable(originalTable?.PathDescription))) {
            return (
                <Dialog.Body className={b('body')}>
                    <Text color="danger">
                        {path ? i18n('error_edit-document-table') : i18n('error_load-table')}
                    </Text>
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
                availableTypes={availableTypes}
                getDocumentTableContext={getDocumentTableContext}
                isCurrentDatabase={isCurrentDatabase}
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
    const closed = React.useRef(false);

    const handleClose = () => {
        closed.current = true;
        modal.hide();
        modal.remove();
    };

    return (
        <TableFormDialog
            {...props}
            open={modal.visible}
            onSuccess={(path, type) => {
                const currentDatabase = props.isCurrentDatabase?.() ?? true;
                if (currentDatabase) {
                    props.onRefresh?.(path, type, !closed.current);
                }
                if (closed.current) {
                    return;
                }
                if (currentDatabase) {
                    props.onSuccess?.(path, type);
                }
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
