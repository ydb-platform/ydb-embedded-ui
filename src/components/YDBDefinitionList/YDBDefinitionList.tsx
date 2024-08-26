import React from 'react';

import type {DefinitionListProps} from '@gravity-ui/components';
import {DefinitionList} from '@gravity-ui/components';

import {cn} from '../../utils/cn';

import i18n from './i18n';

import './YDBDefinitionList.scss';

const b = cn('ydb-definition-list');

interface YDBDefinitionListProps extends DefinitionListProps {
    title?: React.ReactNode;
}

/** DefinitionList with predefined styles and layout */
export function YDBDefinitionList({
    title,
    items,
    nameMaxWidth = 220,
    copyPosition = 'outside',
    className,
    itemClassName,
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
                    items={items}
                    nameMaxWidth={nameMaxWidth}
                    copyPosition={copyPosition}
                    className={b('properties-list', className)}
                    itemClassName={b('item', itemClassName)}
                    {...restProps}
                />
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
