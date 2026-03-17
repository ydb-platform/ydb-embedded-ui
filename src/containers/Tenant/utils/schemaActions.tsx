import {ChartAreaStacked, CirclePlus, Code, Copy, PlugConnection} from '@gravity-ui/icons';
import {Flex, Spin} from '@gravity-ui/uikit';
import copy from 'copy-to-clipboard';
import {v4 as uuidv4} from 'uuid';
import type {NavigationTreeNodeType} from 'ydb-ui-components';

import type {SnippetParams} from '../../../components/ConnectToDB/types';
import type {AppDispatch} from '../../../store';
import {setQueryTabContent} from '../../../store/reducers/query/query';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, setQueryTab} from '../../../store/reducers/tenant/tenant';
import type {TenantPage} from '../../../store/reducers/tenant/types';
import type {IQueryResult} from '../../../types/store/query';
import {uiFactory} from '../../../uiFactory/uiFactory';
import createToast from '../../../utils/createToast';
import {insertSnippetToEditor} from '../../../utils/monaco/insertSnippet';
import {transformPath} from '../ObjectSummary/transformPath';
import type {SchemaData} from '../Schema/SchemaViewer/types';
import i18n from '../i18n';

import type {TemplateFn} from './schemaQueryTemplates';
import {
    addFulltextIndex,
    addTableIndex,
    addVectorIndex,
    alterAsyncReplicationTemplate,
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
    dropAsyncReplicationTemplate,
    dropExternalTableTemplate,
    dropStreamingQueryTemplate,
    dropTableIndex,
    dropTableTemplate,
    dropTopicTemplate,
    dropTransferTemplate,
    dropViewTemplate,
    manageAutoPartitioningTemplate,
    manageReadReplicasTemplate,
    manageTTLTemplate,
    selectQueryTemplate,
    showCreateTableTemplate,
    upsertQueryTemplate,
} from './schemaQueryTemplates';
import type {YdbNavigationTreeProps} from './types';

const TRAILING_ELLIPSIS = /\.{3}$/;
function stripEllipsis(text: string): string {
    return text.replace(TRAILING_ELLIPSIS, '').trim();
}

interface ActionsAdditionalParams {
    setActivePath: (path: string) => void;
    setTenantPage: (page: TenantPage) => void;
    showCreateDirectoryDialog?: (path: string) => void;
    getConfirmation?: () => Promise<boolean>;
    getConnectToDBDialog?: (params: SnippetParams) => Promise<boolean>;
    schemaData?: SchemaData[];
    isSchemaDataLoading?: boolean;
    hasMonitoring?: boolean;
    streamingQueryData?: IQueryResult;
    showCreateTableData?: string;
    isStreamingQueryTextLoading?: boolean;
    isShowCreateTableLoading?: boolean;
}

interface BindActionParams {
    database: string;
    type: NavigationTreeNodeType;
    path: string;
    databaseFullPath: string;
    relativePath: string;
}

