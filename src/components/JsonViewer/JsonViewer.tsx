import React from 'react';

import type * as DT100 from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {ActionTooltip, Button, Flex, Icon} from '@gravity-ui/uikit';
import fill_ from 'lodash/fill';

import {CASE_SENSITIVE_JSON_SEARCH} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {Filter} from './components/Filter';
import {FullValueDialog} from './components/FullValueDialog';
import {MultiHighlightedText} from './components/HighlightedText';
import {block} from './constants';
import i18n from './i18n';
import type {UnipikaSettings, UnipikaValue} from './unipika/StructuredYsonTypes';
import {flattenUnipika} from './unipika/flattenUnipika';
import type {
    BlockType,
    CollapsedState,
    FlattenUnipikaResult,
    SearchInfo,
    UnipikaFlattenTreeItem,
} from './unipika/flattenUnipika';
import {defaultUnipikaSettings, unipika} from './unipika/unipika';
import {getHightLightedClassName} from './utils';

import ArrowDownToLineIcon from '@gravity-ui/icons/svgs/arrow-down-to-line.svg';
import ArrowUpFromLineIcon from '@gravity-ui/icons/svgs/arrow-up-from-line.svg';
import ArrowUpRightFromSquareIcon from '@gravity-ui/icons/svgs/arrow-up-right-from-square.svg';

import './JsonViewer.scss';

interface JsonViewerProps {
    value: UnipikaValue;
    unipikaSettings?: UnipikaSettings;
    extraTools?: React.ReactNode;
    tableSettings?: DT100.Settings;
    search?: boolean;
    collapsedInitially?: boolean;
}

interface State {
    flattenResult: FlattenUnipikaResult;
    value: JsonViewerProps['value'];
    collapsedState: CollapsedState;
    filter: string;
    matchIndex: number;
    matchedRows: Array<number>;
    fullValue?: {
        value: UnipikaFlattenTreeItem['value'];
        searchInfo?: SearchInfo;
    };
}

const SETTINGS: DT100.Settings = {
    displayIndices: false,
    dynamicRender: true,
    sortable: false,
    dynamicRenderMinSize: 100,
};

function getCollapsedState(value: UnipikaValue) {
    const {data} = flattenUnipika(value);
    const collapsedState = data.reduce<CollapsedState>((acc, {path}) => {
        if (path) {
            acc[path] = true;
        }
        return acc;
    }, {});
    return collapsedState;
}

function calculateState(
    value: UnipikaValue,
    collapsedState: CollapsedState,
    filter: string,
    caseSensitive?: boolean,
) {
    const flattenResult = flattenUnipika(value, {
        collapsedState: collapsedState,
        filter,
        caseSensitive,
    });

    return Object.assign(
        {},
        {
            flattenResult,
            matchedRows: Object.keys(flattenResult.searchIndex).map(Number),
        },
    );
}

