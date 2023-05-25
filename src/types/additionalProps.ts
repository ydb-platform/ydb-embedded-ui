import type {VersionToColorMap} from './versions';

export interface AdditionalVersionsProps {
    getVersionToColorMap?: () => VersionToColorMap;
}
