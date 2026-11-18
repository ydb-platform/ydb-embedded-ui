import React from 'react';

import {Box, Text, Tooltip} from '@gravity-ui/uikit';

import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

export function SyncPartnerPileName({name}: {name?: string}) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);

    return (
        <Tooltip
            content={name}
            disabled={!name}
            open={open}
            onOpenChange={(nextOpen) => {
                const span = ref.current;
                setOpen(Boolean(nextOpen && span && span.scrollWidth > span.clientWidth));
            }}
        >
            <Text as={Box} ref={ref} maxWidth="100%" variant="inherit" ellipsis>
                {name || EMPTY_DATA_PLACEHOLDER}
            </Text>
        </Tooltip>
    );
}
