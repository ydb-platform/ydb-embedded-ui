import React from 'react';

import type {Column, Settings} from '@gravity-ui/react-data-table';
import {Flex, Label} from '@gravity-ui/uikit';
import type {LabelProps} from '@gravity-ui/uikit';

import type {PreparedAccessRights} from '../../types/api/acl';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {ResizeableDataTable} from '../ResizeableDataTable/ResizeableDataTable';
import {SubjectWithAvatar} from '../SubjectWithAvatar/SubjectWithAvatar';
import {TitleWithHelpMark} from '../TitleWithHelpmark/TitleWithHelpmark';

import i18n from './i18n';

import './AccessTable.scss';

const b = cn('ydb-access-table');
const settings: Settings = {...DEFAULT_TABLE_SETTINGS, dynamicRender: false};
const getRowKey = (row: AccessTableRow) => row.subject;
const rowActionButtonProps = {view: 'raised', size: 'm'} as const;

export interface AccessTableRow extends PreparedAccessRights {
    subjectDescription?: string;
}

export interface AccessTableProps<Row extends AccessTableRow = AccessTableRow> {
    data: Row[];
    /** Inserted after Subject. Names must be unique and differ from subject, explicit and effective. */
    additionalColumns?: Column<Row>[];
    /** Titles and initial widths of the standard columns. Saved widths take precedence. */
    columnOptions?: Partial<
        Record<'subject' | 'explicit' | 'effective', Pick<Column<Row>, 'header' | 'width'>>
    >;
    /** Actions inside the Explicit rights cell. Supply accessible names for interactive controls. */
    renderExplicitActions?: (row: Row) => React.ReactNode;
    /** Optional chip themes for the two rights columns. */
    rightsChipTheme?: Partial<Record<'explicit' | 'effective', LabelProps['theme']>>;
    /** Actions at the visible right edge of a row. Supply accessible names for interactive controls. */
    renderRowActions?: (row: Row, buttonProps: typeof rowActionButtonProps) => React.ReactNode;
    /** Use a separate settings key for each table layout. */
    columnsWidthLSKey?: string;
    emptyDataMessage?: string;
    className?: string;
}

/** Uses the application's Redux provider to persist column widths. */
export function AccessTable<Row extends AccessTableRow>({
    data,
    additionalColumns,
    columnOptions,
    renderExplicitActions,
    renderRowActions,
    rightsChipTheme,
    columnsWidthLSKey,
    emptyDataMessage,
    className,
}: AccessTableProps<Row>) {
    const columns = React.useMemo<Column<Row>[]>(
        () => [
            {
                name: 'subject',
                width: columnOptions?.subject?.width ?? 210,
                get header() {
                    return columnOptions?.subject?.header ?? i18n('field_subject');
                },
                render: ({row}) => (
                    <SubjectWithAvatar subject={row.subject} title={row.subjectDescription} />
                ),
            },
            ...(additionalColumns ?? []),
            {
                name: 'explicit',
                width: columnOptions?.explicit?.width ?? 400,
                get header() {
                    return (
                        columnOptions?.explicit?.header ?? (
                            <TitleWithHelpMark
                                header={i18n('field_explicit-rights')}
                                note={i18n('context_explicit-rights')}
                            />
                        )
                    );
                },
                render: ({row}) => (
                    <Flex alignItems="center" className={b('explicit')}>
                        <Rights
                            rights={row.explicit}
                            theme={rightsChipTheme?.explicit ?? 'normal'}
                        />
                        {renderExplicitActions && (
                            <Flex alignItems="center" className={b('actions', {explicit: true})}>
                                {renderExplicitActions(row)}
                            </Flex>
                        )}
                    </Flex>
                ),
                sortable: false,
            },
            {
                name: 'effective',
                width: columnOptions?.effective?.width ?? 400,
                className: renderRowActions ? b('actions-cell') : undefined,
                get header() {
                    return (
                        columnOptions?.effective?.header ?? (
                            <TitleWithHelpMark
                                header={i18n('field_effective-rights')}
                                note={i18n('context_effective-rights')}
                            />
                        )
                    );
                },
                render: ({row}) => (
                    <React.Fragment>
                        {renderRowActions && (
                            <Flex justifyContent="flex-end" className={b('row-actions')}>
                                <Flex className={b('actions', {row: true})}>
                                    {renderRowActions(row, rowActionButtonProps)}
                                </Flex>
                            </Flex>
                        )}
                        <Rights
                            rights={row.effective}
                            theme={rightsChipTheme?.effective ?? 'unknown'}
                        />
                    </React.Fragment>
                ),
                sortable: false,
            },
        ],
        [
            additionalColumns,
            columnOptions,
            renderExplicitActions,
            renderRowActions,
            rightsChipTheme,
        ],
    );

    return (
        <ResizeableDataTable
            columns={columns}
            data={data}
            rowKey={getRowKey}
            getKeyboardRowKey={getRowKey}
            getKeyboardRowLabel={getRowKey}
            settings={settings}
            columnsWidthLSKey={columnsWidthLSKey}
            emptyDataMessage={emptyDataMessage ?? i18n('context_empty-rights')}
            wrapperClassName={b(null, className)}
        />
    );
}

function Rights({rights, theme}: {rights: string[]; theme: LabelProps['theme']}) {
    return (
        <Flex gap={2} wrap="wrap" className={b('rights')}>
            {rights.length
                ? rights.map((right) => (
                      <Label theme={theme} key={right} size="xs">
                          {right}
                      </Label>
                  ))
                : EMPTY_DATA_PLACEHOLDER}
        </Flex>
    );
}
