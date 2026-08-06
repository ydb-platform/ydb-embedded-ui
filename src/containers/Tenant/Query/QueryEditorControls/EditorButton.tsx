import {Gear, PlayFill, StopFill} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import QuerySettingsDescription from '../../../../components/QuerySettingsDescription/QuerySettingsDescription';
import {cn} from '../../../../utils/cn';
import {useChangedQuerySettings} from '../../../../utils/hooks/useChangedQuerySettings';
import i18n from '../i18n';

import './EditorButton.scss';

const b = cn('ydb-query-editor-button');

const Run = (props: ButtonProps) => (
    <Button {...props} className={b('run-button', undefined, 'brand-button')}>
        <Icon data={PlayFill} size={16} />
        {i18n('action.run')}
    </Button>
);

type StopButtonProps = ButtonProps & {
    error?: boolean;
    replacedAction?: 'run' | 'explain' | 'explainAnalyze';
};

const Stop = ({error, replacedAction, ...props}: StopButtonProps) => (
    <Button
        {...props}
        className={b('stop-button', {
            error,
            'explain-analyze': replacedAction === 'explainAnalyze',
        })}
    >
        <Icon data={StopFill} size={16} />
        {i18n('action.stop')}
    </Button>
);

const Explain = (props: ButtonProps) => (
    <Button {...props} className={b('explain-button', undefined, 'brand-button')}>
        {i18n('action.explain')}
    </Button>
);

const ExplainAnalyze = (props: ButtonProps) => (
    <ActionTooltip
        title={i18n('explain-analyze.tooltip.title')}
        description={i18n('explain-analyze.tooltip.description')}
        openDelay={0}
        placement={['top-start']}
    >
        <Button {...props} className={b('explain-analyze-button', undefined, 'brand-button')}>
            {i18n('action.explain-analyze')}
        </Button>
    </ActionTooltip>
);

interface SettingsButtonProps {
    onClick: () => void;
    isLoading: boolean;
}

const Settings = ({onClick, isLoading}: SettingsButtonProps) => {
    const {changedCurrentSettings, changedCurrentSettingsDescriptions} = useChangedQuerySettings();

    const extraGearProps =
        changedCurrentSettings.length > 0
            ? ({view: 'outlined-info', selected: true} as const)
            : null;

    return (
        <ActionTooltip
            disabled={changedCurrentSettings.length === 0}
            title={i18n('gear.tooltip')}
            description={
                <QuerySettingsDescription
                    prefix=""
                    querySettings={changedCurrentSettingsDescriptions}
                />
            }
            openDelay={0}
            placement={['top-start']}
        >
            <Button
                onClick={onClick}
                loading={isLoading}
                className={b('gear-button')}
                {...extraGearProps}
            >
                <Icon data={Gear} size={16} />
                {extraGearProps ? (
                    <div className={b('changed-settings')}>({changedCurrentSettings.length})</div>
                ) : null}
            </Button>
        </ActionTooltip>
    );
};

export const EditorButton = {
    Run,
    Stop,
    Explain,
    ExplainAnalyze,
    Settings,
};
