import {
    BarsUnaligned,
    CirclePlus,
    Code,
    Copy,
    Folder,
    GearPlay,
    LayoutHeaderCellsLarge,
    Pencil,
    PlugConnection,
} from '@gravity-ui/icons';
import {Flex, Icon, Spin} from '@gravity-ui/uikit';
import copy from 'copy-to-clipboard';
import {v4 as uuidv4} from 'uuid';
import type {NavigationTreeNodeType} from 'ydb-ui-components';

import type {SnippetParams} from '../../../components/ConnectToDB/types';
import type {AppDispatch} from '../../../store';
import {
    applyExternalQueryToActiveTab,
    setQueryTabContent,
} from '../../../store/reducers/query/query';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, setQueryTab} from '../../../store/reducers/tenant/tenant';
import type {TenantPage} from '../../../store/reducers/tenant/types';
import type {IQueryResult} from '../../../types/store/query';
import createToast from '../../../utils/createToast';
import {b} from '../ObjectSummary/shared';
import {transformPath} from '../ObjectSummary/transformPath';
import type {SchemaData} from '../Schema/SchemaViewer/types';
import i18n from '../i18n';

import {getTenantPageForDiagnosticsTab} from './diagnosticsNavigation';
import type {TemplateFn} from './schemaQueryTemplates';
import {
    addFulltextIndex,
    addMinMaxIndex,
    addTableIndex,
    addVectorIndex,
    alterAsyncReplicationTemplate,
    alterSecretTemplate,
    alterStreamingQuerySettingsTemplate,
    alterStreamingQueryText,
    alterTableTemplate,
    alterTopicTemplate,
    alterTransferTemplate,
    createAsyncReplicationTemplate,
    createCdcStreamTemplate,
    createColumnTableTemplate,
    createExternalTableTemplate,
    createStreamingQueryTemplate,
    createTableTemplate,
    createTopicTemplate,
    createTransferTemplate,
    createViewTemplate,
    disableTTLTemplate,
    dropAsyncReplicationTemplate,
    dropExternalTableTemplate,
    dropSecretTemplate,
    dropStreamingQueryTemplate,
    dropTableIndex,
    dropTableTemplate,
    dropTopicTemplate,
    dropTransferTemplate,
    dropViewTemplate,
    enableTTLTemplate,
    manageAutoPartitioningTemplate,
    manageReadReplicasTemplate,
    selectQueryTemplate,
    selectTopicQueryTemplate,
    showCreateTableTemplate,
    upsertQueryTemplate,
} from './schemaQueryTemplates';
import type {YdbNavigationTreeProps} from './types';

import MoniumIcon from '../../../assets/icons/monium.svg';

const TRAILING_ELLIPSIS = /\.{3}$/;
function stripEllipsis(text: string): string {
    return text.replace(TRAILING_ELLIPSIS, '').trim();
}

interface ActionsAdditionalParams {
    setActivePath: (path: string) => void;
    setTenantPage: (page: TenantPage) => void;
    isMultiTabEnabled?: boolean;
    showCreateDirectoryDialog?: (path: string) => void;
    showCreateTableDialog?: (path: string) => void;
    showCreateTopicDialog?: (path: string) => void;
    showUpdateTableDialog?: (path: string) => void;
    showUpdateTopicDialog?: (path: string) => void;
    getConfirmation?: () => Promise<boolean>;
    getConnectToDBDialog?: (params: SnippetParams) => Promise<boolean>;
    showCompactionDialog?: (path: string) => void;
    hasRunningCompaction?: (path: string) => boolean;
    isCompactionLoading?: boolean;
    schemaData?: SchemaData[];
    schemaDataPath?: string;
    isSchemaDataLoading?: boolean;
    isSchemaDataError?: boolean;
    hasMonitoring?: boolean;
    isV2NavigationEnabled?: boolean;
    streamingQueryData?: IQueryResult;
    showCreateTableData?: string;
    isStreamingQueryTextLoading?: boolean;
    isShowCreateTableLoading?: boolean;
    schemaSecretsEnabled?: boolean;
    topicsSqlIoOperationsEnabled?: boolean;
}

