import copy from 'copy-to-clipboard';
import type {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';

import {changeUserInput} from '../../../store/reducers/executeQuery';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import type {QueryMode} from '../../../types/store/query';
import createToast from '../../../utils/createToast';
import i18n from '../i18n';

import {
    alterTableTemplate,
    alterTopicTemplate,
    createExternalTableTemplate,
    createTableTemplate,
    createTopicTemplate,
    createViewTemplate,
    dropExternalTableTemplate,
    dropTopicTemplate,
    dropViewTemplate,
    selectQueryTemplate,
    upsertQueryTemplate,
} from './queryTemplates';

interface ActionsAdditionalEffects {
    setQueryMode: (mode: QueryMode) => void;
    setActivePath: (path: string) => void;
}

const bindActions = (
    path: string,
    dispatch: React.Dispatch<any>,
    additionalEffects: ActionsAdditionalEffects,
) => {
    const {setActivePath, setQueryMode} = additionalEffects;

    const inputQuery = (tmpl: (path: string) => string, mode?: QueryMode) => () => {
        if (mode) {
            setQueryMode(mode);
        }

        dispatch(changeUserInput({input: tmpl(path)}));
        dispatch(setTenantPage(TENANT_PAGES_IDS.query));
        dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
        setActivePath(path);
    };

    return {
        createTable: inputQuery(createTableTemplate, 'script'),
        alterTable: inputQuery(alterTableTemplate, 'script'),
        selectQuery: inputQuery(selectQueryTemplate),
        upsertQuery: inputQuery(upsertQueryTemplate),
        createExternalTable: inputQuery(createExternalTableTemplate, 'script'),
        dropExternalTable: inputQuery(dropExternalTableTemplate, 'script'),
        selectQueryFromExternalTable: inputQuery(selectQueryTemplate, 'query'),
        createTopic: inputQuery(createTopicTemplate, 'script'),
        alterTopic: inputQuery(alterTopicTemplate, 'script'),
        dropTopic: inputQuery(dropTopicTemplate, 'script'),
        createView: inputQuery(createViewTemplate, 'script'),
        dropView: inputQuery(dropViewTemplate, 'script'),
        copyPath: () => {
            try {
                copy(path);
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
    (dispatch: React.Dispatch<any>, additionalEffects: ActionsAdditionalEffects) =>
    (path: string, type: NavigationTreeNodeType) => {
        const actions = bindActions(path, dispatch, additionalEffects);
        const copyItem = {text: i18n('actions.copyPath'), action: actions.copyPath};

        const DIR_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.createTable'), action: actions.createTable},
                {text: i18n('actions.createTopic'), action: actions.createTopic},
                {text: i18n('actions.createView'), action: actions.createView},
            ],
        ];
        const TABLE_SET: ActionsSet = [
            [copyItem],
            [
                {text: i18n('actions.alterTable'), action: actions.alterTable},
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

        const JUST_COPY: ActionsSet = [copyItem];

        // verbose mapping to guarantee a correct actions set for new node types
        // TS will error when a new type is added in the lib but is not mapped here
        const nodeTypeToActions: Record<NavigationTreeNodeType, ActionsSet> = {
            async_replication: JUST_COPY,

            database: DIR_SET,
            directory: DIR_SET,

            table: TABLE_SET,
            column_table: TABLE_SET,

            index_table: JUST_COPY,
            topic: TOPIC_SET,
            stream: JUST_COPY,

            index: JUST_COPY,

            external_table: EXTERNAL_TABLE_SET,
            external_data_source: EXTERNAL_DATA_SOURCE_SET,

            view: VIEW_SET,
        };

        return nodeTypeToActions[type];
    };
