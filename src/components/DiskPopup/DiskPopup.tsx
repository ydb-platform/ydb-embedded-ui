import React from 'react';

import {ClipboardButton, Flex, Text, Tooltip} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {DiskTypeLabel} from '../DiskStatus/DiskStatus';
import {EntityName} from '../EntityName/EntityName';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import i18n from './i18n';

import './DiskPopup.scss';

const b = cn('ydb-disk-popup');

export function DiskPopup({
    children,
    combined = false,
    className,
}: {
    children: React.ReactNode;
    combined?: boolean;
    className?: string;
}) {
    return <div className={b({combined}, className)}>{children}</div>;
}

export function DiskPopupPanel({
    children,
    footer,
}: {
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    return (
        <div className={b('panel')}>
            <div className={b('body')}>{children}</div>
            {footer && <div className={b('footer')}>{footer}</div>}
        </div>
    );
}

export function DiskPopupHeader({
    title,
    id,
    type,
    statuses,
}: {
    title: string;
    id?: string;
    type?: string;
    statuses: React.ReactNode;
}) {
    return (
        <React.Fragment>
            <Flex gap={1} alignItems="center" wrap="wrap">
                <Text variant="subheader-2">{title}</Text>
                <Text color="secondary">•</Text>
                <Text variant="body-2" color="secondary" className={b('id')}>
                    {id || EMPTY_DATA_PLACEHOLDER}
                </Text>
                {id && (
                    <ClipboardButton
                        text={id}
                        size="s"
                        view="flat-secondary"
                        aria-label={i18n('action_copy-field', {field: title})}
                    />
                )}
                <DiskTypeLabel type={type} size="xs" />
            </Flex>
            <Flex gap={1} wrap="wrap" alignItems="center">
                {statuses}
            </Flex>
        </React.Fragment>
    );
}

export function DiskPopupText({value}: {value?: string | number}) {
    const hasValue = !isNil(value) && value !== '';
    const text = hasValue ? value : EMPTY_DATA_PLACEHOLDER;
    return (
        <Tooltip content={text} disabled={!hasValue} className={b('text-tooltip')}>
            <span className={b('text')} tabIndex={hasValue ? 0 : undefined}>
                {text}
            </span>
        </Tooltip>
    );
}

export function DiskPopupLocation({items}: {items: DiskDetailItem[]}) {
    if (!items.length) {
        return null;
    }
    const locationItems = items.map((item) => {
        if (item.id === 'fqdn') {
            return {...item, content: <DiskPopupText value={item.copyText} />};
        }
        if (item.id === 'pdisk-path' && typeof item.copyText === 'string') {
            return {
                ...item,
                content: (
                    <EntityName name={item.copyText} withLeftTrim className={b('pdisk-path')} />
                ),
            };
        }
        return item;
    });
    return (
        <div className={b('location')}>
            <YDBDefinitionList items={locationItems} nameMaxWidth={100} />
        </div>
    );
}