export function JsonViewer({
    tableSettings,
    value,
    unipikaSettings,
    search = true,
    extraTools,
    collapsedInitially,
}: JsonViewerProps) {
    const [caseSensitiveSearch] = useSetting(CASE_SENSITIVE_JSON_SEARCH, false);

    const [collapsedState, setCollapsedState] = React.useState<CollapsedState>(() => {
        if (collapsedInitially) {
            return getCollapsedState(value);
        }
        return {};
    });
    const [filter, setFilter] = React.useState('');
    const [state, setState] = React.useState<{
        flattenResult: FlattenUnipikaResult;
        matchedRows: Array<number>;
    }>(() => calculateState(value, collapsedState, filter, caseSensitiveSearch));

    const [matchIndex, setMatchIndex] = React.useState(-1);
    const [fullValue, setFullValue] = React.useState<{
        value: UnipikaFlattenTreeItem['value'];
        searchInfo?: SearchInfo;
    }>();

    const dataTable = React.useRef<DT100.DynamicInnerRefT>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);

    const normalizedTableSettings = React.useMemo(() => {
        return {
            ...SETTINGS,
            dynamicInnerRef: dataTable,
            ...tableSettings,
        };
    }, [tableSettings]);

    const renderCell = ({row, index}: {row: UnipikaFlattenTreeItem; index: number}) => {
        const {
            flattenResult: {searchIndex},
        } = state;
        return (
            <Cell
                matched={searchIndex[index]}
                row={row}
                settings={unipikaSettings}
                onToggleCollapse={onTogglePathCollapse}
                filter={filter}
                showFullText={onShowFullText}
                index={index}
            />
        );
    };

    const onTogglePathCollapse = (path: string) => {
        const newCollapsedState = {...collapsedState};
        if (newCollapsedState[path]) {
            delete newCollapsedState[path];
        } else {
            newCollapsedState[path] = true;
        }
        updateState({collapsedState: newCollapsedState});
    };

    const updateState = (
        changedState: Partial<Pick<State, 'collapsedState' | 'filter' | 'matchIndex'>>,
        cb?: () => void,
    ) => {
        const {
            collapsedState: newCollapsedState,
            matchIndex: newMatchIndex,
            filter: newFilter,
        } = changedState;

        if (newCollapsedState !== undefined) {
            setCollapsedState(newCollapsedState);
        }
        if (newMatchIndex !== undefined) {
            setMatchIndex(newMatchIndex);
        }
        if (newFilter !== undefined) {
            setFilter(newFilter);
        }
        setState(calculateState(value, newCollapsedState ?? collapsedState, newFilter ?? filter));

        cb?.();
    };

    const renderTable = () => {
        const columns: Array<DT100.Column<UnipikaFlattenTreeItem>> = [
            {
                name: 'content',
                render: renderCell,
                header: null,
            },
        ];

        const {
            flattenResult: {data},
        } = state;

        return (
            <div className={block('content')}>
                <DataTable
                    columns={columns}
                    data={data}
                    theme={'yson'}
                    settings={normalizedTableSettings}
                    rowClassName={rowClassName}
                />
            </div>
        );
    };

    const rowClassName = ({key}: UnipikaFlattenTreeItem) => {
        const k = key?.$decoded_value ?? '';
        return block('row', {key: asModifier(k)});
    };

    const onExpandAll = () => {
        updateState({collapsedState: {}}, () => {
            onNextMatch(null, 0);
        });
    };

    const onCollapseAll = () => {
        const collapsedState = getCollapsedState(value);
        updateState({collapsedState});
    };

    const onFilterChange = (filter: string) => {
        updateState({filter, matchIndex: 0}, () => {
            onNextMatch(null, 0);
        });
    };

    const onNextMatch = (_event: unknown, diff = 1) => {
        const {matchedRows} = state;
        if (!matchedRows.length) {
            return;
        }

        let index = (matchIndex + diff) % matchedRows.length;
        if (index < 0) {
            index = matchedRows.length + index;
        }

        if (index !== matchIndex) {
            setMatchIndex(index);
        }
        dataTable.current?.scrollTo(matchedRows[index] - 6);
        searchRef.current?.focus();
    };

    const onPrevMatch = () => {
        onNextMatch(null, -1);
    };

    const onEnterKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter') {
            return;
        }
        if (e.shiftKey || e.ctrlKey) {
            onPrevMatch();
        } else {
            onNextMatch(null);
        }
    };

    const renderToolbar = () => {
        return (
            <Flex gap={2} wrap="nowrap" className={block('toolbar')}>
                <Flex gap={1} wrap="nowrap">
                    <ActionTooltip title={i18n('action_expand-all')}>
                        <Button onClick={onExpandAll}>
                            <Icon data={ArrowDownToLineIcon} />
                        </Button>
                    </ActionTooltip>
                    <ActionTooltip title={i18n('action_collapse-all')}>
                        <Button onClick={onCollapseAll}>
                            <Icon data={ArrowUpFromLineIcon} />
                        </Button>
                    </ActionTooltip>
                </Flex>
                {search && (
                    <Filter
                        onUpdate={onFilterChange}
                        matchIndex={matchIndex}
                        matchedRows={state.matchedRows}
                        value={filter}
                        ref={searchRef}
                        onKeyDown={onEnterKeyDown}
                        onNextMatch={onNextMatch}
                        onPrevMatch={onPrevMatch}
                    />
                )}
                <span className={block('extra-tools')}>{extraTools}</span>
            </Flex>
        );
    };

    const onShowFullText = (index: number) => {
        const {
            flattenResult: {searchIndex, data},
        } = state;

        setFullValue({
            value: data[index].value,
            searchInfo: searchIndex[index],
        });
    };

    const onHideFullValue = () => {
        setFullValue(undefined);
    };

    const renderFullValueModal = () => {
        const {value, searchInfo} = fullValue ?? {};

        const tmp = unipika.format(value, {...unipikaSettings, asHTML: false});

        return (
            value && (
                <FullValueDialog
                    onClose={onHideFullValue}
                    starts={searchInfo?.valueMatch || []}
                    text={tmp.substring(1, tmp.length - 1)}
                    length={filter.length}
                />
            )
        );
    };

    return (
        <div className={block()}>
            {renderToolbar()}
            {renderTable()}
            {renderFullValueModal()}
        </div>
    );
}

