import block from 'bem-cn-lite';

import {Button, ButtonView, DropdownMenu} from '@gravity-ui/uikit';
import {useMemo} from 'react';

import type {QueryAction, QueryMode} from '../../../../types/store/query';
import {QUERY_MODES} from '../../../../utils/query';
import {Icon} from '../../../../components/Icon';
import {LabelWithPopover} from '../../../../components/LabelWithPopover';

import SaveQuery from '../SaveQuery/SaveQuery';

import i18n from '../i18n';

import './QueryEditorControls.scss';

const queryModeSelectorQa = 'query-mode-selector';
const queryModeSelectorPopupQa = 'query-mode-selector-popup';

const b = block('ydb-query-editor-controls');

const OldQueryModeSelectorOptions = {
    [QUERY_MODES.script]: {
        title: 'YQL Script',
        description: i18n('method-description.script'),
    },
    [QUERY_MODES.scan]: {
        title: 'Scan',
        description: i18n('method-description.scan'),
    },
} as const;

const QueryModeSelectorOptions = {
    [QUERY_MODES.script]: {
        title: 'YQL Script',
        description: i18n('method-description.script'),
    },
    [QUERY_MODES.scan]: {
        title: 'Scan',
        description: i18n('method-description.scan'),
    },
    [QUERY_MODES.data]: {
        title: 'Data',
        description: i18n('method-description.data'),
    },
    [QUERY_MODES.query]: {
        title: 'YQL - QueryService',
        description: i18n('method-description.query'),
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
        const options = enableAdditionalQueryModes
            ? QueryModeSelectorOptions
            : OldQueryModeSelectorOptions;

        return Object.entries(options).map(([mode, {title, description}]) => {
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
