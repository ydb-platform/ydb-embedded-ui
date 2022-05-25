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

export const getActions = (
    dispatch: Dispatch<any>,
    setActivePath: (path: string) => void,
) =>
    (path: string, type: NavigationTreeNodeType) => {
        const switchTabToQuery = () => {
            dispatch(setTopLevelTab(TenantGeneralTabsIds.query));
        };

        const onCreateTableClick = () => {
            dispatch(changeUserInput({input: createTableTemplate(path)}));
            switchTabToQuery();
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
