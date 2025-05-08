import React from 'react';

import {Icon} from '@gravity-ui/uikit';
import fill_ from 'lodash/fill';

import {MultiHighlightedText} from '../components/HighlightedText';
import {ToggleCollapseButton} from '../components/ToggleCollapseButton';
import {block} from '../constants';
import i18n from '../i18n';
import type {UnipikaSettings} from '../unipika/StructuredYsonTypes';
import type {BlockType, SearchInfo, UnipikaFlattenTreeItem} from '../unipika/flattenUnipika';
import {defaultUnipikaSettings, unipika} from '../unipika/unipika';
import {getHightLightedClassName} from '../utils';

import ArrowUpRightFromSquareIcon from '@gravity-ui/icons/svgs/arrow-up-right-from-square.svg';

interface CellProps {
    matched: SearchInfo;
    row: UnipikaFlattenTreeItem;
    settings?: UnipikaSettings;
    collapsedState?: {readonly [key: string]: boolean};
    onToggleCollapse: (path: string) => void;
    filter?: string;
    index: number;
    showFullText: (index: number) => void;
    maxValueWidth?: number;
}

export function Cell(props: CellProps) {
    const {
        row: {level, open, close, key, value, hasDelimiter, path, collapsed, depth},
        settings,
        onToggleCollapse,
        matched,
        filter,
        showFullText,
        index,
    } = props;

    const handleToggleCollapse = React.useCallback(() => {
        if (!path) {
            return;
        }
        onToggleCollapse(path);
    }, [path, onToggleCollapse]);

    const handleShowFullText = React.useCallback(() => {
        showFullText(index);
    }, [showFullText, index]);

    return (
        <div className={block('cell', 'unipika')}>
            {getLevelOffsetSpaces(level)}
            {path && (
                <ToggleCollapseButton
                    collapsed={collapsed}
                    path={path}
                    onToggle={handleToggleCollapse}
                />
            )}
            <Key text={key} settings={settings} matched={matched?.keyMatch} filter={filter} />
            {open && <OpenClose type={open} settings={settings} />}
            {depth !== undefined && (
                <span className={'unipika'}>{i18n('context_items-count', {count: depth})}</span>
            )}
            {value !== undefined && (
                <Value
                    text={value}
                    settings={settings}
                    matched={matched?.valueMatch}
                    filter={filter}
                    showFullText={handleShowFullText}
                    maxValueWidth={props.maxValueWidth}
                />
            )}
            {collapsed && depth === undefined && <span className={'unipika'}>...</span>}
            {close && <OpenClose type={close} settings={settings} close />}
            {hasDelimiter && <AdditionalText text={','} />}
        </div>
    );
}

interface KeyProps {
    text: UnipikaFlattenTreeItem['key'] | UnipikaFlattenTreeItem['value'];
    settings?: UnipikaSettings;
    filter?: string;
    matched?: Array<number>;
}

function Key(props: KeyProps) {
    const text: React.ReactNode = renderKeyWithFilter(props);
    return text ? (
        <React.Fragment>
            {text}
            <AdditionalText text={': '} />
        </React.Fragment>
    ) : null;
}

interface ValueProps extends KeyProps {
    showFullText?: () => void;
    maxValueWidth?: number;
}

function Value(props: ValueProps) {
    return (
        <React.Fragment>
            {renderValueWithFilter(props, block('value', {type: props.text?.$type}))}
        </React.Fragment>
    );
}

function renderValueWithFilter(props: ValueProps, className: string) {
    if ('string' === props.text?.$type) {
        return renderStringWithFilter(props, className);
    }
    return renderWithFilter(props, block('value'));
}

function renderStringWithFilter(props: ValueProps, className: string) {
    const {
        text,
        settings = defaultUnipikaSettings,
        matched = [],
        filter,
        showFullText,
        maxValueWidth = Infinity,
    } = props;

    const tmp = unipika.format(text, {...settings, maxStringSize: 10, asHTML: false});
    const length = tmp.length;
    const visible = tmp.substring(1, Math.min(length - 1, maxValueWidth + 1));
    const truncated = visible.length < tmp.length - 2;
    let hasHiddenMatch = false;
    if (truncated) {
        for (let i = matched.length - 1; i >= 0; --i) {
            if (visible.length < matched[i] + (filter?.length || 0)) {
                hasHiddenMatch = true;
                break;
            }
        }
    }
    return (
        <span>
            <MultiHighlightedText
                className={getHightLightedClassName(className)}
                text={visible}
                starts={matched}
                length={filter?.length}
            />
            {truncated && (
                <span
                    className={block('filtered', {
                        highlighted: hasHiddenMatch,
                        clickable: true,
                    })}
                    onClick={showFullText}
                >
                    {'\u2026'}
                    <Icon data={ArrowUpRightFromSquareIcon} />
                </span>
            )}
        </span>
    );
}

function renderKeyWithFilter(props: KeyProps) {
    if (!props?.text) {
        return null;
    }
    return renderStringWithFilter(props, block('key'));
}

function renderWithFilter(props: KeyProps, className: string) {
    const {text, filter, settings, matched} = props;
    let res: React.ReactNode = null;
    if (matched && filter) {
        const tmp = unipika.format(text, {...settings, asHTML: false});
        res = (
            <MultiHighlightedText
                className={getHightLightedClassName(className)}
                text={tmp}
                starts={matched}
                length={filter?.length}
            />
        );
    } else {
        res = text ? formatValue(text, settings) : undefined;
    }
    return res ? res : null;
}

function AdditionalText({text}: {text: string}) {
    return <span>{text}</span>;
}

function OpenClose(props: {type: BlockType; close?: boolean; settings?: UnipikaSettings}) {
    const {type, close} = props;
    switch (type) {
        case 'array':
            return <AdditionalText text={close ? ']' : '['} />;
        case 'object':
            return <AdditionalText text={close ? '}' : '{'} />;
    }
}

function formatValue(
    value: UnipikaFlattenTreeItem['key'] | UnipikaFlattenTreeItem['value'],
    settings: UnipikaSettings = defaultUnipikaSettings,
) {
    const __html = unipika.formatValue(value, {...defaultUnipikaSettings, ...settings}, 0);
    return <span className={'unipika'} dangerouslySetInnerHTML={{__html}} />;
}

const OFFSETS_BY_LEVEL: {[key: number]: React.ReactNode} = {};

function getLevelOffsetSpaces(level: number) {
    let res = OFFSETS_BY_LEVEL[level];
    if (!res) {
        const __html = fill_(Array(level * 3), '&nbsp;').join('');
        res = OFFSETS_BY_LEVEL[level] = <span dangerouslySetInnerHTML={{__html}} />;
    }
    return res;
}
