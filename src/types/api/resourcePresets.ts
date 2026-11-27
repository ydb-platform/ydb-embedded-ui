export interface ListResourcePresetsResponse {
    resource_presets?: ResourcePreset[];
}

export interface ResourcePreset {
    id: string;
    cores: string;
    memory: string;
}
