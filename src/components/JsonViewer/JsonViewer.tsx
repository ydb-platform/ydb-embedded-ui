import React from 'react';

import type * as DT100 from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {ActionTooltip, Button, Flex, Icon} from '@gravity-ui/uikit';

import {CASE_SENSITIVE_JSON_SEARCH} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {Cell} from './components/Cell';
import {Filter} from './components/Filter';
import {FullValueDialog} from './components/FullValueDialog';
import {block} from './constants';
import i18n from './i18n';
import type {UnipikaSettings, UnipikaValue} from './unipika/StructuredYsonTypes';
import {flattenUnipika} from './unipika/flattenUnipika';
import type {
    CollapsedState,
    FlattenUnipikaResult,
    SearchInfo,
    UnipikaFlattenTreeItem,
} from './unipika/flattenUnipika';
import {unipika} from './unipika/unipika';

import ArrowDownToLineIcon from '@gravity-ui/icons/svgs/arrow-down-to-line.svg';
import ArrowUpFromLineIcon from '@gravity-ui/icons/svgs/arrow-up-from-line.svg';

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
                        <Button onClick={onExpandAll} view="flat-secondary">
                            <Icon data={ArrowDownToLineIcon} />
                        </Button>
                    </ActionTooltip>
                    <ActionTooltip title={i18n('action_collapse-all')}>
                        <Button onClick={onCollapseAll} view="flat-secondary">
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

function asModifier(path = '') {
    return path.replace(/[^-\w\d]/g, '_');
}
