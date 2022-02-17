import React from 'react';
import {SlotName} from './AsideHeaderFooterSlot';

type Slots = Partial<Record<SlotName, HTMLElement | null>>;

const SlotsContext = React.createContext<Slots | undefined>(undefined);
export const SetSlotsContext = React.createContext<
    ((name: SlotName, node: HTMLElement | null) => void) | undefined
>(undefined);

export function SlotsProvider({children}: {children: React.ReactNode}) {
    const [slots, setSlots] = React.useState<Slots>({});

    const registerSlot = React.useCallback(
        (name: SlotName, node: HTMLElement | null) => {
            setSlots((prevSlots) => {
                if (prevSlots[name] === node) {
                    return prevSlots;
                }
                return {
                    ...prevSlots,
                    [name]: node,
                };
            });
        },
        [setSlots],
    );

    return (
        <SetSlotsContext.Provider value={registerSlot}>
            <SlotsContext.Provider value={slots}>{children}</SlotsContext.Provider>
        </SetSlotsContext.Provider>
    );
}

function useSlotsValue() {
    const slots = React.useContext(SlotsContext);

    if (slots === undefined) {
        throw new Error('useSlots must be used within a SlotsProvider');
    }

    return slots;
}

export function useSlot(name: SlotName) {
    const slots = useSlotsValue();
    return slots[name];
}
