import {registerSExpressionLanguage} from './s-expression/registerLanguage';
import {registerYqlLanguage} from './yql/registerLanguage';

export function registerLanguages() {
    registerSExpressionLanguage();
    registerYqlLanguage();
}
