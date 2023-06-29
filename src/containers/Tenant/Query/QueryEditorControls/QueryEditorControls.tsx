import block from 'bem-cn-lite';

import {Button, ButtonView, DropdownMenu} from '@gravity-ui/uikit';
import {useMemo} from 'react';

import type {QueryAction, QueryMode} from '../../../../types/store/query';
import {QUERY_MODES} from '../../../../utils/query';
import {Icon} from '../../../../components/Icon';

import SaveQuery from '../SaveQuery/SaveQuery';

import i18n from '../i18n';

import './QueryEditorControls.scss';

const queryModeSelectorQa = 'query-mode-selector';
const queryModeSelectorPopupQa = 'query-mode-selector-popup';

const b = block('ydb-query-editor-controls');

const OldQueryModeSelectorTitles = {
    [QUERY_MODES.script]: 'YQL Script',
    [QUERY_MODES.scan]: 'Scan',
} as const;

const QueryModeSelectorTitles = {
    [QUERY_MODES.script]: 'YQL Script',
    [QUERY_MODES.scan]: 'Scan',
    [QUERY_MODES.data]: 'Data',
    [QUERY_MODES.query]: 'YQL - QueryService',
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
    enableAdditionalQueryModes: boolean;
    highlitedAction: QueryAction;
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
    highlitedAction,
    enableAdditionalQueryModes,
}: QueryEditorControlsProps) => {
    const querySelectorMenuItems = useMemo(() => {
        const titles = enableAdditionalQueryModes
            ? QueryModeSelectorTitles
            : OldQueryModeSelectorTitles;

        return Object.entries(titles).map(([mode, title]) => {
            return {
                text: title,
                action: () => {
                    onUpdateQueryMode(mode as QueryMode);
                },
            };
        });
    }, [onUpdateQueryMode, enableAdditionalQueryModes]);

    const runView: ButtonView | undefined = highlitedAction === 'execute' ? 'action' : undefined;
    const explainView: ButtonView | undefined =
        highlitedAction === 'explain' ? 'action' : undefined;

    return (
        <div className={b()}>
            <div className={b('left')}>
                <div className={b('run')}>
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
                </div>
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
                <div
                    className={b('mode-selector', {
                        extended: enableAdditionalQueryModes,
                    })}
                >
                    <DropdownMenu
                        items={querySelectorMenuItems}
                        popupProps={{
                            className: b('mode-selector__popup', {
                                extended: enableAdditionalQueryModes,
                            }),
                            qa: queryModeSelectorPopupQa,
                        }}
                        switcher={
                            <Button className={b('mode-selector__button')} qa={queryModeSelectorQa}>
                                <span className={b('mode-selector__button-content')}>
                                    {`${i18n('controls.query-mode-selector_type')} ${
                                        QueryModeSelectorTitles[queryMode]
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
