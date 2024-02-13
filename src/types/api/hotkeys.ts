export interface JsonHotKeysResponse {
    hotkeys: HotKey[] | null;
}

export interface HotKey {
    accessSample: number;
    keyValues: string[];
}
