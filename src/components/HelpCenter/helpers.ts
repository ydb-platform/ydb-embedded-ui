import type {ContactItem, Environment, InstallationType} from './types';

export function getReportContactItem(): ContactItem {
    return {
        id: 'report',
        text: 'Report a bug',
        openSupportForm: true,
    };
}

export function getProposalContactItem(url: string): ContactItem {
    return {
        id: 'proposal',
        text: 'Suggest a feature',
        url,
    };
}

export function getSupportContactItem(url: string): ContactItem {
    return {
        id: 'support',
        text: 'Support',
        url,
    };
}

export function getFeatureLink(installationType: InstallationType): string | undefined {
    if (installationType === 'internal') {
        return 'https://ydb.tech/docs/en/';
    }
    return 'https://ydb.tech/docs/en/';
}

export function getSupportLink(
    env: Environment,
    installationType: InstallationType,
): string | undefined {
    if (env === 'production' && installationType === 'internal') {
        return 'https://ydb.tech/docs/en/';
    }
    return 'https://ydb.tech/docs/en/';
}
