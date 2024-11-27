import {BaseYdbAPI} from './base';

export class AuthAPI extends BaseYdbAPI {
    authenticate(params: {user: string; password: string}) {
        return this.post(this.getPath('/login'), params, {});
    }

    logout() {
        return this.post(this.getPath('/logout'), {}, {});
    }
}
