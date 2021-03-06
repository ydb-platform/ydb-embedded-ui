import {connect} from 'react-redux';

import {RadioButton} from '@yandex-cloud/uikit';
import {Settings} from '../../components/AsideNavigation/Settings';
import favoriteFilledIcon from '../../assets/icons/star.svg';
//@ts-ignore
import {THEME_KEY} from '../../utils/constants';
//@ts-ignore
import {setSettingValue} from '../../store/reducers/settings';

enum Theme {
    light = 'light',
    dark = 'dark',
    system = 'system',
}

function UserSettings(props: any) {
    const _onThemeChangeHandler = (value: string) => {
        props.setSettingValue(THEME_KEY, value);
    };

    return (
        <Settings>
            <Settings.Page
                id="general"
                title="General"
                icon={{data: favoriteFilledIcon, height: 14, width: 14}}
            >
                <Settings.Section title="General">
                    <Settings.Item title="Interface theme">
                        <RadioButton value={props.theme} onUpdate={_onThemeChangeHandler}>
                            <RadioButton.Option value={Theme.system}>System</RadioButton.Option>
                            <RadioButton.Option value={Theme.light}>Light</RadioButton.Option>
                            <RadioButton.Option value={Theme.dark}>Dark</RadioButton.Option>
                        </RadioButton>
                    </Settings.Item>
                </Settings.Section>
            </Settings.Page>
        </Settings>
    );
}

const mapStateToProps = (state: any) => {
    const {theme} = state.settings.userSettings;

    return {
        theme,
    };
};

const mapDispatchToProps = {
    setSettingValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(UserSettings);
