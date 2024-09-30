import React from 'react';

import {ArrowToggle, Label, Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';

import './TableGroup.scss';

const b = cn('ydb-table-group');

interface TableGroupProps {
    children?: React.ReactNode;

    title: string;
    entityName: string;
    count: string | number;
    expanded: boolean;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
}

export function TableGroup({
    children,
    title,
    entityName,
    count,
    expanded = false,
    onIsExpandedChange,
}: TableGroupProps) {
    const toggleCollapsed = () => {
        onIsExpandedChange(title, !expanded);
    };

    const renderTitle = () => {
        return (
            <button onClick={toggleCollapsed} className={b('button')} title={title}>
                <div className={b('title-wrapper')}>
                    <ArrowToggle direction={expanded ? 'top' : 'bottom'} />
                    <div className={b('title')}>
                        <Text variant="subheader-2">{title}</Text>
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
            return <div className={b('content')}>{children}</div>;
        }

        return null;
    };

    return (
        <div className={b(null)}>
            {renderTitle()}
            {renderContent()}
        </div>
    );
}
