import {Settings} from '@gravity-ui/navigation';

import {cn} from '../../utils/cn';

import {Setting, SettingsInfoField} from './Setting';
import type {YDBEmbeddedUISettings} from './settings';
import {settings} from './settings';

import './UserSettings.scss';

export const b = cn('ydb-user-settings');

interface UserSettingsProps {
    settings?: YDBEmbeddedUISettings;
}

export const UserSettings = ({settings: userSettings = settings}: UserSettingsProps) => {
    return (
        <Settings>
            {userSettings.map((page) => {
                const {id, title, icon, sections = []} = page;

                return (
                    <Settings.Page key={id} id={id} title={title} icon={icon}>
                        {sections.map((section) => {
                            const {title: sectionTitle, settings: sectionSettings = []} = section;

                            return (
                                <Settings.Section key={id} title={sectionTitle}>
                                    {sectionSettings.map((setting) => {
                                        if (setting.type === 'info') {
                                            return (
                                                <SettingsInfoField
                                                    key={setting.title}
                                                    {...setting}
                                                />
                                            );
                                        }
                                        return <Setting key={setting.settingKey} {...setting} />;
                                    })}
                                </Settings.Section>
                            );
                        })}
                    </Settings.Page>
                );
            })}
        </Settings>
    );
};
