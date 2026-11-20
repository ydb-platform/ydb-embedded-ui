import React from 'react';

import {CircleExclamation} from '@gravity-ui/icons';
import {Button, Flex, Icon, Label, Popover, Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';

import i18n from './i18n';
import {useDatabaseRuntimeState} from './useDatabaseAvailability';

import './DatabaseAvailability.scss';

const b = cn('ydb-runtime-unavailable');

/** Header indicator of a runtime outage: explains what is shown and offers a retry. */
export function RuntimeUnavailableLabel() {
    const {availability, runtimeUnavailable, coldStart, retry} = useDatabaseRuntimeState();
    const [open, setOpen] = React.useState(false);

    const handleRetry = () => {
        setOpen(false);
        retry();
    };

    // Without control plane data the page is replaced by an error with its own retry
    const errorPageShown = coldStart && availability.status === 'unavailable';
    if (!runtimeUnavailable || errorPageShown) {
        return null;
    }

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            hasArrow
            placement={['bottom-start', 'bottom']}
            content={
                <Flex direction="column" gap={3} className={b('popover')} qa="runtime-unavailable">
                    <Text variant="subheader-2">{i18n('title_runtime-unavailable')}</Text>
                    <Text color="secondary">
                        {coldStart
                            ? i18n('description_runtime-unavailable')
                            : i18n('description_runtime-lost')}
                    </Text>
                    <div>
                        <Button onClick={handleRetry}>{i18n('action_retry')}</Button>
                    </div>
                </Flex>
            }
        >
            <Label
                theme="danger"
                size="s"
                icon={<Icon size={14} data={CircleExclamation} />}
                interactive
                qa="runtime-unavailable-label"
            >
                {i18n('label_runtime-unavailable')}
            </Label>
        </Popover>
    );
}
