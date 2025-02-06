export type ValueOf<T extends Object> = T[keyof T];
export type ExtractType<T> = T extends {type: infer U} ? U : string;
export type WithRequiredFields<T, K extends keyof T> = Exclude<T, K> & Required<Pick<T, K>>;
