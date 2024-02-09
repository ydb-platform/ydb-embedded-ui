import React from 'react';

import {SlotMap} from './SlotMap';

export interface UseSlotsProps {
    children?: React.ReactNode;
}

export function useSlots(props: UseSlotsProps) {
    const {children} = props;

    const slots = React.useMemo(() => {
        return new SlotMap(children);
    }, [children]);

    return slots;
}
