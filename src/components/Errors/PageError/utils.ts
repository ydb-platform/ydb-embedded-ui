import type {ErrorDetails} from '../../../utils/errors/extractErrorDetails';

interface ResolveSubtitleParams {
    hasTitleOverride: boolean;
    errorTitle?: string;
    resolvedTitleString?: string;
    subtitle?: string;
    showSubtitle: boolean;
    details: ErrorDetails | null;
}

interface ResolvedSubtitle {
    resolvedSubtitle?: string;
    resolvedShowSubtitle: boolean;
}

export function resolvePageErrorSubtitle({
    hasTitleOverride,
    errorTitle,
    resolvedTitleString,
    subtitle,
    showSubtitle,
    details,
}: ResolveSubtitleParams): ResolvedSubtitle {
    const shouldShowHttpSubtitle =
        hasTitleOverride &&
        details?.status !== undefined &&
        Boolean(errorTitle) &&
        errorTitle !== resolvedTitleString;

    return {
        resolvedSubtitle: shouldShowHttpSubtitle ? errorTitle : subtitle,
        resolvedShowSubtitle: shouldShowHttpSubtitle || showSubtitle,
    };
}
