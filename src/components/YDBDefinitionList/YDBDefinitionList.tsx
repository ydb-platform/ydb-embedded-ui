import React from 'react';

import type {DefinitionListProps, IconData, LabelProps} from '@gravity-ui/uikit';
import {DefinitionList, Flex, Icon, Label} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import i18n from './i18n';

import './YDBDefinitionList.scss';

const b = cn('ydb-definition-list');

export type YDBDefinitionListItem = {
    name: string;
    content: React.ReactNode;
    copyText?: string | number;
};

export interface YDBDefinitionListHeaderLabel {
    id: string;
    value: React.ReactNode;
    icon?: IconData;
    theme?: LabelProps['theme'];
}

interface YDBDefinitionListProps extends Omit<DefinitionListProps, 'children' | 'nameMaxWidth'> {
    title?: React.ReactNode;
    titleSuffix?: React.ReactNode;
    titleSeparator?: React.ReactNode;
    titleClassname?: string;
    items: YDBDefinitionListItem[];
    headerLabels?: YDBDefinitionListHeaderLabel[];
    iconSize?: number;
    labelSize?: LabelProps['size'];
    footer?: React.ReactNode;
    compact?: boolean;
    nameMaxWidth?: DefinitionListProps['nameMaxWidth'] | 'auto';
}

/** DefinitionList with predefined styles and layout */
export function YDBDefinitionList({
    title,
    titleSuffix,
    titleSeparator = '•',
    headerLabels,
    iconSize = 12,
    labelSize = 'xs',
    footer,
    items,
    compact,
    nameMaxWidth = 220,
    className,
    titleClassname,
    ...restProps
}: YDBDefinitionListProps) {
    const hasHeader = Boolean(title || titleSuffix || (headerLabels && headerLabels.length));

    const renderHeader = () => {
        if (!hasHeader) {
            return null;
        }

        return (
            <Flex
                className={b('header')}
                justifyContent="space-between"
                gap={2}
                alignItems="center"
            >
                {title && (
                    <Flex gap="1" alignItems="center">
                        <div className={b('title', titleClassname)}>{title}</div>
                        {titleSuffix && (
                            <React.Fragment>
                                <div className={b('title-suffix')}>{titleSeparator}</div>
                                <div className={b('title-suffix')}>{titleSuffix}</div>
                            </React.Fragment>
                        )}
                    </Flex>
                )}
                {headerLabels && headerLabels.length > 0 && (
                    <Flex gap={1} alignItems="center">
                        {headerLabels.map((label) => (
                            <Label
                                key={label.id}
                                theme={label.theme}
                                icon={
                                    label.icon ? (
                                        <Icon data={label.icon} size={iconSize} />
                                    ) : undefined
                                }
                                size={labelSize}
                            >
                                {label.value}
                            </Label>
                        ))}
                    </Flex>
                )}
            </Flex>
        );
    };

    const renderContent = () => {
        if (items.length) {
            const definitionListProps =
                nameMaxWidth === 'auto' ? restProps : {...restProps, nameMaxWidth};

            return (
                <DefinitionList
                    className={b('properties-list', className)}
                    {...definitionListProps}
                >
                    {items.map((item) => {
                        const {name, content, copyText, ...rest} = item;
                        let normalizedCopyText: string | undefined;
                        if (typeof copyText === 'string') {
                            normalizedCopyText = copyText || undefined;
                        } else if (typeof copyText === 'number') {
                            normalizedCopyText = String(copyText);
                        }
                        return (
                            <DefinitionList.Item
                                key={name}
                                name={name}
                                children={content}
                                copyText={normalizedCopyText}
                                {...rest}
                            />
                        );
                    })}
                </DefinitionList>
            );
        }

        return i18n('no-data');
    };

    const renderFooter = () => {
        if (!footer) {
            return null;
        }

        return <div className={b('footer')}>{footer}</div>;
    };

    return (
        <div className={b({compact})}>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
        </div>
    );
}
