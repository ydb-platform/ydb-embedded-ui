import React from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import {Button, DropdownMenu} from '@gravity-ui/uikit';

import {changeUserInput} from '../../../../store/reducers/executeQuery';
import {useTypedDispatch} from '../../../../utils/hooks';
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {bindActions} from '../../utils/newSQLQueryActions';

import i18n from './i18n';

export function NewSQL() {
    const dispatch = useTypedDispatch();

    const insertTemplate = React.useCallback(
        (input: string) => {
            dispatch(changeUserInput({input}));
        },
        [dispatch],
    );

    const onTemplateClick = useChangeInputWithConfirmation(insertTemplate);

    const actions = bindActions(onTemplateClick);

    const items = [
        {
            text: i18n('menu.tables'),
            items: [
                {
                    text: i18n('action.create-row-table'),
                    action: actions.createRowTable,
                },
                {
                    text: i18n('action.create-column-table'),
                    action: actions.createColumnTable,
                },
                {
                    text: i18n('action.create-external-table'),
                    action: actions.createExternalTable,
                },
                {
                    text: i18n('action.upsert-to-table'),
                    action: actions.upsertQuery,
                },
                {
                    text: i18n('action.update-table'),
                    action: actions.updateTable,
                },
                {
                    text: i18n('action.alter-table'),
                    action: actions.alterTable,
                },
                {
                    text: i18n('action.select-rows'),
                    action: actions.selectQuery,
                },
                {
                    text: i18n('action.select-from-external-table'),
                    action: actions.selectQueryFromExternalTable,
                },
                {
                    text: i18n('action.delete-rows'),
                    action: actions.deleteRows,
                },
                {
                    text: i18n('action.drop-table'),
                    action: actions.dropTable,
                },
                {
                    text: i18n('action.drop-external-table'),
                    action: actions.dropExternalTable,
                },
                {
                    text: i18n('action.add-index'),
                    action: actions.addTableIndex,
                },
                {
                    text: i18n('action.drop-index'),
                    action: actions.dropTableIndex,
                },
            ],
        },
        {
            text: i18n('menu.topics'),
            items: [
                {
                    text: i18n('action.create-topic'),
                    action: actions.createTopic,
                },
                {
                    text: i18n('action.alter-topic'),
                    action: actions.alterTopic,
                },
                {
                    text: i18n('action.drop-topic'),
                    action: actions.dropTopic,
                },
            ],
        },
        {
            text: i18n('menu.replication'),
            items: [
                {
                    text: i18n('action.create-async-replication'),
                    action: actions.createAsyncReplication,
                },
                {
                    text: i18n('action.alter-async-replication'),
                    action: actions.alterAsyncReplication,
                },
                {
                    text: i18n('action.drop-async-replication'),
                    action: actions.dropAsyncReplication,
                },
            ],
        },
        {
            text: i18n('menu.capture'),
            items: [
                {
                    text: i18n('action.create-cdc-stream'),
                    action: actions.createCdcStream,
                },
            ],
        },
        {
            text: i18n('menu.users'),
            items: [
                {
                    text: i18n('action.create-user'),
                    action: actions.createUser,
                },
                {
                    text: i18n('action.create-group'),
                    action: actions.createGroup,
                },
                {
                    text: i18n('action.drop-user'),
                    action: actions.dropUser,
                },
                {
                    text: i18n('action.drop-group'),
                    action: actions.dropGroup,
                },
                {
                    text: i18n('action.grant-privilege'),
                    action: actions.grantPrivilege,
                },
                {
                    text: i18n('action.revoke-privilege'),
                    action: actions.revokePrivilege,
                },
            ],
        },
    ];

    return (
        <DropdownMenu
            items={items}
            renderSwitcher={(props) => (
                <Button {...props}>
                    {i18n('button.new-sql')}
                    <Button.Icon>
                        <ChevronDown />
                    </Button.Icon>
                </Button>
            )}
            popupProps={{placement: 'top'}}
        />
    );
}
