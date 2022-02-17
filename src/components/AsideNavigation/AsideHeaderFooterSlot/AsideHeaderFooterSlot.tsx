import React from 'react';
import ReactDOM from 'react-dom';
import {useSlot} from './SlotsContext';

export enum SlotName {
    Settings = 'settings',
    User = 'user',
    Support = 'support',
    BugReport = 'bug-report',
}

interface AsideHeaderFooterSlotProps {
    name: SlotName;
    children: React.ReactNode;
    slotRef?: React.Ref<HTMLElement>;
}

export function AsideHeaderFooterSlot({name, slotRef, children}: AsideHeaderFooterSlotProps) {
    const slot = useSlot(name);

    if (typeof slotRef === 'function') {
        slotRef(slot || null);
    } else if (slotRef) {
        // @ts-ignore
        slotRef.current = slot;
    }

    if (slot) {
        return ReactDOM.createPortal(children, slot);
    }

    return null;
}
