import React from 'react';

import {ChevronDown, Persons} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {AsyncReplicationIcon, TableIcon, TopicIcon, TransferIcon} from 'ydb-ui-components';

import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {insertSnippetToEditor} from '../../../../utils/monaco/insertSnippet';
import {bindActions} from '../../utils/newSQLQueryActions';

import i18n from './i18n';

export function NewSQL() {
    const insertTemplate = React.useCallback((input: string) => {
        insertSnippetToEditor(input);
    }, []);

    const onTemplateClick = useChangeInputWithConfirmation(insertTemplate);

    const actions = bindActions(onTemplateClick);

    const items: DropdownMenuItem[] = [
        {
            text: i18n('menu.tables'),
            iconStart: <TableIcon />,
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
            iconStart: <TopicIcon />,
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
            iconStart: <AsyncReplicationIcon />,
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
            text: i18n('menu.transfer'),
            iconStart: <TransferIcon />,
            items: [
                {
                    text: i18n('action.create-transfer'),
                    action: actions.createTransfer,
                },
                {
                    text: i18n('action.alter-transfer'),
                    action: actions.alterTransfer,
                },
                {
                    text: i18n('action.drop-transfer'),
                    action: actions.dropTransfer,
                },
            ],
        },
        {
            text: i18n('menu.capture'),
            iconStart: <TopicIcon />,
            items: [
                {
                    text: i18n('action.create-cdc-stream'),
                    action: actions.createCdcStream,
                },
            ],
        },
        {
            text: i18n('menu.users'),
            iconStart: <Persons />,
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
