import {Gear, PlayFill} from '@gravity-ui/icons';
import type {ButtonView} from '@gravity-ui/uikit';
import {Button, Icon, Tooltip} from '@gravity-ui/uikit';

import QuerySettingsDescription from '../../../../components/QuerySettingsDescription/QuerySettingsDescription';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useChangedQuerySettings} from '../../../../utils/hooks/useChangedQuerySettings';
import {SaveQuery} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import './QueryEditorControls.scss';

const b = cn('ydb-query-editor-controls');

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
                <QuerySettingsDescription
                    prefix={i18n('gear.tooltip')}
                    querySettings={changedCurrentSettingsDescriptions}
                />
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
    onRunButtonClick: () => void;
    onSettingsButtonClick: () => void;
    runIsLoading: boolean;
    onExplainButtonClick: () => void;
    explainIsLoading: boolean;
    disabled: boolean;
    highlightedAction: QueryAction;
}

export const QueryEditorControls = ({
    onRunButtonClick,
    onSettingsButtonClick,
    runIsLoading,
    onExplainButtonClick,
    explainIsLoading,
    disabled,
    highlightedAction,
}: QueryEditorControlsProps) => {
    const runView: ButtonView | undefined = highlightedAction === 'execute' ? 'action' : undefined;
    const explainView: ButtonView | undefined =
        highlightedAction === 'explain' ? 'action' : undefined;

    return (
        <div className={b()}>
            <div className={b('left')}>
                <Button
                    onClick={onRunButtonClick}
                    disabled={disabled}
                    loading={runIsLoading}
                    view={runView}
                    className={b('run-button')}
                >
                    <Icon data={PlayFill} size={14} />
                    {'Run'}
                </Button>
                <Button
                    onClick={onExplainButtonClick}
                    disabled={disabled}
                    loading={explainIsLoading}
                    view={explainView}
                >
                    Explain
                </Button>
                <SettingsButton onClick={onSettingsButtonClick} runIsLoading={runIsLoading} />
            </div>
            <SaveQuery isSaveButtonDisabled={disabled} />
        </div>
    );
};
