import React from 'react';

import type {ButtonView} from '@gravity-ui/uikit';
import {Button, DropdownMenu} from '@gravity-ui/uikit';

import {Icon} from '../../../../components/Icon';
import {LabelWithPopover} from '../../../../components/LabelWithPopover';
import type {QueryAction, QueryMode} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {QUERY_MODES, QUERY_MODES_TITLES} from '../../../../utils/query';
import SaveQuery from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import './QueryEditorControls.scss';

const queryModeSelectorQa = 'query-mode-selector';
const queryModeSelectorPopupQa = 'query-mode-selector-popup';

const b = cn('ydb-query-editor-controls');

const QueryModeSelectorOptions = {
    [QUERY_MODES.script]: {
        title: QUERY_MODES_TITLES[QUERY_MODES.script],
        description: i18n('method-description.script'),
    },
    [QUERY_MODES.scan]: {
        title: QUERY_MODES_TITLES[QUERY_MODES.scan],
        description: i18n('method-description.scan'),
    },
    [QUERY_MODES.data]: {
        title: QUERY_MODES_TITLES[QUERY_MODES.data],
        description: i18n('method-description.data'),
    },
    [QUERY_MODES.query]: {
        title: QUERY_MODES_TITLES[QUERY_MODES.query],
        description: i18n('method-description.query'),
    },
    [QUERY_MODES.pg]: {
        title: QUERY_MODES_TITLES[QUERY_MODES.pg],
        description: i18n('method-description.pg'),
    },
} as const;

interface QueryEditorControlsProps {
    onRunButtonClick: (mode?: QueryMode) => void;
    runIsLoading: boolean;
    onExplainButtonClick: (mode?: QueryMode) => void;
    explainIsLoading: boolean;
    onSaveQueryClick: (queryName: string) => void;
    savedQueries: unknown;
    disabled: boolean;
    onUpdateQueryMode: (mode: QueryMode) => void;
    queryMode: QueryMode;
    highlightedAction: QueryAction;
}

export const QueryEditorControls = ({
    onRunButtonClick,
    runIsLoading,
    onExplainButtonClick,
    explainIsLoading,
    onSaveQueryClick,
    savedQueries,
    disabled,
    onUpdateQueryMode,
    queryMode,
    highlightedAction,
}: QueryEditorControlsProps) => {
    const querySelectorMenuItems = React.useMemo(() => {
        return Object.entries(QueryModeSelectorOptions).map(([mode, {title, description}]) => {
            return {
                text: (
                    <LabelWithPopover
                        className={b('item-with-popover')}
                        contentClassName={b('popover')}
                        text={title}
                        popoverContent={description}
                    />
                ),
                action: () => {
                    onUpdateQueryMode(mode as QueryMode);
                },
            };
        });
    }, [onUpdateQueryMode]);

    const runView: ButtonView | undefined = highlightedAction === 'execute' ? 'action' : undefined;
    const explainView: ButtonView | undefined =
        highlightedAction === 'explain' ? 'action' : undefined;

    return (
        <div className={b()}>
            <div className={b('left')}>
                <Button
                    onClick={() => {
                        onRunButtonClick(queryMode);
                    }}
                    disabled={disabled}
                    loading={runIsLoading}
                    view={runView}
                >
                    <Icon name="startPlay" viewBox="0 0 16 16" width={16} height={16} />
                    {'Run'}
                </Button>
                <Button
                    onClick={() => {
                        onExplainButtonClick(queryMode);
                    }}
                    disabled={disabled}
                    loading={explainIsLoading}
                    view={explainView}
                >
                    Explain
                </Button>
                <div className={b('mode-selector')}>
                    <DropdownMenu
                        items={querySelectorMenuItems}
                        popupProps={{
                            className: b('mode-selector__popup'),
                            qa: queryModeSelectorPopupQa,
                        }}
                        switcher={
                            <Button className={b('mode-selector__button')} qa={queryModeSelectorQa}>
                                <span className={b('mode-selector__button-content')}>
                                    {`${i18n('controls.query-mode-selector_type')} ${
                                        QueryModeSelectorOptions[queryMode].title
                                    }`}
                                    <Icon name="chevron-down" width={16} height={16} />
                                </span>
                            </Button>
                        }
                    />
                </div>
            </div>
            <SaveQuery
                savedQueries={savedQueries}
                onSaveQuery={onSaveQueryClick}
                saveButtonDisabled={disabled}
            />
        </div>
    );
};
