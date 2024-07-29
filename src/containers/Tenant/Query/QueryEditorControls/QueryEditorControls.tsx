import React from 'react';

import {Gear, PlayFill} from '@gravity-ui/icons';
import type {ButtonView} from '@gravity-ui/uikit';
import {Button, Icon, Tooltip} from '@gravity-ui/uikit';

import {DEFAULT_QUERY_SETTINGS} from '../../../../lib';
import type {QueryAction, QuerySettings} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useQueryExecutionSettings} from '../../../../utils/hooks';
import {SaveQuery} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import getChangedQueryExecutionSettings from './utils/getChangedQueryExecutionSettings';
import getChangedQueryExecutionSettingsDescription from './utils/getChangedQueryExecutionSettingsDescription';

import './QueryEditorControls.scss';

const b = cn('ydb-query-editor-controls');

interface QueryEditorControlsProps {
    onRunButtonClick: (querySettings: QuerySettings) => void;
    onSettingsButtonClick: () => void;
    runIsLoading: boolean;
    onExplainButtonClick: (querySettings: QuerySettings) => void;
    explainIsLoading: boolean;
    disabled: boolean;
    querySettings: QuerySettings;
    highlightedAction: QueryAction;
}

export const QueryEditorControls = ({
    onRunButtonClick,
    onSettingsButtonClick,
    runIsLoading,
    onExplainButtonClick,
    explainIsLoading,
    disabled,
    querySettings,
    highlightedAction,
}: QueryEditorControlsProps) => {
    const [queryExecutionSettings] = useQueryExecutionSettings();

    const changedSettings = React.useMemo(() => {
        return getChangedQueryExecutionSettings(queryExecutionSettings, DEFAULT_QUERY_SETTINGS);
    }, [queryExecutionSettings]);

    const changedSettingsDescription = React.useMemo(() => {
        return getChangedQueryExecutionSettingsDescription({
            currentSettings: queryExecutionSettings,
            defaultSettings: DEFAULT_QUERY_SETTINGS,
        });
    }, [queryExecutionSettings]);

    const runView: ButtonView | undefined = highlightedAction === 'execute' ? 'action' : undefined;
    const explainView: ButtonView | undefined =
        highlightedAction === 'explain' ? 'action' : undefined;

    const extraGearProps =
        changedSettings.length > 0
            ? ({
                  view: 'outlined-info',
                  selected: true,
              } as const)
            : {};

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
                <Tooltip
                    disabled={changedSettings.length === 0}
                    content={
                        <span
                            dangerouslySetInnerHTML={{
                                __html: i18n('gear.tooltip', {
                                    changesText: changedSettingsDescription,
                                }),
                            }}
                        />
                    }
                    openDelay={0}
                    placement={['top-start']}
                >
                    <Button
                        onClick={onSettingsButtonClick}
                        loading={runIsLoading}
                        className={b('gear-button')}
                        {...extraGearProps}
                    >
                        <Icon data={Gear} size={16} />
                        {changedSettings.length > 0 ? (
                            <div className={b('changed-settings')}>({changedSettings.length})</div>
                        ) : null}
                    </Button>
                </Tooltip>
            </div>
            <SaveQuery isSaveButtonDisabled={disabled} />
        </div>
    );
};
