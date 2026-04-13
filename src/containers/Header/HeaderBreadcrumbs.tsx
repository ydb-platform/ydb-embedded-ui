import React from 'react';

import {Breadcrumbs} from '@gravity-ui/uikit';

import {BreadcrumbLink} from './BreadcrumbLink';
import {b} from './constants';
import type {BreadcrumbItem} from './hooks/useHeaderBreadcrumbs';

interface HeaderBreadcrumbsProps {
    breadcrumbItems: BreadcrumbItem[];
    endContent?: React.ReactNode;
}

export function HeaderBreadcrumbs({breadcrumbItems, endContent}: HeaderBreadcrumbsProps) {
    return (
        <Breadcrumbs className={b('breadcrumbs')} endContent={endContent}>
            {breadcrumbItems.map((item, index) => {
                const {icon, text, link} = item;
                const isLast = index === breadcrumbItems.length - 1;

                return (
                    <Breadcrumbs.Item
                        key={index}
                        className={b('breadcrumbs-item', {active: isLast})}
                        disabled={isLast}
                    >
                        <BreadcrumbLink icon={icon} text={text} link={isLast ? undefined : link} />
                    </Breadcrumbs.Item>
                );
            })}
        </Breadcrumbs>
    );
}
