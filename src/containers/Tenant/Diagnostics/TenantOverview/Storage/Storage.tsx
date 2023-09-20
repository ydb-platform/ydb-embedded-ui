import InfoViewer, {InfoViewerItem} from '../../../../../components/InfoViewer/InfoViewer';

interface StorageProps {
    info?: InfoViewerItem[];
}

export function Storage({info}: StorageProps) {
    return <InfoViewer title="Storage details" info={info} />;
}
