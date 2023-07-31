import {Dispatch} from 'react';
import copy from 'copy-to-clipboard';

import type {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';

import type {QueryMode} from '../../../types/store/query';
import {changeUserInput} from '../../../store/reducers/executeQuery';
import {setShowPreview} from '../../../store/reducers/schema/schema';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {TENANT_QUERY_TABS_ID, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import createToast from '../../../utils/createToast';

import i18n from '../i18n';

const createTableTemplate = (path: string) => {
    return `CREATE TABLE \`${path}/my_table\`
(
    \`id\` Uint64,
    \`name\` String,
    PRIMARY KEY (\`id\`)
);`;
};
const alterTableTemplate = (path: string) => {
    return `ALTER TABLE \`${path}\`
    ADD COLUMN is_deleted Bool;`;
};
const selectQueryTemplate = (path: string) => {
    return `SELECT *
    FROM \`${path}\`
    LIMIT 10;`;
};
const upsertQueryTemplate = (path: string) => {
    return `UPSERT INTO \`${path}\`
    ( \`id\`, \`name\` )
VALUES ( );`;
};

interface ActionsOptions {
    enableAdditionalQueryModes?: boolean;
    setQueryMode?: (mode: QueryMode) => void;
}

const bindActions = (
    path: string,
    dispatch: Dispatch<any>,
    setActivePath: (path: string) => void,
    options?: ActionsOptions,
) => {
    const inputQuery = (tmpl: (path: string) => string, mode?: QueryMode) => () => {
        if (mode) {
            options?.setQueryMode?.(mode);
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
        selectQueryFromExternalTable: () => {
            if (options?.enableAdditionalQueryModes) {
                inputQuery(selectQueryTemplate, 'query')();
            } else {
                createToast({
                    name: 'ExternalTableSelectUnavailable',
                    title: i18n('actions.externalTableSelectUnavailable'),
                    type: 'error',
                });
            }
        },
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
        openPreview: () => {
            dispatch(setShowPreview(true));
            dispatch(setTenantPage(TENANT_PAGES_IDS.query));
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
            setActivePath(path);
        },
    };
};

type ActionsSet = ReturnType<Required<NavigationTreeProps>['getActions']>;

export const getActions =
    (dispatch: Dispatch<any>, setActivePath: (path: string) => void, options?: ActionsOptions) =>
    (path: string, type: NavigationTreeNodeType) => {
        const actions = bindActions(path, dispatch, setActivePath, options);
        const copyItem = {text: 'Copy path', action: actions.copyPath};
        const openPreview = {text: 'Open preview', action: actions.openPreview};

        const DIR_SET: ActionsSet = [
            [copyItem],
            [{text: 'Create table...', action: actions.createTable}],
        ];
        const TABLE_SET: ActionsSet = [
            [openPreview, copyItem],
            [
                {text: 'Alter table...', action: actions.alterTable},
                {text: 'Select query...', action: actions.selectQuery},
                {text: 'Upsert query...', action: actions.upsertQuery},
            ],
        ];

        const EXTERNAL_TABLE_SET = [
            [openPreview, copyItem],
            [
                {
                    text: 'Select query...',
                    action: actions.selectQueryFromExternalTable,
                },
            ],
        ];

        const JUST_COPY: ActionsSet = [copyItem];

        // verbose mapping to guarantee a correct actions set for new node types
        // TS will error when a new type is added in the lib but is not mapped here
        const nodeTypeToActions: Record<NavigationTreeNodeType, ActionsSet> = {
            database: DIR_SET,
            directory: DIR_SET,

            table: TABLE_SET,
            column_table: TABLE_SET,

            index_table: JUST_COPY,
            topic: JUST_COPY,

            index: JUST_COPY,

            external_table: EXTERNAL_TABLE_SET,
            external_data_source: JUST_COPY,
        };

        return nodeTypeToActions[type];
    };
