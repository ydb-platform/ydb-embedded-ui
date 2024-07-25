export type ValueOf<T extends Object> = T[keyof T];
export type ExtractType<T> = T extends {type: infer U} ? U : string;
