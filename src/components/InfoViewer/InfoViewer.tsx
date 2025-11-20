import React from 'react';

import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import i18n from './i18n';

import './InfoViewer.scss';

export interface InfoViewerItem {
    label: React.ReactNode;
    value: React.ReactNode;
}

export interface InfoViewerHeaderLabel {
    value: React.ReactNode;
    icon?: IconData;
    theme?: LabelProps['theme'];
}

export interface InfoViewerProps {
    title?: React.ReactNode;
    titleSuffix?: React.ReactNode;
    separator?: React.ReactNode;
    info?: InfoViewerItem[];
    dots?: boolean;
    size?: 's';
    variant?: 'default' | 'small';
    className?: string;
    multilineLabels?: boolean;
    renderEmptyState?: (props?: Pick<InfoViewerProps, 'title' | 'size'>) => React.ReactNode;
    headerLabels?: InfoViewerHeaderLabel[];
}

const b = cn('info-viewer');

export const InfoViewer = ({
    title,
    titleSuffix,
    separator = '•',
    info,
    dots = true,
    size,
    variant = 'default',
    className,
    multilineLabels,
    renderEmptyState,
    headerLabels,
}: InfoViewerProps) => {
    if ((!info || !info.length) && renderEmptyState) {
        return <React.Fragment>{renderEmptyState({title, size})}</React.Fragment>;
    }

    return (
        <div className={b({size, variant}, className)}>
            <Flex
                className={b('header')}
                justifyContent="space-between"
                gap={2}
                alignItems="center"
            >
                {title && (
                    <Flex gap="1" alignItems="center">
                        <div className={b('title')}>{title}</div>
                        {titleSuffix && (
                            <React.Fragment>
                                <div className={b('title-suffix')}>{separator}</div>
                                <div className={b('title-suffix')}>{titleSuffix}</div>
                            </React.Fragment>
                        )}
                    </Flex>
                )}
                {headerLabels && headerLabels.length > 0 && (
                    <Flex gap={1} alignItems="center">
                        {headerLabels.map((label, index) => (
                            <Label key={index} theme={label.theme}>
                                <Flex gap="1" alignItems="center">
                                    {label.icon && <Icon data={label.icon} size={12} />}
                                    <span>{label.value}</span>
                                </Flex>
                            </Label>
                        ))}
                    </Flex>
                )}
            </Flex>
            {info && info.length > 0 ? (
                <div className={b('items')}>
                    {info.map((data, infoIndex) => (
                        <div className={b('row')} key={infoIndex}>
                            {data.label && (
                                <div className={b('label')}>
                                    <div className={b('label-text', {multiline: multilineLabels})}>
                                        {data.label}
                                    </div>
                                    {dots && <div className={b('dots')} />}
                                </div>
                            )}

                            <div className={b('value')}>{data.value}</div>
                        </div>
                    ))}
                </div>
            ) : (
                i18n('no-data')
            )}
        </div>
    );
};
