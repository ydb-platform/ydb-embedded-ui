import React from 'react';

import {duration} from '@gravity-ui/date-utils';
import {ArrowsRotateLeft} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {DAY_IN_SECONDS, HOUR_IN_SECONDS, SECOND_IN_MS} from '../../../../utils/constants';
import i18n from '../i18n';

function getPassedMilliseconds(lastFullfiled = 0) {
    return Date.now() - lastFullfiled;
}

interface HealthcheckRefreshProps {
    lastFullfiled?: number;
    refresh: () => void;
}

export function HealthcheckRefresh({lastFullfiled, refresh}: HealthcheckRefreshProps) {
    const [passedFromLastFullfiled, setPassedFromLastFullfiled] = React.useState(
        getPassedMilliseconds(lastFullfiled),
    );

    React.useEffect(() => {
        setPassedFromLastFullfiled(getPassedMilliseconds(lastFullfiled));
        const interval = setInterval(() => {
            setPassedFromLastFullfiled(getPassedMilliseconds(lastFullfiled));
        }, 60 * SECOND_IN_MS);
        return () => clearInterval(interval);
    }, [lastFullfiled]);

    const renderPassedFromLastFullfiled = () => {
        if (isNil(lastFullfiled)) {
            return null;
        }
        const showHours = passedFromLastFullfiled > HOUR_IN_SECONDS * SECOND_IN_MS;
        const showDays = passedFromLastFullfiled > DAY_IN_SECONDS * SECOND_IN_MS;

        const preparedDuration = duration(passedFromLastFullfiled);

        let durationText = '';

        if (showDays) {
            const days = preparedDuration.asDays();
            durationText = i18n('description_days', {count: Math.round(days)});
        } else if (showHours) {
            const hours = preparedDuration.asHours();
            durationText = i18n('description_hours', {count: Math.round(hours)});
        } else {
            const minutes = preparedDuration.asMinutes();
            durationText = i18n('description_minutes', {count: Math.round(minutes)});
        }

        return <Text color="secondary">{durationText}</Text>;
    };

    return (
        <Flex gap={2} alignItems="center">
            {renderPassedFromLastFullfiled()}
            <ActionTooltip title={i18n('action_refresh')}>
                <Button
                    view="outlined"
                    onClick={() => {
                        refresh();
                    }}
                >
                    <Button.Icon>
                        <ArrowsRotateLeft />
                    </Button.Icon>
                </Button>
            </ActionTooltip>
        </Flex>
    );
}
