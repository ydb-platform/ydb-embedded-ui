import qs from 'qs';
import {Dispatch} from 'react';
import {History} from 'history';
import type {NavigationTreeNodeType} from 'ydb-ui-components';

import routes, {createHref} from '../../../routes';
import {changeUserInput} from '../../../store/reducers/executeQuery';
import {setShowPreview} from '../../../store/reducers/schema';
import createToast from '../../../utils/createToast';
import {TenantGeneralTabsIds, TenantTabsGroups} from '../TenantPages';

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

export const getActions = (
    dispatch: Dispatch<any>,
    history: History<unknown>,
    setActivePath: (path: string) => void,
) =>
    (path: string, type: NavigationTreeNodeType) => {
        const queryParams = qs.parse(location.search, {
            ignoreQueryPrefix: true,
        });

        const switchTabToQuery = () => {
            history.push(
                createHref(routes.tenant, undefined, {
                    ...queryParams,
                    [TenantTabsGroups.general]: TenantGeneralTabsIds.query,
                }),
            );
        };

        const onCreateTableClick = () => {
            dispatch(changeUserInput({input: createTableTemplate(path)}));
            switchTabToQuery();
            // here and in the other handlers this should be called after switching tab:
            // redux-location-state catches the history.push event from the tab switching
            // before active path updates in url, preventing its update at all
            setActivePath(path);
        };

        const onAlterTableClick = () => {
            dispatch(changeUserInput({input: alterTableTemplate(path)}));
            switchTabToQuery();
            setActivePath(path);
        };

        const onSelectQueryClick = () => {
            dispatch(changeUserInput({input: selectQueryTemplate(path)}));
            switchTabToQuery();
            setActivePath(path);
        };

        const onUpsertQueryClick = () => {
            dispatch(changeUserInput({input: upsertQueryTemplate(path)}));
            switchTabToQuery();
            setActivePath(path);
        };

        const onCopyPathClick = () => {
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
        };

        const onOpenPreviewClick = () => {
            dispatch(setShowPreview(true));
            switchTabToQuery();
            setActivePath(path);
        };

        const copyItem = {text: 'Copy path', action: onCopyPathClick};

        return type === 'table'
            ? [
                [
                    {text: 'Open preview', action: onOpenPreviewClick},
                    copyItem,
                ],
                [
                    {text: 'Alter table...', action: onAlterTableClick},
                    {text: 'Select query...', action: onSelectQueryClick},
                    {text: 'Upsert query...', action: onUpsertQueryClick},
                ],
            ]
            : [
                [
                    copyItem,
                ],
                [
                    {text: 'Create table...', action: onCreateTableClick},
                ],
            ];
    };
