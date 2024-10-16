import copy from 'copy-to-clipboard';
import type {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';

import type {AppDispatch} from '../../../store';
import {changeUserInput} from '../../../store/reducers/executeQuery';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import type {QueryMode, QuerySettings} from '../../../types/store/query';
import createToast from '../../../utils/createToast';
import {getTableDataPromise} from '../../../utils/hooks';
import {transformPath} from '../ObjectSummary/transformPath';
import i18n from '../i18n';

import {nodeTableTypeToPathType} from './schema';
import type {TemplateFn} from './schemaQueryTemplates';
import {
    addTableIndex,
    alterAsyncReplicationTemplate,
    alterTableTemplate,
    alterTopicTemplate,
    createAsyncReplicationTemplate,
    createColumnTableTemplate,
    createExternalTableTemplate,
    createTableTemplate,
    createTopicTemplate,
    createViewTemplate,
    dropAsyncReplicationTemplate,
    dropExternalTableTemplate,
    dropTableIndex,
    dropTopicTemplate,
    dropViewTemplate,
    selectQueryTemplate,
    upsertQueryTemplate,
} from './schemaQueryTemplates';

interface ActionsAdditionalEffects {
    updateQueryExecutionSettings: (settings?: Partial<QuerySettings>) => void;
    setActivePath: (path: string) => void;
    showCreateDirectoryDialog?: (path: string) => void;
}

interface AdditionalInputQueryOptions {
    mode?: QueryMode;
    withTableData?: boolean;
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
    const {setActivePath, updateQueryExecutionSettings, showCreateDirectoryDialog} =
        additionalEffects;

    const inputQuery = (tmpl: TemplateFn, options?: AdditionalInputQueryOptions) => () => {
        if (options?.mode) {
            updateQueryExecutionSettings({queryMode: options.mode});
        }

        const pathType = nodeTableTypeToPathType[params.type];

        const userInputDataPromise =
            options?.withTableData && pathType
                ? getTableDataPromise(params.path, params.tenantName, pathType, dispatch)
                : Promise.resolve(undefined);

        userInputDataPromise.then((tableData) => {
            dispatch(changeUserInput({input: tmpl({...params, tableData})}));
        });

        dispatch(setTenantPage(TENANT_PAGES_IDS.query));
        dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
        setActivePath(params.path);
    };

    return {
        createDirectory: showCreateDirectoryDialog
            ? () => {
                  showCreateDirectoryDialog(params.path);
              }
            : undefined,
        createTable: inputQuery(createTableTemplate, {mode: 'script'}),
        createColumnTable: inputQuery(createColumnTableTemplate, {mode: 'script'}),
        createAsyncReplication: inputQuery(createAsyncReplicationTemplate, {mode: 'script'}),
        alterAsyncReplication: inputQuery(alterAsyncReplicationTemplate, {mode: 'script'}),
        dropAsyncReplication: inputQuery(dropAsyncReplicationTemplate, {mode: 'script'}),
        alterTable: inputQuery(alterTableTemplate, {mode: 'script'}),
        selectQuery: inputQuery(selectQueryTemplate, {withTableData: true}),
        upsertQuery: inputQuery(upsertQueryTemplate, {withTableData: true}),
        createExternalTable: inputQuery(createExternalTableTemplate, {mode: 'script'}),
        dropExternalTable: inputQuery(dropExternalTableTemplate, {mode: 'script'}),
        selectQueryFromExternalTable: inputQuery(selectQueryTemplate, {mode: 'query'}),
        createTopic: inputQuery(createTopicTemplate, {mode: 'script'}),
        alterTopic: inputQuery(alterTopicTemplate, {mode: 'script'}),
        dropTopic: inputQuery(dropTopicTemplate, {mode: 'script'}),
        createView: inputQuery(createViewTemplate, {mode: 'script'}),
        dropView: inputQuery(dropViewTemplate, {mode: 'script'}),
        dropIndex: inputQuery(dropTableIndex, {mode: 'script'}),
        addTableIndex: inputQuery(addTableIndex, {mode: 'script'}),
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
        const TABLE_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTable'), action: actions.alterTable},
                {text: i18n('actions.selectQuery'), action: actions.selectQuery},
                {text: i18n('actions.upsertQuery'), action: actions.upsertQuery},
                {text: i18n('actions.addTableIndex'), action: actions.addTableIndex},
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

            table: TABLE_SET,
            column_table: TABLE_SET,

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
