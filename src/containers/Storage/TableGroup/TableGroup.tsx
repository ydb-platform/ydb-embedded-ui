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
    expanded?: boolean;
}

export function TableGroup({
    children,
    title,
    entityName,
    count,
    expanded = false,
}: TableGroupProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    React.useEffect(() => {
        setIsExpanded(expanded);
    }, [expanded]);

    const toggleCollapsed = () => {
        setIsExpanded((value) => !value);
    };

    const renderTitle = () => {
        return (
            <div onClick={toggleCollapsed} className={b('title-wrapper')}>
                <ArrowToggle direction={expanded ? 'top' : 'bottom'} />
                <div className={b('title')}>
                    <Text variant="subheader-2">{title}</Text>
                    <Text variant="body-2" color="secondary" className={b('count')}>
                        {entityName}: <Label theme="normal">{count}</Label>
                    </Text>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (isExpanded) {
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
