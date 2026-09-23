import React from 'react';

import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {Button, ClipboardButton, Flex, Icon, Text, Tooltip} from '@gravity-ui/uikit';

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
    const hasValue = value !== undefined && value !== '';
    const text = hasValue ? value : EMPTY_DATA_PLACEHOLDER;
    return (
        <Tooltip content={text} disabled={!hasValue} className={b('text-tooltip')}>
            <span className={b('text')} tabIndex={hasValue ? 0 : undefined}>
                {text}
            </span>
        </Tooltip>
    );
}

export function DiskPopupLocation({items, title}: {items: DiskDetailItem[]; title: string}) {
    const [expanded, setExpanded] = React.useState(false);
    const detailsId = React.useId();
    if (!items.length) {
        return null;
    }
    const hasDetails = items.length > 2;
    const summaryItems = items.slice(0, 2).map((item) =>
        item.id === 'fqdn'
            ? {
                  ...item,
                  content: <DiskPopupText value={item.copyText} />,
              }
            : item,
    );
    const detailItems = items.slice(2).map((item) =>
        item.id === 'pdisk-path' && typeof item.copyText === 'string'
            ? {
                  ...item,
                  content: (
                      <EntityName name={item.copyText} withLeftTrim className={b('pdisk-path')} />
                  ),
              }
            : item,
    );
    return (
        <div className={b('location')}>
            <div className={b('location-summary', {'with-toggle': hasDetails})}>
                <YDBDefinitionList items={summaryItems} nameMaxWidth={100} />
                {hasDetails && (
                    <Button
                        view="flat-secondary"
                        size="xs"
                        className={b('location-toggle')}
                        aria-label={i18n(
                            expanded ? 'action_collapse-details' : 'action_expand-details',
                            {disk: title},
                        )}
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        onClick={() => setExpanded(!expanded)}
                    >
                        <Icon data={expanded ? ChevronUp : ChevronDown} size={12} />
                    </Button>
                )}
            </div>
            {hasDetails && (
                <div id={detailsId} hidden={!expanded} className={b('location-details')}>
                    <YDBDefinitionList items={detailItems} nameMaxWidth={100} />
                </div>
            )}
        </div>
    );
}
