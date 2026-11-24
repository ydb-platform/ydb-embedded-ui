import React from 'react';

import {ArrowToggle, Label, Text} from '@gravity-ui/uikit';

import {TableKeyboardNavigationGroupContext} from '../../../components/TableKeyboardNavigation/TableKeyboardNavigation';
import {cn} from '../../../utils/cn';

import './TableGroup.scss';

const b = cn('ydb-table-group');

interface TableGroupProps {
    children?: React.ReactNode;

    groupId?: string;
    title: string;
    titleContent?: React.ReactNode;
    entityName: string;
    count: string | number;
    expanded: boolean;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
}

export const TableGroup = ({
    children,
    title,
    titleContent,
    groupId = title,
    entityName,
    count,
    expanded = false,
    onIsExpandedChange,
}: TableGroupProps) => {
    const toggleCollapsed = () => {
        onIsExpandedChange(groupId, !expanded);
    };

    const renderTitle = () => {
        return (
            <button aria-expanded={expanded} onClick={toggleCollapsed} className={b('button')}>
                <div className={b('title-wrapper')}>
                    <ArrowToggle direction={expanded ? 'top' : 'bottom'} />
                    <div className={b('title')}>
                        {titleContent ?? <Text variant="subheader-2">{title}</Text>}
                        <Text variant="body-2" color="secondary" className={b('count')}>
                            {entityName}: <Label theme="normal">{count}</Label>
                        </Text>
                    </div>
                </div>
            </button>
        );
    };

    const renderContent = () => {
        if (expanded) {
            return (
                <TableKeyboardNavigationGroupContext.Provider value={title}>
                    <div className={b('content')}>{children}</div>
                </TableKeyboardNavigationGroupContext.Provider>
            );
        }

        return null;
    };

    return (
        <div className={b(null)}>
            {renderTitle()}
            {renderContent()}
        </div>
    );
};

TableGroup.displayName = 'TableGroup';
