import {Settings} from '@gravity-ui/navigation';

import {Setting} from './Setting';
import type {YDBEmbeddedUISettings} from './settings';

interface UserSettingsProps {
    settings: YDBEmbeddedUISettings;
}

export const UserSettings = ({settings: userSettings}: UserSettingsProps) => {
    return (
        <Settings>
            {userSettings.map((page) => {
                const {id, title, icon, sections = [], showTitle} = page;

                return (
                    <Settings.Page key={id} id={id} title={title} icon={icon}>
                        {sections.map((section) => {
                            const {title: sectionTitle, settings: sectionSettings = []} = section;

                            return (
                                <Settings.Section
                                    key={id}
                                    title={sectionTitle}
                                    showTitle={showTitle ?? true}
                                >
                                    {sectionSettings.map((setting) => {
                                        if (setting.type === 'info') {
                                            return (
                                                <Settings.Item key={setting.title} {...setting}>
                                                    {setting.content}
                                                </Settings.Item>
                                            );
                                        }
                                        return (
                                            <Settings.Item key={setting.title} {...setting}>
                                                <Setting {...setting} />
                                            </Settings.Item>
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
