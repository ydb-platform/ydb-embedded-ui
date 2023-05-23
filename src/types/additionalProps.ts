import type {VersionToColorMap} from './versions';

export interface AdditionalVersionsProps {
    getBackend?: (backend: string) => string;
    getVersionToColorMap?: () => VersionToColorMap;
}
