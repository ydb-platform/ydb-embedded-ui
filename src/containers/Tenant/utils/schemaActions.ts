import copy from 'copy-to-clipboard';
import type {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';

import type {AppDispatch} from '../../../store';
import type {GetTableSchemaDataParams} from '../../../store/reducers/tableSchemaData';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import type {QuerySettings} from '../../../types/store/query';
import createToast from '../../../utils/createToast';
import {insertSnippetToEditor} from '../../../utils/monaco/insertSnippet';
import {transformPath} from '../ObjectSummary/transformPath';
import type {SchemaData} from '../Schema/SchemaViewer/types';
import i18n from '../i18n';

import {nodeTableTypeToPathType} from './schema';
import type {TemplateFn} from './schemaQueryTemplates';
import {
    addTableIndex,
    alterAsyncReplicationTemplate,
    alterTableTemplate,
    alterTopicTemplate,
    createAsyncReplicationTemplate,
    createCdcStreamTemplate,
    createColumnTableTemplate,
    createExternalTableTemplate,
    createTableTemplate,
    createTopicTemplate,
    createViewTemplate,
    dropAsyncReplicationTemplate,
    dropExternalTableTemplate,
    dropTableIndex,
    dropTableTemplate,
    dropTopicTemplate,
    dropViewTemplate,
    selectQueryTemplate,
    upsertQueryTemplate,
} from './schemaQueryTemplates';

interface ActionsAdditionalEffects {
    updateQueryExecutionSettings: (settings?: Partial<QuerySettings>) => void;
    setActivePath: (path: string) => void;
    showCreateDirectoryDialog?: (path: string) => void;
    getTableSchemaDataPromise?: (
        params: GetTableSchemaDataParams,
    ) => Promise<SchemaData[] | undefined>;
    getConfirmation?: () => Promise<boolean>;
}

interface BindActionParams {
    tenantName: string;
    type: NavigationTreeNodeType;
    path: string;
    relativePath: string;
}

const bindActions = (
    params: BindActionParams,
    dispatch: AppDispatch,
    additionalEffects: ActionsAdditionalEffects,
) => {
    const {setActivePath, showCreateDirectoryDialog, getTableSchemaDataPromise, getConfirmation} =
        additionalEffects;

    const inputQuery = (tmpl: TemplateFn) => () => {
        const applyInsert = () => {
            const pathType = nodeTableTypeToPathType[params.type];
            const withTableData = [selectQueryTemplate, upsertQueryTemplate].includes(tmpl);

            const userInputDataPromise =
                withTableData && pathType && getTableSchemaDataPromise
                    ? getTableSchemaDataPromise({
                          path: params.path,
                          tenantName: params.tenantName,
                          type: pathType,
                      })
                    : Promise.resolve(undefined);

            //order is important here: firstly we should open query tab and initialize editor (it will be set to window.ydbEditor), after that it is possible to insert snippet
            dispatch(setTenantPage(TENANT_PAGES_IDS.query));
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
            setActivePath(params.path);
            userInputDataPromise.then((tableData) => {
                insertSnippetToEditor(tmpl({...params, tableData}));
            });
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
        createTable: inputQuery(createTableTemplate),
        createColumnTable: inputQuery(createColumnTableTemplate),
        createAsyncReplication: inputQuery(createAsyncReplicationTemplate),
        alterAsyncReplication: inputQuery(alterAsyncReplicationTemplate),
        dropAsyncReplication: inputQuery(dropAsyncReplicationTemplate),
        alterTable: inputQuery(alterTableTemplate),
        dropTable: inputQuery(dropTableTemplate),
        selectQuery: inputQuery(selectQueryTemplate),
        upsertQuery: inputQuery(upsertQueryTemplate),
        createExternalTable: inputQuery(createExternalTableTemplate),
        dropExternalTable: inputQuery(dropExternalTableTemplate),
        selectQueryFromExternalTable: inputQuery(selectQueryTemplate),
        createTopic: inputQuery(createTopicTemplate),
        alterTopic: inputQuery(alterTopicTemplate),
        dropTopic: inputQuery(dropTopicTemplate),
        createView: inputQuery(createViewTemplate),
        dropView: inputQuery(dropViewTemplate),
        dropIndex: inputQuery(dropTableIndex),
        addTableIndex: inputQuery(addTableIndex),
        createCdcStream: inputQuery(createCdcStreamTemplate),
        copyPath: () => {
            try {
                copy(params.relativePath);
                createToast({
                    name: 'Copied',
                    title: i18n('actions.copied'),
                    type: 'success',
                });
            } catch {
                createToast({
                    name: 'Not copied',
                    title: i18n('actions.notCopied'),
                    type: 'error',
                });
            }
        },
    };
};

type ActionsSet = ReturnType<Required<NavigationTreeProps>['getActions']>;

export const getActions =
    (dispatch: AppDispatch, additionalEffects: ActionsAdditionalEffects, rootPath = '') =>
    (path: string, type: NavigationTreeNodeType) => {
        const relativePath = transformPath(path, rootPath);
        const actions = bindActions(
            {path, relativePath, tenantName: rootPath, type},
            dispatch,
            additionalEffects,
        );
        const copyItem = {text: i18n('actions.copyPath'), action: actions.copyPath};

        const DIR_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.createTable'), action: actions.createTable},
                {text: i18n('actions.createColumnTable'), action: actions.createColumnTable},
                {
                    text: i18n('actions.createAsyncReplication'),
                    action: actions.createAsyncReplication,
                },
                {text: i18n('actions.createTopic'), action: actions.createTopic},
                {text: i18n('actions.createView'), action: actions.createView},
            ],
        ];
        if (actions.createDirectory) {
            DIR_SET.splice(1, 0, [
                {text: i18n('actions.createDirectory'), action: actions.createDirectory},
            ]);
        }
        const ROW_TABLE_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTable'), action: actions.alterTable},
                {text: i18n('actions.dropTable'), action: actions.dropTable},
                {text: i18n('actions.selectQuery'), action: actions.selectQuery},
                {text: i18n('actions.upsertQuery'), action: actions.upsertQuery},
                {text: i18n('actions.addTableIndex'), action: actions.addTableIndex},
                {text: i18n('actions.createCdcStream'), action: actions.createCdcStream},
            ],
        ];
        const COLUMN_TABLE_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTable'), action: actions.alterTable},
                {text: i18n('actions.dropTable'), action: actions.dropTable},
                {text: i18n('actions.selectQuery'), action: actions.selectQuery},
                {text: i18n('actions.upsertQuery'), action: actions.upsertQuery},
            ],
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

        const ASYNC_REPLICATION_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterReplication'), action: actions.alterAsyncReplication},
                {text: i18n('actions.dropReplication'), action: actions.dropAsyncReplication},
            ],
        ];

        const INDEX_SET: ActionsSet = [
            [copyItem, {text: i18n('actions.dropIndex'), action: actions.dropIndex}],
        ];

        const JUST_COPY: ActionsSet = [copyItem];

        // verbose mapping to guarantee a correct actions set for new node types
        // TS will error when a new type is added in the lib but is not mapped here
        const nodeTypeToActions: Record<NavigationTreeNodeType, ActionsSet> = {
            async_replication: ASYNC_REPLICATION_SET,

            database: DIR_SET,
            directory: DIR_SET,

            table: ROW_TABLE_SET,
            column_table: COLUMN_TABLE_SET,

            index_table: JUST_COPY,
            topic: TOPIC_SET,
            stream: JUST_COPY,

            index: INDEX_SET,

            external_table: EXTERNAL_TABLE_SET,
            external_data_source: EXTERNAL_DATA_SOURCE_SET,

            view: VIEW_SET,
        };

        return nodeTypeToActions[type];
    };
