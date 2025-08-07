import React from 'react';

import type {DefinitionListProps} from '@gravity-ui/uikit';
import {DefinitionList} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import i18n from './i18n';

import './YDBDefinitionList.scss';

const b = cn('ydb-definition-list');

export type YDBDefinitionListItem = {name: string; content: React.ReactNode; copyText?: string};

interface YDBDefinitionListProps extends Omit<DefinitionListProps, 'children'> {
    title?: React.ReactNode;
    items: YDBDefinitionListItem[];
}

/** DefinitionList with predefined styles and layout */
export function YDBDefinitionList({
    title,
    items,
    nameMaxWidth = 220,
    className,
    ...restProps
}: YDBDefinitionListProps) {
    const renderTitle = () => {
        if (title) {
            return <div className={b('title')}>{title}</div>;
        }
        return null;
    };

    const renderContent = () => {
        if (items.length) {
            return (
                <DefinitionList
                    nameMaxWidth={nameMaxWidth}
                    className={b('properties-list', className)}
                    {...restProps}
                >
                    {items.map((item) => (
                        <DefinitionList.Item key={item.name} children={item.content} {...item} />
                    ))}
                </DefinitionList>
            );
        }

        return i18n('no-data');
    };

    return (
        <div className={b(null)}>
            {renderTitle()}
            {renderContent()}
        </div>
    );
}
