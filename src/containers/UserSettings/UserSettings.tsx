import {Settings} from '@gravity-ui/navigation';
import {Text} from '@gravity-ui/uikit';

import {Setting} from './Setting';
import type {YDBEmbeddedUISettings} from './settings';

interface UserSettingsProps {
    settings: YDBEmbeddedUISettings;
}

export const UserSettings = ({settings: userSettings}: UserSettingsProps) => {
    return (
        <div data-qa="user-settings" style={{height: '100%'}}>
            <Settings>
                {userSettings.map((page) => {
                    const {id, title, icon, sections = [], hideTitle} = page;

                    return (
                        <Settings.Page key={id} id={id} title={title} icon={icon}>
                            {sections.map((section) => {
                                const {title: sectionTitle, settings: sectionSettings = []} =
                                    section;

                                return (
                                    <Settings.Section
                                        key={id}
                                        title={sectionTitle}
                                        hideTitle={hideTitle}
                                    >
                                        {sectionSettings.map((setting) => {
                                            if (setting.type === 'info') {
                                                return (
                                                    <Settings.Item key={setting.title} {...setting}>
                                                        {setting.content}
                                                    </Settings.Item>
                                                );
                                            }
                                            // `effectiveValue` is consumed by `Setting`, but should not
                                            // be forwarded to the external Settings.Item component.
                                            const {
                                                description,
                                                effectiveValue: _effectiveValue,
                                                ...rest
                                            } = setting;
                                            return (
                                                <Settings.Item
                                                    key={setting.title}
                                                    align="top"
                                                    {...rest}
                                                >
                                                    <Setting {...setting} />
                                                    <Text color="secondary" as="div">
                                                        {description}
                                                    </Text>
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
        </div>
    );
};
