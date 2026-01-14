import {z} from 'zod';

export const emptyStringToUndefined = (val: unknown) => (val === '' ? undefined : val);

// Convenience wrapper for the common pattern: '' -> undefined
export const preprocessEmptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess(emptyStringToUndefined, schema);
