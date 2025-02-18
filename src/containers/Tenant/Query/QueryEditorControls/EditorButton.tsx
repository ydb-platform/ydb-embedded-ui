import {Binoculars, CirclePlay, CircleStop, Gear} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {Button, Icon, Tooltip} from '@gravity-ui/uikit';

import QuerySettingsDescription from '../../../../components/QuerySettingsDescription/QuerySettingsDescription';
import {cn} from '../../../../utils/cn';
import {useChangedQuerySettings} from '../../../../utils/hooks/useChangedQuerySettings';
import i18n from '../i18n';

import './EditorButton.scss';

const b = cn('ydb-query-editor-button');

const Run = (props: ButtonProps) => (
    <Button {...props} className={b('run-button')}>
        <Icon data={CirclePlay} size={16} />
        {i18n('action.run')}
    </Button>
);

const Stop = (props: ButtonProps & {error?: boolean}) => (
    <Button {...props} className={b('stop-button', {error: props.error})}>
        <Icon data={CircleStop} size={16} />
        {i18n('action.stop')}
    </Button>
);

const Explain = (props: ButtonProps) => (
    <Button {...props} className={b('explain-button')}>
        <Icon data={Binoculars} size={16} />
        {i18n('action.explain')}
    </Button>
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
                loading={isLoading}
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

export const EditorButton = {
    Run,
    Stop,
    Explain,
    Settings,
};
