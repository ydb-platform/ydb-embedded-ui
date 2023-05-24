import cn from 'bem-cn-lite';

import {Settings} from '@gravity-ui/navigation';

import favoriteFilledIcon from '../../assets/icons/star.svg';
import flaskIcon from '../../assets/icons/flask.svg';

import {
    ENABLE_QUERY_MODES_FOR_EXPLAIN,
    INVERTED_DISKS_KEY,
    THEME_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
} from '../../utils/constants';

import {Setting, SettingProps} from './Setting';

import './UserSettings.scss';

export const b = cn('ydb-user-settings');

enum Theme {
    light = 'light',
    dark = 'dark',
    system = 'system',
}

const themeValues = [
    {
        value: Theme.system,
        content: 'System',
    },
    {
        value: Theme.light,
        content: 'Light',
    },
    {
        value: Theme.dark,
        content: 'Dark',
    },
];

export enum SettingsSection {
    general = 'general',
    experiments = 'experiments',
}

interface UserSettingsProps {
    settings?: Partial<Record<SettingsSection, SettingProps[]>>;
}

export const UserSettings = ({settings}: UserSettingsProps) => {
    return (
        <Settings>
            <Settings.Page
                id={SettingsSection.general}
                title="General"
                icon={{data: favoriteFilledIcon, height: 14, width: 14}}
            >
                <Settings.Section title="General">
                    <Setting
                        settingKey={THEME_KEY}
                        title="Interface theme"
                        type="radio"
                        values={themeValues}
                    />
                    {settings?.[SettingsSection.general]?.map((setting) => (
                        <Setting key={setting.settingKey} {...setting} />
                    ))}
                </Settings.Section>
            </Settings.Page>
            <Settings.Page
                id={SettingsSection.experiments}
                title="Experiments"
                icon={{data: flaskIcon}}
            >
                <Settings.Section title="Experiments">
                    <Setting
                        settingKey={INVERTED_DISKS_KEY}
                        title={'Inverted disks space indicators'}
                    />
                    <Setting
                        settingKey={USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY}
                        title={'Break the Nodes tab in Diagnostics'}
                        helpPopoverContent={
                            'Use /viewer/json/nodes endpoint for Nodes Tab in diagnostics. It returns incorrect data on older versions'
                        }
                        withHelpPopover
                    />
                    <Setting
                        settingKey={ENABLE_QUERY_MODES_FOR_EXPLAIN}
                        title={'Enable query modes for explain'}
                        helpPopoverContent={
                            'Enable script | scan query mode selector for both run and explain. May not work on some versions'
                        }
                        withHelpPopover
                    />
                    {settings?.[SettingsSection.experiments]?.map((setting) => (
                        <Setting key={setting.settingKey} {...setting} />
                    ))}
                </Settings.Section>
            </Settings.Page>
        </Settings>
    );
};
