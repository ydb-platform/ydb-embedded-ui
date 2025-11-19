import {HelpMark, Switch} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import {useQueryStreamingSetting} from '../../../../utils/hooks';

import {QUERY_SETTINGS_FIELD_SETTINGS} from './constants';
import i18n from './i18n';

import './TimeoutLabel.scss';

const b = cn('ydb-timeout-label');

interface TimeoutLabelProps {
    isDisabled?: boolean;
    isChecked: boolean;
    onToggle: (enabled: boolean) => void;
}

export function TimeoutLabel({isDisabled, isChecked, onToggle}: TimeoutLabelProps) {
    const {value: isQueryStreamingEnabled} = useQueryStreamingSetting();

    if (isQueryStreamingEnabled) {
        return (
            <div className={b('switch-title')}>
                <Switch
                    disabled={isDisabled}
                    checked={isChecked}
                    onUpdate={onToggle}
                    className={b('switch')}
                    content={QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
                />
                {isDisabled && (
                    <HelpMark
                        className={b('question-icon')}
                        popoverProps={{placement: 'bottom-start'}}
                    >
                        {i18n('form.timeout.disabled')}
                    </HelpMark>
                )}
            </div>
        );
    }

    return (
        <label htmlFor="timeout" className={b('label-title')}>
            {QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
        </label>
    );
}
