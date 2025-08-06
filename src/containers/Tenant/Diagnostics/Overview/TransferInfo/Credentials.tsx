import {Label} from '@gravity-ui/uikit';

import type {TConnectionParams} from '../../../../../types/api/schema/replication';

interface CredentialsProps {
    connection?: TConnectionParams;
}

export function Credentials({connection}: CredentialsProps) {
    if (!connection) {
        return null;
    }

    if (connection.StaticCredentials) {
        return (
            <Label value={connection.StaticCredentials.User} theme="normal">
                user
            </Label>
        );
    }

    if (connection.OAuthToken) {
        //return connection.OAuthToken.keys().length;
        return connection.OAuthToken.Token || connection.OAuthToken.TokenSecretName ? 'OAuth' : '';
    }

    return 'unknown';
}
