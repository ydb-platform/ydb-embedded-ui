import {useDispatch} from 'react-redux';
import {useHistory} from 'react-router';
import cn from 'bem-cn-lite';
import {DropdownMenu} from '@yandex-cloud/uikit';
import qs from 'qs';

import {changeUserInput} from '../../../../store/reducers/executeQuery';
import {setShowPreview} from '../../../../store/reducers/schema';
import routes, {createHref} from '../../../../routes';

import './SchemaNodeActions.scss';
import {TenantGeneralTabsIds, TenantTabsGroups} from '../../TenantPages';
import createToast from '../../../../utils/createToast';

const b = cn('kv-schema-node-actions');

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

interface SchemaNodeActionsProps {
    name: string;
    isTableType: boolean;
}

function SchemaNodeActions({name, isTableType}: SchemaNodeActionsProps) {
    const dispatch = useDispatch();
    const history = useHistory();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const onCreateTableClick = () => {
        dispatch(changeUserInput({input: createTableTemplate(name)}));
    };

    const onAlterTableClick = () => {
        dispatch(changeUserInput({input: alterTableTemplate(name)}));
    };

    const onSelectQueryClick = () => {
        dispatch(changeUserInput({input: selectQueryTemplate(name)}));
    };

    const onUpsertQueryClick = () => {
        dispatch(changeUserInput({input: upsertQueryTemplate(name)}));
    };

    const onCopyPathClick = () => {
        navigator.clipboard
            .writeText(name)
            .then(() => {
                createToast({
                    name: 'Copied',
                    title: 'Path was copied to clipboard successfully',
                    type: 'success',
                });
            })
            .catch(() => {
                createToast({
                    name: 'Not copied',
                    title: 'Path was not copied to clipboard successfully',
                    type: 'error',
                });
            });
    };

    const onOpenPreviewClick = () => {
        dispatch(setShowPreview(true));
        history.push(
            createHref(routes.tenant, undefined, {
                ...queryParams,
                [TenantTabsGroups.general]: TenantGeneralTabsIds.query,
            }),
        );
    };

    const copyItem = {text: 'Copy path', action: onCopyPathClick};

    const tableItems = [
        [{text: 'Open preview', action: onOpenPreviewClick}, copyItem],
        [
            {text: 'Alter table', action: onAlterTableClick},
            {text: 'Select query', action: onSelectQueryClick},
            {text: 'Upsert query', action: onUpsertQueryClick},
        ],
    ];

    const catalogItems = [[copyItem], [{text: 'Create table', action: onCreateTableClick}]];

    const items = isTableType ? tableItems : catalogItems;

    return (
        <DropdownMenu
            items={items}
            switcherWrapperClassName={b()}
            popupClassName={b('popup')}
            popupPlacement={['bottom-end']}
        />
    );
}

export default SchemaNodeActions;