const OFFSETS_BY_LEVEL: {[key: number]: React.ReactNode} = {};

function getLevelOffsetSpaces(level: number) {
    let res = OFFSETS_BY_LEVEL[level];
    if (!res) {
        const __html = fill_(Array(level * 4), '&nbsp;').join('');
        res = OFFSETS_BY_LEVEL[level] = <span dangerouslySetInnerHTML={{__html}} />;
    }
    return res;
}

interface CellProps {
    matched: SearchInfo;
    row: UnipikaFlattenTreeItem;
    settings?: UnipikaSettings;
    collapsedState?: {readonly [key: string]: boolean};
    onToggleCollapse: (path: string) => void;
    filter?: string;
    index: number;
    showFullText: (index: number) => void;
}

function Cell(props: CellProps) {
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
                />
            )}
            {collapsed && depth === undefined && <span className={'unipika'}>...</span>}
            {close && <OpenClose type={close} settings={settings} close />}
            {hasDelimiter && <SlaveText text={','} />}
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
            <SlaveText text={': '} />
        </React.Fragment>
    ) : null;
}

interface ValueProps extends KeyProps {
    showFullText?: () => void;
}

function Value(props: ValueProps) {
    return (
        <React.Fragment>
            {renderValueWithFilter(props, block('value', {type: props.text?.$type}))}
        </React.Fragment>
    );
}

function asModifier(path = '') {
    return path.replace(/[^-\w\d]/g, '_');
}

function renderValueWithFilter(props: ValueProps, className: string) {
    if ('string' === props.text?.$type) {
        return renderStringWithFilter(props, className, 100);
    }
    return renderWithFilter(props, block('value'));
}

function renderStringWithFilter(props: ValueProps, className: string, maxWidth = Infinity) {
    const {text, settings = defaultUnipikaSettings, matched = [], filter, showFullText} = props;
    const tmp = unipika.format(text, {...settings, asHTML: false});
    const visible = tmp.substr(1, Math.min(tmp.length - 2, maxWidth));
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

function SlaveText({text}: {text: string}) {
    return <span className={''}>{text}</span>;
}

function OpenClose(props: {
    type: BlockType;
    close?: boolean;
    settings: JsonViewerProps['unipikaSettings'];
}) {
    const {type, close} = props;
    switch (type) {
        case 'array':
            return <SlaveText text={close ? ']' : '['} />;
        case 'object':
            return <SlaveText text={close ? '}' : '{'} />;
    }
}

interface ToggleCollapseProps {
    collapsed?: boolean;
    path?: UnipikaFlattenTreeItem['path'];
    onToggle: () => void;
}

function ToggleCollapseButton(props: ToggleCollapseProps) {
    const {collapsed, onToggle, path} = props;
    return (
        <span title={path} className={block('collapsed')}>
            <Button onClick={onToggle} view="flat-secondary" size={'s'}>
                <span className={'unipika'}>{collapsed ? '[+]' : '[-]'}</span>
            </Button>
        </span>
    );
}

function formatValue(
    value: UnipikaFlattenTreeItem['key'] | UnipikaFlattenTreeItem['value'],
    settings: UnipikaSettings = defaultUnipikaSettings,
) {
    const __html = unipika.formatValue(value, {...defaultUnipikaSettings, ...settings}, 0);
    return <span className={'unipika'} dangerouslySetInnerHTML={{__html}} />;
}