const bindActions = (
    params: BindActionParams,
    dispatch: AppDispatch,
    additionalEffects: ActionsAdditionalParams,
) => {
    const {
        setActivePath,
        setTenantPage,
        showCreateDirectoryDialog,
        getConfirmation,
        getConnectToDBDialog,
        schemaData,
        streamingQueryData,
        showCreateTableData,
    } = additionalEffects;

    const isMultiTabEnabled = Boolean(uiFactory.enableMultiTabQueryEditor);

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
                insertSnippetToEditor(snippet);
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
        getConnectToDBDialog: () => getConnectToDBDialog?.({database: params.database}),
        openMonitoring: () => {
            setTenantPage(TENANT_PAGES_IDS.diagnostics);
            dispatch(setDiagnosticsTab(TENANT_DIAGNOSTICS_TABS_IDS.monitoring));
            setActivePath(params.path);
        },
        createTable: inputQuery(createTableTemplate, stripEllipsis(i18n('actions.createTable'))),
        createColumnTable: inputQuery(
            createColumnTableTemplate,
            stripEllipsis(i18n('actions.createColumnTable')),
        ),
        createAsyncReplication: inputQuery(
            createAsyncReplicationTemplate,
            stripEllipsis(i18n('actions.createAsyncReplication')),
        ),
        alterAsyncReplication: inputQuery(
            alterAsyncReplicationTemplate,
            stripEllipsis(i18n('actions.alterReplication')),
        ),
        dropAsyncReplication: inputQuery(
            dropAsyncReplicationTemplate,
            stripEllipsis(i18n('actions.dropReplication')),
        ),
        createTransfer: inputQuery(
            createTransferTemplate,
            stripEllipsis(i18n('actions.createTransfer')),
        ),
        alterTransfer: inputQuery(
            alterTransferTemplate,
            stripEllipsis(i18n('actions.alterTransfer')),
        ),
        dropTransfer: inputQuery(dropTransferTemplate, stripEllipsis(i18n('actions.dropTransfer'))),
        alterTable: inputQuery(alterTableTemplate, stripEllipsis(i18n('actions.alterTable'))),
        dropTable: inputQuery(dropTableTemplate, stripEllipsis(i18n('actions.dropTable'))),
        manageAutoPartitioning: inputQuery(
            manageAutoPartitioningTemplate,
            stripEllipsis(i18n('actions.manageAutoPartitioning')),
        ),
        manageReadReplicas: inputQuery(
            manageReadReplicasTemplate,
            stripEllipsis(i18n('actions.manageReadReplicas')),
        ),
        manageTTL: inputQuery(manageTTLTemplate, stripEllipsis(i18n('actions.manageTTL'))),
        selectQuery: inputQuery(selectQueryTemplate, stripEllipsis(i18n('actions.selectQuery'))),
        showCreateTable: inputQuery(
            showCreateTableTemplate,
            stripEllipsis(i18n('actions.showCreateTable')),
        ),
        upsertQuery: inputQuery(upsertQueryTemplate, stripEllipsis(i18n('actions.upsertQuery'))),
        createExternalTable: inputQuery(
            createExternalTableTemplate,
            stripEllipsis(i18n('actions.createExternalTable')),
        ),
        dropExternalTable: inputQuery(
            dropExternalTableTemplate,
            stripEllipsis(i18n('actions.dropTable')),
        ),
        selectQueryFromExternalTable: inputQuery(
            selectQueryTemplate,
            stripEllipsis(i18n('actions.selectQuery')),
        ),
        createTopic: inputQuery(createTopicTemplate, stripEllipsis(i18n('actions.createTopic'))),
        alterTopic: inputQuery(alterTopicTemplate, stripEllipsis(i18n('actions.alterTopic'))),
        dropTopic: inputQuery(dropTopicTemplate, stripEllipsis(i18n('actions.dropTopic'))),
        createView: inputQuery(createViewTemplate, stripEllipsis(i18n('actions.createView'))),
        dropView: inputQuery(dropViewTemplate, stripEllipsis(i18n('actions.dropView'))),
        createStreamingQuery: inputQuery(
            createStreamingQueryTemplate,
            stripEllipsis(i18n('actions.createStreamingQuery')),
        ),
        addFulltextIndex: inputQuery(
            addFulltextIndex,
            stripEllipsis(i18n('actions.addFulltextIndex')),
        ),
        alterStreamingQuerySettings: inputQuery(
            alterStreamingQuerySettingsTemplate,
            stripEllipsis(i18n('actions.alterStreamingQuerySettings')),
        ),
        alterStreamingQueryText: inputQuery(
            alterStreamingQueryText,
            stripEllipsis(i18n('actions.alterStreamingQueryText')),
        ),
        dropStreamingQuery: inputQuery(
            dropStreamingQueryTemplate,
            stripEllipsis(i18n('actions.dropStreamingQuery')),
        ),
        dropIndex: inputQuery(dropTableIndex, i18n('actions.dropIndex')),
        addVectorIndex: inputQuery(addVectorIndex, stripEllipsis(i18n('actions.addVectorIndex'))),
        addTableIndex: inputQuery(addTableIndex, stripEllipsis(i18n('actions.addTableIndex'))),
        createCdcStream: inputQuery(
            createCdcStreamTemplate,
            stripEllipsis(i18n('actions.createCdcStream')),
        ),
        copyPath: () => {
            try {
                copy(params.relativePath);
                createToast({
                    name: 'Copied',
                    title: i18n('actions.copied'),
                    theme: 'success',
                });
            } catch {
                createToast({
                    name: 'Not copied',
                    title: i18n('actions.notCopied'),
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
    iconStart?: React.ReactNode;
}

const getActionWithLoader = ({text, action, isLoading, iconStart}: ActionConfig) => ({
    text: (
        <Flex justifyContent="space-between" alignItems="center">
            {text}
            {isLoading && <Spin size="xs" />}
        </Flex>
    ),
    action,
    disabled: isLoading,
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
            text: i18n('actions.copyPath'),
            action: actions.copyPath,
            iconStart: <Copy />,
        };
        const connectToDBItem = {
            text: i18n('actions.connectToDB'),
            action: actions.getConnectToDBDialog,
            iconStart: <PlugConnection />,
        };
        const monitoringItem = {
            text: i18n('actions.openMonitoring'),
            action: actions.openMonitoring,
            iconStart: <ChartAreaStacked />,
        };

        const createEntitiesSet = [
            {text: i18n('actions.createTable'), action: actions.createTable},
            {text: i18n('actions.createColumnTable'), action: actions.createColumnTable},
            {
                text: i18n('actions.createAsyncReplication'),
                action: actions.createAsyncReplication,
            },
            {
                text: i18n('actions.createTransfer'),
                action: actions.createTransfer,
            },
            {text: i18n('actions.createTopic'), action: actions.createTopic},
            {text: i18n('actions.createView'), action: actions.createView},
            {text: i18n('actions.createStreamingQuery'), action: actions.createStreamingQuery},
        ];

        const manageColumnsItem = {text: i18n('actions.manageColumns'), action: actions.alterTable};
        const manageAutoPartitioningItem = {
            text: i18n('actions.manageAutoPartitioning'),
            action: actions.manageAutoPartitioning,
        };
        const manageReadReplicasItem = {
            text: i18n('actions.manageReadReplicas'),
            action: actions.manageReadReplicas,
        };
        const manageTTLItem = {
            text: i18n('actions.manageTTL'),
            action: actions.manageTTL,
        };

        const alterRowTableGroupItem = {
            text: i18n('actions.alterTable'),
            items: [
                manageColumnsItem,
                manageAutoPartitioningItem,
                manageReadReplicasItem,
                manageTTLItem,
            ],
        };
        const alterColumnTableGroupItem = {
            text: i18n('actions.alterTable'),
            items: [manageColumnsItem, manageAutoPartitioningItem, manageTTLItem],
        };

        let DB_SET: ActionsSet = [[copyItem, connectToDBItem], createEntitiesSet];

        const DIR_SET: ActionsSet = [[copyItem], createEntitiesSet];

        if (additionalEffects.hasMonitoring) {
            DB_SET = [[copyItem, connectToDBItem, monitoringItem], createEntitiesSet];
        }

        if (actions.createDirectory) {
            const createDirectoryItem = {
                text: i18n('actions.createDirectory'),
                action: actions.createDirectory,
                iconStart: <CirclePlus />,
            };

            DB_SET.splice(1, 0, [createDirectoryItem]);
            DIR_SET.splice(1, 0, [createDirectoryItem]);
        }

        const showCreateTableItem = getActionWithLoader({
            text: i18n('actions.showCreateTable'),
            action: actions.showCreateTable,
            isLoading: additionalEffects.isShowCreateTableLoading,
            iconStart: <Code />,
        });

        const ROW_TABLE_SET: ActionsSet = [
            [copyItem],
            [
                alterRowTableGroupItem,
                {text: i18n('actions.dropTable'), action: actions.dropTable},
                getActionWithLoader({
                    text: i18n('actions.selectQuery'),
                    action: actions.selectQuery,
                    isLoading: additionalEffects.isSchemaDataLoading,
                }),
                getActionWithLoader({
                    text: i18n('actions.upsertQuery'),
                    action: actions.upsertQuery,
                    isLoading: additionalEffects.isSchemaDataLoading,
                }),
                {text: i18n('actions.addTableIndex'), action: actions.addTableIndex},
                {text: i18n('actions.addVectorIndex'), action: actions.addVectorIndex},
                {text: i18n('actions.addFulltextIndex'), action: actions.addFulltextIndex},
                {text: i18n('actions.createCdcStream'), action: actions.createCdcStream},
            ],
            [showCreateTableItem],
        ];
        const COLUMN_TABLE_SET: ActionsSet = [
            [copyItem],
            [
                alterColumnTableGroupItem,
                {text: i18n('actions.dropTable'), action: actions.dropTable},
                {text: i18n('actions.selectQuery'), action: actions.selectQuery},
                {text: i18n('actions.upsertQuery'), action: actions.upsertQuery},
            ],
            [showCreateTableItem],
        ];

        const TOPIC_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTopic'), action: actions.alterTopic},
                {text: i18n('actions.dropTopic'), action: actions.dropTopic},
            ],
        ];

        const EXTERNAL_TABLE_SET = [
            [copyItem],
            [
                {
                    text: i18n('actions.selectQuery'),
                    action: actions.selectQueryFromExternalTable,
                },
            ],
            [{text: i18n('actions.dropTable'), action: actions.dropExternalTable}],
        ];

        const EXTERNAL_DATA_SOURCE_SET = [
            [copyItem],
            [{text: i18n('actions.createExternalTable'), action: actions.createExternalTable}],
        ];

        const VIEW_SET = [
            [copyItem],
            [{text: i18n('actions.selectQuery'), action: actions.selectQuery}],
            [{text: i18n('actions.dropView'), action: actions.dropView}],
        ];

        const SYSTEM_VIEW_SET: ActionsSet = [
            [copyItem],
            [{text: i18n('actions.selectQuery'), action: actions.selectQuery}],
        ];

        const ASYNC_REPLICATION_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterReplication'), action: actions.alterAsyncReplication},
                {text: i18n('actions.dropReplication'), action: actions.dropAsyncReplication},
            ],
        ];

        const TRANSFER_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTransfer'), action: actions.alterTransfer},
                {text: i18n('actions.dropTransfer'), action: actions.dropTransfer},
            ],
        ];

        const INDEX_SET: ActionsSet = [
            [copyItem, {text: i18n('actions.dropIndex'), action: actions.dropIndex}],
        ];

        const STREAMING_QUERY_SET: ActionsSet = [
            [copyItem],
            [
                {
                    text: i18n('actions.alterStreamingQueryText'),
                    action: actions.alterStreamingQueryText,
                },
                {
                    text: i18n('actions.alterStreamingQuerySettings'),
                    action: actions.alterStreamingQuerySettings,
                },
                {
                    text: i18n('actions.dropStreamingQuery'),
                    action: actions.dropStreamingQuery,
                },
            ],
        ];

        const JUST_COPY: ActionsSet = [copyItem];

        // verbose mapping to guarantee a correct actions set for new node types
        // TS will error when a new type is added in the lib but is not mapped here
        const nodeTypeToActions: Record<NavigationTreeNodeType, ActionsSet> = {
            async_replication: ASYNC_REPLICATION_SET,
            transfer: TRANSFER_SET,

            database: DB_SET,

            directory: DIR_SET,
            resource_pool: JUST_COPY,

            table: ROW_TABLE_SET,
            column_table: COLUMN_TABLE_SET,
            system_table: SYSTEM_VIEW_SET,

            index_table: JUST_COPY,
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
