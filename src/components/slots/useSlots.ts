import React from 'react';

import {SlotMap, SlotMapOptions} from './SlotMap';

export interface UseSlotsProps {
    children?: React.ReactNode;
}

export function useSlots(props: UseSlotsProps, options: SlotMapOptions = {}) {
    const {children} = props;
    const {defaultSlot, onlySlots} = options;

    const slots = React.useMemo(() => {
        return new SlotMap(children, {defaultSlot, onlySlots});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [children, defaultSlot, ...(onlySlots || [])]);

    return slots;
}
