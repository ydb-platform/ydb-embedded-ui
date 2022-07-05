import {Dispatch} from 'react';
import type {NavigationTreeNodeType} from 'ydb-ui-components';

import {changeUserInput} from '../../../store/reducers/executeQuery';
import {setShowPreview} from '../../../store/reducers/schema';
import {setTopLevelTab} from '../../../store/reducers/tenant';
import createToast from '../../../utils/createToast';
import {TenantGeneralTabsIds} from '../TenantPages';

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
    return `SELECT \`id\`, \`name\`
    FROM \`${path}\`
    ORDER BY \`id\`
    LIMIT 10;`;
};
const upsertQueryTemplate = (path: string) => {
    return `UPSERT INTO \`${path}\`
    ( \`id\`, \`name\` )
VALUES ( );`;
};

const bindActions = (
    path: string,
    dispatch: Dispatch<any>,
    setActivePath: (path: string) => void,
) => {
    const inputQuery = (tmpl: (path: string) => string) => () => {
        dispatch(changeUserInput({input: tmpl(path)}));
        dispatch(setTopLevelTab(TenantGeneralTabsIds.query))
        setActivePath(path);
    }

    return {
        createTable: inputQuery(createTableTemplate),
        alterTable: inputQuery(alterTableTemplate),
        selectQuery: inputQuery(selectQueryTemplate),
        upsertQuery: inputQuery(upsertQueryTemplate),
        copyPath: () => {
            navigator.clipboard
                .writeText(path)
                .then(() => {
                    createToast({
                        name: 'Copied',
                        title: 'The path is copied to the clipboard',
                        type: 'success',
                    });
                })
                .catch(() => {
                    createToast({
                        name: 'Not copied',
                        title: 'Couldn’t copy the path',
                        type: 'error',
                    });
                });
        },
        openPreview: () => {
            dispatch(setShowPreview(true));
            dispatch(setTopLevelTab(TenantGeneralTabsIds.query))
            setActivePath(path);
        },
    };
};

export const getActions = (
    dispatch: Dispatch<any>,
    setActivePath: (path: string) => void,
) =>
    (path: string, type: NavigationTreeNodeType) => {
        const actions = bindActions(path, dispatch, setActivePath);
        const copyItem = {text: 'Copy path', action: actions.copyPath};

        switch (type) {
            case 'database':
            case 'directory':
                return [
                    [
                        copyItem,
                    ],
                    [
                        {text: 'Create table...', action: actions.createTable},
                    ],
                ];
            case 'table':
                return [
                    [
                        {text: 'Open preview', action: actions.openPreview},
                        copyItem,
                    ],
                    [
                        {text: 'Alter table...', action: actions.alterTable},
                        {text: 'Select query...', action: actions.selectQuery},
                        {text: 'Upsert query...', action: actions.upsertQuery},
                    ],
                ];
            case 'index_table':
                return [
                    copyItem,
                ];
            case 'index':
            default:
                return [];
        }
    };
