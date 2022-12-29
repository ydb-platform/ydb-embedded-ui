import {connect} from 'react-redux';

import {RadioButton, Switch} from '@gravity-ui/uikit';
import {Settings} from '@gravity-ui/navigation';

import favoriteFilledIcon from '../../assets/icons/star.svg';
import flaskIcon from '../../assets/icons/flask.svg';

import {INVERTED_DISKS_KEY, THEME_KEY} from '../../utils/constants';

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

    const _onInvertedDisksChangeHandler = (value: boolean) => {
        props.setSettingValue(INVERTED_DISKS_KEY, String(value));
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
            <Settings.Page
                id="experiments"
                title="Experiments"
                icon={{data: flaskIcon}}
            >
                <Settings.Section title="Experiments">
                    <Settings.Item title="Inverted disks space indicators">
                        <Switch
                            checked={props.invertedDisks}
                            onUpdate={_onInvertedDisksChangeHandler}
                        />
                    </Settings.Item>
                </Settings.Section>
            </Settings.Page>
        </Settings>
    );
}

const mapStateToProps = (state: any) => {
    const {
        theme,
        invertedDisks,
    } = state.settings.userSettings;

    return {
        theme,
        invertedDisks: JSON.parse(invertedDisks),
    };
};

const mapDispatchToProps = {
    setSettingValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(UserSettings);
