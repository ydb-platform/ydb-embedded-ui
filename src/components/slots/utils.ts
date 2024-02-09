import React from 'react';

import type {SlotComponent} from './types';

export function isSlotElement<P = {}, Type = never>(
    node: React.ReactNode,
): node is React.ReactElement<P, SlotComponent<P>> & React.RefAttributes<Type> {
    return React.isValidElement(node) && isSlotComponent(node.type);
}

export function isSlotComponent<T = {}>(
    type: string | React.JSXElementConstructor<any>,
): type is SlotComponent<T> {
    return typeof type === 'function' && '__slotName' in type;
}
