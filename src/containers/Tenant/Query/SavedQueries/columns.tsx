import {FontCursor, TrashBin} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
import {ActionTooltip, Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import {YDBSyntaxHighlighter} from '../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import type {SavedQuery} from '../../../../types/store/query';
import {BRAND_BUTTON_CLASS, EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import i18n from '../i18n';
import {getQueryPreviewText} from '../utils/queryPreview';
import {formatSavedQueryUpdatedAt} from '../utils/savedQueries';

import {b} from './shared';

type SavedQueryActions = {
    deleteQuery: (queryName: string) => void;
    openInEditor: (query: SavedQuery) => void;
    renameQuery: (queryName: string) => void;
};

export function getColumns({deleteQuery, openInEditor, renameQuery}: SavedQueryActions) {
    const columns: Column<SavedQuery>[] = [
        {
            name: 'name',
            header: i18n('field_saved-query-name'),
            render: ({row}) => (
                <Text variant="body-1" as="div" className={b('query-name')}>
                    {row.name || EMPTY_DATA_PLACEHOLDER}
                </Text>
            ),
            width: 220,
            sortable: false,
        },
        {
            name: 'updatedAt',
            header: i18n('field_saved-query-edited-at'),
            render: ({row}) => (
                <Text variant="body-1" as="div" className={b('edited')}>
                    {formatSavedQueryUpdatedAt(row.updatedAt)}
                </Text>
            ),
            width: 180,
            sortable: false,
        },
        {
            name: 'body',
            header: i18n('field_query-text'),
            render: ({row}) => (
                <YDBSyntaxHighlighter
                    language="yql"
                    className={b('query')}
                    text={getQueryPreviewText(row.body) || EMPTY_DATA_PLACEHOLDER}
                />
            ),
            sortable: false,
            width: 600,
        },
        {
            name: 'actions',
            header: '',
            render: ({row}) => (
                <Flex className={b('actions')} gap={2}>
                    <ActionTooltip title={i18n('action_rename-query')}>
                        <Button
                            qa="rename-saved-query-button"
                            view="flat-secondary"
                            onClick={(event) => {
                                event.stopPropagation();
                                renameQuery(row.name);
                            }}
                            aria-label={i18n('action_rename-query')}
                        >
                            <Icon data={FontCursor} />
                        </Button>
                    </ActionTooltip>
                    <Button
                        qa="edit-saved-query-button"
                        view="action"
                        className={BRAND_BUTTON_CLASS}
                        onClick={(event) => {
                            event.stopPropagation();
                            openInEditor(row);
                        }}
                    >
                        {i18n('action_edit-query')}
                    </Button>
                    <ActionTooltip title={i18n('action_delete-query')}>
                        <Button
                            qa="delete-saved-query-button"
                            view="flat-secondary"
                            onClick={(event) => {
                                event.stopPropagation();
                                deleteQuery(row.name);
                            }}
                            aria-label={i18n('action_delete-query')}
                        >
                            <Icon data={TrashBin} />
                        </Button>
                    </ActionTooltip>
                </Flex>
            ),
            sortable: false,
            resizeable: false,
            width: 136,
        },
    ];

    return columns;
}
