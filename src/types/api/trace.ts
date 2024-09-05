import {z} from 'zod';

export const traceCheckSchema = z.object({
    url: z.string().url(),
});

export type TTraceCheck = z.infer<typeof traceCheckSchema>;

export const traceViewSchema = z.object({
    url: z.string().url(),
});

export type TTraceView = z.infer<typeof traceViewSchema>;
