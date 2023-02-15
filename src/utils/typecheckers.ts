/**
 * Intended to typecheck enums, but also checks if the value is any of the arbitrary object values
 */
export const isEnumMember = <T extends Object>(object: T, value: any): value is T[keyof T] =>
    Object.values(object).includes(value);
