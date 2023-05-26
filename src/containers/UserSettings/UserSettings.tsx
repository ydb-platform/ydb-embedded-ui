import cn from 'bem-cn-lite';

import {Settings} from '@gravity-ui/navigation';

import {YDBEmbeddedUISettings, settings} from './settings';
import {Setting} from './Setting';

import './UserSettings.scss';

export const b = cn('ydb-user-settings');

interface UserSettingsProps {
    settings?: YDBEmbeddedUISettings;
}

export const UserSettings = ({settings: userSettings = settings}: UserSettingsProps) => {
    return (
        <Settings>
            {Object.keys(userSettings).map((key) => {
                const {title, icon, sections = {}} = userSettings[key];

                return (
                    <Settings.Page key={key} id={key} title={title} icon={icon}>
                        {Object.keys(sections).map((sectionKey) => {
                            const {title: sectionTitle, settings: sectionSettings = {}} =
                                sections[sectionKey];

                            return (
                                <Settings.Section key={sectionKey} title={sectionTitle}>
                                    {Object.keys(sectionSettings).map((settingKey) => {
                                        return (
                                            <Setting
                                                key={settingKey}
                                                {...sectionSettings[settingKey]}
                                            />
                                        );
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
