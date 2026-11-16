import {HelpMark} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

import {QUERY_SETTINGS_FIELD_SETTINGS} from './constants';
import i18n from './i18n';

import './TimeoutLabel.scss';

const b = cn('ydb-timeout-label');

interface TimeoutLabelProps {
    htmlFor?: string;
    isDisabled?: boolean;
}

export function TimeoutLabel({htmlFor, isDisabled}: TimeoutLabelProps) {
    return (
        <div className={b('label-title')}>
            <label htmlFor={htmlFor}>{QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}</label>
            {isDisabled && (
                <HelpMark
                    className={b('question-icon')}
                    aria-label={i18n('context_field-help', {
                        field: QUERY_SETTINGS_FIELD_SETTINGS.timeout.title,
                    })}
                    popoverProps={{placement: 'bottom-start'}}
                >
                    {i18n('form.timeout.disabled')}
                </HelpMark>
            )}
        </div>
    );
}