interface BindActionParams {
    database: string;
    type: NavigationTreeNodeType;
    path: string;
    databaseFullPath: string;
    relativePath: string;
}

function getSchemaDataForAction(
    schemaData: SchemaData[] | undefined,
    schemaDataPath: string | undefined,
    actionPath: string,
    isSchemaDataError: boolean,
) {
    if (isSchemaDataError || schemaDataPath !== actionPath) {
        return undefined;
    }

    return schemaData;
}

const bindActions = (
    params: BindActionParams,
    dispatch: AppDispatch,
    additionalEffects: ActionsAdditionalParams,
) => {
    const {
        setActivePath,
        setTenantPage,
        isMultiTabEnabled,
        showCreateDirectoryDialog,
        showCreateTableDialog,
        showCreateTopicDialog,
        showUpdateTableDialog,
        showUpdateTopicDialog,
        getConfirmation,
        getConnectToDBDialog,
        showCompactionDialog,
        streamingQueryData,
        showCreateTableData,
    } = additionalEffects;
    const schemaData = getSchemaDataForAction(
        additionalEffects.schemaData,
        additionalEffects.schemaDataPath,
        params.path,
        Boolean(additionalEffects.isSchemaDataError),
    );

    const inputQuery = (tmpl: TemplateFn, templateName?: string) => () => {
        const snippet = tmpl({
            ...params,
            schemaData,
            streamingQueryData,
            showCreateTableData,
        });

        const applyInsert = () => {
            setTenantPage(TENANT_PAGES_IDS.query);
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
            setActivePath(params.path);

            if (isMultiTabEnabled && templateName) {
                dispatch(
                    setQueryTabContent({
                        tabId: uuidv4(),
                        title: templateName,
                        pendingSnippet: snippet,
                        ensureUniqueTitle: true,
                    }),
                );
            } else {
                dispatch(
                    applyExternalQueryToActiveTab({
                        title: templateName ?? '',
                        input: '',
                        pendingSnippet: snippet,
                    }),
                );
            }
        };
        if (getConfirmation) {
            const confirmedPromise = getConfirmation();
            confirmedPromise.then((confirmed) => {
                if (confirmed) {
                    applyInsert();
                }
            });
        } else {
            applyInsert();
        }
    };

    return {
        createDirectory: showCreateDirectoryDialog
            ? () => {
                  showCreateDirectoryDialog(params.path);
              }
            : undefined,
        createTableDialog: showCreateTableDialog
            ? () => {
                  showCreateTableDialog(params.path);
              }
            : undefined,
        createTopicDialog: showCreateTopicDialog
            ? () => {
                  showCreateTopicDialog(params.path);
              }
            : undefined,
        getConnectToDBDialog: () => getConnectToDBDialog?.({database: params.database}),
        openCompactionDialog: () => {
            showCompactionDialog?.(params.path);
        },
        openMonitoring: () => {
            setTenantPage(
                getTenantPageForDiagnosticsTab(
                    TENANT_DIAGNOSTICS_TABS_IDS.monitoring,
                    Boolean(additionalEffects.isV2NavigationEnabled),
                ),
            );
            dispatch(setDiagnosticsTab(TENANT_DIAGNOSTICS_TABS_IDS.monitoring));
            setActivePath(params.path);
        },
        createTable: inputQuery(createTableTemplate, stripEllipsis(i18n('action_create-table'))),
        updateTable: () => showUpdateTableDialog?.(params.path),
        createColumnTable: inputQuery(
            createColumnTableTemplate,
            stripEllipsis(i18n('action_create-column-table')),
        ),
        createAsyncReplication: inputQuery(
            createAsyncReplicationTemplate,
            stripEllipsis(i18n('action_create-async-replication')),
        ),
        alterAsyncReplication: inputQuery(
            alterAsyncReplicationTemplate,
            stripEllipsis(i18n('action_alter-async-replication')),
        ),
        dropAsyncReplication: inputQuery(
            dropAsyncReplicationTemplate,
            stripEllipsis(i18n('action_drop-async-replication')),
        ),
        createTransfer: inputQuery(
            createTransferTemplate,
            stripEllipsis(i18n('action_create-transfer')),
        ),
        alterTransfer: inputQuery(
            alterTransferTemplate,
            stripEllipsis(i18n('action_alter-transfer')),
        ),
        dropTransfer: inputQuery(dropTransferTemplate, stripEllipsis(i18n('action_drop-transfer'))),
        alterSecret: inputQuery(alterSecretTemplate, stripEllipsis(i18n('action_alter-secret'))),
        dropSecret: inputQuery(dropSecretTemplate, stripEllipsis(i18n('action_drop-secret'))),
        alterTable: inputQuery(alterTableTemplate, stripEllipsis(i18n('action_alter-table'))),
        dropTable: inputQuery(dropTableTemplate, stripEllipsis(i18n('action_drop-table'))),
        manageAutoPartitioning: inputQuery(
            manageAutoPartitioningTemplate,
            stripEllipsis(i18n('action_manage-auto-partitioning')),
        ),
        manageReadReplicas: inputQuery(
            manageReadReplicasTemplate,
            stripEllipsis(i18n('action_add-read-only-replicas')),
        ),
        enableTTL: inputQuery(enableTTLTemplate, stripEllipsis(i18n('action_enable-ttl'))),
        disableTTL: inputQuery(disableTTLTemplate, stripEllipsis(i18n('action_disable-ttl'))),
        selectQuery: inputQuery(selectQueryTemplate, stripEllipsis(i18n('action_select-query'))),
        selectTopicQuery: inputQuery(
            selectTopicQueryTemplate,
            stripEllipsis(i18n('action_select-query')),
        ),
        showCreateTable: inputQuery(
            showCreateTableTemplate,
            stripEllipsis(i18n('action_show-create-sql')),
        ),
        upsertQuery: inputQuery(upsertQueryTemplate, stripEllipsis(i18n('action_upsert-query'))),
        createExternalTable: inputQuery(
            createExternalTableTemplate,
            stripEllipsis(i18n('action_create-external-table')),
        ),
        dropExternalTable: inputQuery(
            dropExternalTableTemplate,
            stripEllipsis(i18n('action_drop-table')),
        ),
        selectQueryFromExternalTable: inputQuery(
            selectQueryTemplate,
            stripEllipsis(i18n('action_select-query')),
        ),
        createTopic: inputQuery(createTopicTemplate, stripEllipsis(i18n('action_create-topic'))),
        updateTopic: () => showUpdateTopicDialog?.(params.path),
        alterTopic: inputQuery(alterTopicTemplate, stripEllipsis(i18n('action_alter-topic'))),
        dropTopic: inputQuery(dropTopicTemplate, stripEllipsis(i18n('action_drop-topic'))),
        createView: inputQuery(createViewTemplate, stripEllipsis(i18n('action_create-view'))),
        dropView: inputQuery(dropViewTemplate, stripEllipsis(i18n('action_drop-view'))),
        createStreamingQuery: inputQuery(
            createStreamingQueryTemplate,
            stripEllipsis(i18n('action_create-streaming-query')),
        ),
        addFulltextIndex: inputQuery(
            addFulltextIndex,
            stripEllipsis(i18n('action_add-fulltext-index')),
        ),
        alterStreamingQuerySettings: inputQuery(
            alterStreamingQuerySettingsTemplate,
            stripEllipsis(i18n('action_alter-streaming-query-settings')),
        ),
        alterStreamingQueryText: inputQuery(
            alterStreamingQueryText,
            stripEllipsis(i18n('action_alter-streaming-query-text')),
        ),
        dropStreamingQuery: inputQuery(
            dropStreamingQueryTemplate,
            stripEllipsis(i18n('action_drop-streaming-query')),
        ),
        dropIndex: inputQuery(dropTableIndex, i18n('action_drop-index')),
        addMinMaxIndex: inputQuery(addMinMaxIndex, stripEllipsis(i18n('action_add-min-max-index'))),
        addVectorIndex: inputQuery(addVectorIndex, stripEllipsis(i18n('action_add-vector-index'))),
        addTableIndex: inputQuery(addTableIndex, stripEllipsis(i18n('action_add-index'))),
        createCdcStream: inputQuery(
            createCdcStreamTemplate,
            stripEllipsis(i18n('action_create-changefeed')),
        ),
        copyPath: () => {
            try {
                copy(params.relativePath);
                createToast({
                    name: 'Copied',
                    title: i18n('alert_copy-path-success'),
                    theme: 'success',
                });
            } catch {
                createToast({
                    name: 'Not copied',
                    title: i18n('alert_copy-path-error'),
                    theme: 'danger',
                });
            }
        },
    };
};

