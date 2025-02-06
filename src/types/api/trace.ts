import {z} from 'zod';

export const traceViewSchema = z.object({
    url: z.string().url(),
});

export type TTraceView = z.infer<typeof traceViewSchema>;
