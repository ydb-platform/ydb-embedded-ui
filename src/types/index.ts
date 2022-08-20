export type RequiredField<Src, Fields extends keyof Src> = Src & Required<Pick<Src, Fields>>;
