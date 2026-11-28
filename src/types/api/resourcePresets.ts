export interface ListResourcePresetsResponse {
    resource_presets?: ResourcePreset[];
    /** Set when the catalog has more pages; pass it as `page_token` to get the next one */
    next_page_token?: string;
}

export interface ResourcePreset {
    id: string;
    cores: string;
    memory: string;
}
