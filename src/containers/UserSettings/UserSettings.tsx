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
import i18n from './i18n';

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
        content: i18n('settings.theme.option-system'),
    },
    {
        value: Theme.light,
        content: i18n('settings.theme.option-light'),
    },
    {
        value: Theme.dark,
        content: i18n('settings.theme.option-dark'),
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
                title={i18n('page.general')}
                icon={{data: favoriteFilledIcon, height: 14, width: 14}}
            >
                <Settings.Section title={i18n('section.general')}>
                    <Setting
                        settingKey={THEME_KEY}
                        title={i18n('settings.theme.title')}
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
                title={i18n('page.experiments')}
                icon={{data: flaskIcon}}
            >
                <Settings.Section title={i18n('section.experiments')}>
                    <Setting
                        settingKey={INVERTED_DISKS_KEY}
                        title={i18n('settings.invertedDisks.title')}
                    />
                    <Setting
                        settingKey={USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY}
                        title={i18n('settings.useNodesEndpoint.title')}
                        helpPopoverContent={i18n('settings.useNodesEndpoint.popover')}
                    />
                    <Setting
                        settingKey={ENABLE_QUERY_MODES_FOR_EXPLAIN}
                        title={i18n('settings.enableQueryModesForExplain.title')}
                        helpPopoverContent={i18n('settings.enableQueryModesForExplain.popover')}
                    />
                    {settings?.[SettingsSection.experiments]?.map((setting) => (
                        <Setting key={setting.settingKey} {...setting} />
                    ))}
                </Settings.Section>
            </Settings.Page>
        </Settings>
    );
};