type ActionsSet = ReturnType<Required<YdbNavigationTreeProps>['getActions']>;

interface ActionConfig {
    text: string;
    action: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    iconStart?: React.ReactNode;
}

function renderMenuItemText(title: string, description?: string) {
    if (!description) {
        return title;
    }

    return (
        <div className={b('context-menu-item-content')}>
            <div className={b('context-menu-item-title')}>{title}</div>
            <div className={b('context-menu-item-description')}>{description}</div>
        </div>
    );
}

const getActionWithLoader = ({text, action, isLoading, disabled, iconStart}: ActionConfig) => ({
    text: (
        <Flex justifyContent="space-between" alignItems="center">
            {text}
            {isLoading && <Spin size="xs" />}
        </Flex>
    ),
    action,
    disabled: isLoading || disabled,
    iconStart,
});

export const getActions =
    (
        dispatch: AppDispatch,
        additionalEffects: ActionsAdditionalParams,
        rootPath = '',
        database: string,
    ) =>
    (path: string, type: NavigationTreeNodeType) => {
        const relativePath = transformPath(path, rootPath);
        const actions = bindActions(
            {
                path,
                relativePath,
                database,
                type,
                databaseFullPath: rootPath,
            },
            dispatch,
            additionalEffects,
        );
        const copyItem: ActionsSet[0] = {
            text: i18n('action_copy-path'),
            action: actions.copyPath,
            iconStart: <Copy />,
        };
        const connectToDBItem = {
            text: i18n('action_connect-to-db'),
            action: actions.getConnectToDBDialog,
            iconStart: <PlugConnection />,
        };
        const monitoringItem = {
            text: i18n('action_open-monitoring'),
            action: actions.openMonitoring,
            iconStart: <Icon data={MoniumIcon} />,
        };

        const createEntitiesSet = [
            {
                text: i18n('action_create-table'),
                action: actions.createTable,
                iconStart: <Icon data={Code} />,
            },
            {
                text: i18n('action_create-column-table'),
                action: actions.createColumnTable,
                iconStart: <Icon data={Code} />,
            },
            {
                text: i18n('action_create-async-replication'),
                action: actions.createAsyncReplication,
                iconStart: <Icon data={Code} />,
            },
            {
                text: i18n('action_create-transfer'),
                action: actions.createTransfer,
                iconStart: <Icon data={Code} />,
            },
            {
                text: i18n('action_create-topic'),
                action: actions.createTopic,
                iconStart: <Icon data={Code} />,
            },
            {
                text: i18n('action_create-view'),
                action: actions.createView,
                iconStart: <Icon data={Code} />,
            },
            {
                text: i18n('action_create-streaming-query'),
                action: actions.createStreamingQuery,
                iconStart: <Icon data={Code} />,
            },
        ];

        const manageColumnsItem = {text: i18n('action_manage-columns'), action: actions.alterTable};
        const manageAutoPartitioningItem = {
            text: i18n('action_manage-auto-partitioning'),
            action: actions.manageAutoPartitioning,
        };
        const manageReadReplicasItem = {
            text: i18n('action_add-read-only-replicas'),
            action: actions.manageReadReplicas,
        };
        const enableTTLItem = {
            text: i18n('action_enable-ttl'),
            action: actions.enableTTL,
        };
        const disableTTLItem = {
            text: i18n('action_disable-ttl'),
            action: actions.disableTTL,
        };

        const alterRowTableGroupItem = {
            text: i18n('action_alter-table'),
            items: [
                manageColumnsItem,
                manageAutoPartitioningItem,
                manageReadReplicasItem,
                enableTTLItem,
                disableTTLItem,
            ],
        };
        const alterColumnTableGroupItem = {
            text: i18n('action_alter-table'),
            items: [manageColumnsItem, manageAutoPartitioningItem, enableTTLItem],
        };

        let DB_SET: ActionsSet = [[copyItem, connectToDBItem], createEntitiesSet];

        const DIR_SET: ActionsSet = [[copyItem], createEntitiesSet];

        if (additionalEffects.hasMonitoring) {
            DB_SET = [[copyItem, connectToDBItem, monitoringItem], createEntitiesSet];
        }

        const createDirectoryItem = actions.createDirectory
            ? {
                  text: i18n('value_directory'),
                  action: actions.createDirectory,
                  iconStart: <Folder />,
              }
            : undefined;
        const createTableItem = actions.createTableDialog
            ? {
                  text: i18n('value_table'),
                  action: actions.createTableDialog,
                  iconStart: <LayoutHeaderCellsLarge />,
              }
            : undefined;
        const createTopicItem = actions.createTopicDialog
            ? {
                  text: i18n('value_topic'),
                  action: actions.createTopicDialog,
                  iconStart: <BarsUnaligned />,
              }
            : undefined;
        const createDialogItems: typeof createEntitiesSet = [];
        if (createTableItem) {
            createDialogItems.push(createTableItem);
        }
        if (createDirectoryItem) {
            createDialogItems.push(createDirectoryItem);
        }
        if (createTopicItem) {
            createDialogItems.push(createTopicItem);
        }

        const createMenuItem = createDialogItems.length
            ? {
                  text: renderMenuItemText(
                      i18n('action_create-entity'),
                      i18n('context_create-entity-through-form'),
                  ),
                  iconStart: (
                      <Icon
                          data={CirclePlus}
                          className={b('context-menu-item-icon-with-description')}
                      />
                  ),
                  className: b('context-menu-item', {'with-description': true}),
                  contentClassName: b('context-menu-item-content-wrapper'),
                  items: createDialogItems,
              }
            : undefined;

        if (createMenuItem) {
            DB_SET.splice(1, 0, [createMenuItem]);
            DIR_SET.splice(1, 0, [createMenuItem]);
        }

        const showCreateTableItem = getActionWithLoader({
            text: i18n('action_show-create-sql'),
            action: actions.showCreateTable,
            isLoading: additionalEffects.isShowCreateTableLoading,
            iconStart: <Code />,
        });
        const compactionItem = getActionWithLoader({
            text: i18n('action_compaction'),
            action: actions.openCompactionDialog,
            iconStart: <Icon data={GearPlay} />,
            isLoading: additionalEffects.isCompactionLoading,
            disabled: additionalEffects.hasRunningCompaction?.(path),
        });

        const updateTableItem = {
            text: i18n('action_edit-table'),
            action: actions.updateTable,
            iconStart: <Pencil />,
        };

        const updateTopicItem = {
            text: i18n('action_edit-topic'),
            action: actions.updateTopic,
            iconStart: <Pencil />,
        };

        const ROW_TABLE_SET: ActionsSet = [
            [copyItem],
            [updateTableItem],
            [
                alterRowTableGroupItem,
                {text: i18n('action_drop-table'), action: actions.dropTable},
                getActionWithLoader({
                    text: i18n('action_select-query'),
                    action: actions.selectQuery,
                    isLoading: additionalEffects.isSchemaDataLoading,
                }),
                getActionWithLoader({
                    text: i18n('action_upsert-query'),
                    action: actions.upsertQuery,
                    isLoading: additionalEffects.isSchemaDataLoading,
                }),
                {text: i18n('action_add-index'), action: actions.addTableIndex},
                {text: i18n('action_add-vector-index'), action: actions.addVectorIndex},
                {text: i18n('action_add-fulltext-index'), action: actions.addFulltextIndex},
                {text: i18n('action_create-changefeed'), action: actions.createCdcStream},
            ],
            [
                ...(additionalEffects.showCompactionDialog ? [compactionItem] : []),
                showCreateTableItem,
            ],
        ];
        const COLUMN_TABLE_SET: ActionsSet = [
            [copyItem],
            [updateTableItem],
            [
                alterColumnTableGroupItem,
                {text: i18n('action_drop-table'), action: actions.dropTable},
                {text: i18n('action_select-query'), action: actions.selectQuery},
                {text: i18n('action_upsert-query'), action: actions.upsertQuery},
                {text: i18n('action_add-min-max-index'), action: actions.addMinMaxIndex},
            ],
            [showCreateTableItem],
        ];

        const TOPIC_SET: ActionsSet = [
            [copyItem],
            [updateTopicItem],
            [
                ...(additionalEffects.topicsSqlIoOperationsEnabled
                    ? [{text: i18n('action_select-query'), action: actions.selectTopicQuery}]
                    : []),
                {text: i18n('action_alter-topic'), action: actions.alterTopic},
                {text: i18n('action_drop-topic'), action: actions.dropTopic},
            ],
        ];

        const EXTERNAL_TABLE_SET = [
            [copyItem],
            [
                {
                    text: i18n('action_select-query'),
                    action: actions.selectQueryFromExternalTable,
                },
            ],
            [{text: i18n('action_drop-table'), action: actions.dropExternalTable}],
        ];

        const EXTERNAL_DATA_SOURCE_SET = [
            [copyItem],
            [{text: i18n('action_create-external-table'), action: actions.createExternalTable}],
        ];

        const VIEW_SET = [
            [copyItem],
            [{text: i18n('action_select-query'), action: actions.selectQuery}],
            [{text: i18n('action_drop-view'), action: actions.dropView}],
        ];

        const SYSTEM_VIEW_SET: ActionsSet = [
            [copyItem],
            [
                getActionWithLoader({
                    text: i18n('action_select-query'),
                    action: actions.selectQuery,
                    isLoading: additionalEffects.isSchemaDataLoading,
                }),
            ],
        ];

        const ASYNC_REPLICATION_SET: ActionsSet = [
            [copyItem],
            [
                {
                    text: i18n('action_alter-async-replication'),
                    action: actions.alterAsyncReplication,
                },
                {text: i18n('action_drop-async-replication'), action: actions.dropAsyncReplication},
            ],
        ];

        const TRANSFER_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('action_alter-transfer'), action: actions.alterTransfer},
                {text: i18n('action_drop-transfer'), action: actions.dropTransfer},
            ],
        ];

        const SECRET_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('action_alter-secret'), action: actions.alterSecret},
                {text: i18n('action_drop-secret'), action: actions.dropSecret},
            ],
        ];

        const INDEX_SET: ActionsSet = [
            [copyItem, {text: i18n('action_drop-index'), action: actions.dropIndex}],
        ];

        const STREAMING_QUERY_SET: ActionsSet = [
            [copyItem],
            [
                {
                    text: i18n('action_alter-streaming-query-text'),
                    action: actions.alterStreamingQueryText,
                },
                {
                    text: i18n('action_alter-streaming-query-settings'),
                    action: actions.alterStreamingQuerySettings,
                },
                {
                    text: i18n('action_drop-streaming-query'),
                    action: actions.dropStreamingQuery,
                },
            ],
        ];

        const JUST_COPY: ActionsSet = [copyItem];

        // verbose mapping to guarantee a correct actions set for new node types
        // TS will error when a new type is added in the lib but is not mapped here
        const INDEX_TABLE_SET = additionalEffects.showCompactionDialog
            ? [[copyItem], [compactionItem]]
            : JUST_COPY;

        const nodeTypeToActions: Record<NavigationTreeNodeType, ActionsSet> = {
            async_replication: ASYNC_REPLICATION_SET,
            transfer: TRANSFER_SET,

            database: DB_SET,

            directory: DIR_SET,
            resource_pool: JUST_COPY,
            secret: additionalEffects.schemaSecretsEnabled ? SECRET_SET : JUST_COPY,

            table: ROW_TABLE_SET,
            column_table: COLUMN_TABLE_SET,
            system_table: SYSTEM_VIEW_SET,

            index_table: INDEX_TABLE_SET,
            topic: TOPIC_SET,
            stream: JUST_COPY,

            index: INDEX_SET,

            external_table: EXTERNAL_TABLE_SET,
            external_data_source: EXTERNAL_DATA_SOURCE_SET,

            view: VIEW_SET,

            streaming_query: STREAMING_QUERY_SET,
        };

        return nodeTypeToActions[type];
    };
