import React from 'react';

import {ChevronDown, Gear, PlayFill} from '@gravity-ui/icons';
import type {ButtonView} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Icon, Tooltip} from '@gravity-ui/uikit';

import {LabelWithPopover} from '../../../../components/LabelWithPopover';
import {QUERY_SETTINGS, useSetting} from '../../../../lib';
import type {QueryAction, QueryMode, QuerySettings} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useChangedQuerySettings} from '../../../../utils/hooks/useChangedQuerySettings';
import {QUERY_MODES, QUERY_MODES_TITLES} from '../../../../utils/query';
import {SaveQuery} from '../SaveQuery/SaveQuery';
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

interface SettingsButtonProps {
    onClick: () => void;
    runIsLoading: boolean;
}

const SettingsButton = ({onClick, runIsLoading}: SettingsButtonProps) => {
    const {changedCurrentSettings, changedCurrentSettingsDescriptions} = useChangedQuerySettings();

    const extraGearProps =
        changedCurrentSettings.length > 0
            ? ({view: 'outlined-info', selected: true} as const)
            : null;

    return (
        <Tooltip
            disabled={changedCurrentSettings.length === 0}
            content={
                <div className={b('message')}>
                    {i18n('gear.tooltip')}
                    {changedCurrentSettingsDescriptions.map((description, index, arr) => (
                        <span key={index} className={b('description-item')}>
                            {description}
                            {index < arr.length - 1 ? ', ' : null}
                        </span>
                    ))}
                </div>
            }
            openDelay={0}
            placement={['top-start']}
        >
            <Button
                onClick={onClick}
                loading={runIsLoading}
                className={b('gear-button')}
                {...extraGearProps}
            >
                <Icon data={Gear} size={16} />
                {extraGearProps ? (
                    <div className={b('changed-settings')}>({changedCurrentSettings.length})</div>
                ) : null}
            </Button>
        </Tooltip>
    );
};

interface QueryEditorControlsProps {
    onRunButtonClick: (querySettings: QuerySettings) => void;
    onSettingsButtonClick: () => void;
    runIsLoading: boolean;
    onExplainButtonClick: (querySettings: QuerySettings) => void;
    explainIsLoading: boolean;
    disabled: boolean;
    onUpdateQueryMode: (mode: QueryMode) => void;
    querySettings: QuerySettings;
    highlightedAction: QueryAction;
}

export const QueryEditorControls = ({
    onRunButtonClick,
    onSettingsButtonClick,
    onUpdateQueryMode,
    runIsLoading,
    onExplainButtonClick,
    explainIsLoading,
    disabled,
    querySettings,
    highlightedAction,
}: QueryEditorControlsProps) => {
    const [useQuerySettings] = useSetting<boolean>(QUERY_SETTINGS);

    const runView: ButtonView | undefined = highlightedAction === 'execute' ? 'action' : undefined;
    const explainView: ButtonView | undefined =
        highlightedAction === 'explain' ? 'action' : undefined;

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

    return (
        <div className={b()}>
            <div className={b('left')}>
                <Button
                    onClick={() => {
                        onRunButtonClick(querySettings);
                    }}
                    disabled={disabled}
                    loading={runIsLoading}
                    view={runView}
                    className={b('run-button')}
                >
                    <Icon data={PlayFill} size={14} />
                    {'Run'}
                </Button>
                <Button
                    onClick={() => {
                        onExplainButtonClick(querySettings);
                    }}
                    disabled={disabled}
                    loading={explainIsLoading}
                    view={explainView}
                >
                    Explain
                </Button>
                {useQuerySettings ? (
                    <SettingsButton onClick={onSettingsButtonClick} runIsLoading={runIsLoading} />
                ) : (
                    <div className={b('mode-selector')}>
                        <DropdownMenu
                            items={querySelectorMenuItems}
                            popupProps={{
                                className: b('mode-selector__popup'),
                                qa: queryModeSelectorPopupQa,
                            }}
                            switcher={
                                <Button
                                    className={b('mode-selector__button')}
                                    qa={queryModeSelectorQa}
                                >
                                    <span className={b('mode-selector__button-content')}>
                                        {`${i18n('controls.query-mode-selector_type')} ${
                                            QueryModeSelectorOptions[querySettings.queryMode].title
                                        }`}
                                        <Icon data={ChevronDown} />
                                    </span>
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>
            <SaveQuery isSaveButtonDisabled={disabled} />
        </div>
    );
};
