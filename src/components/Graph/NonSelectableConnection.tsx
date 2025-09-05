import {MultipointConnection} from '@gravity-ui/graph/react';

/**
 * Кастомный класс соединения, который отключает визуальное выделение
 * Наследуется от MultipointConnection и переопределяет поведение
 */
export class NonSelectableConnection extends MultipointConnection {
    public override cursor = 'default';

    // Переопределяем метод для предотвращения выделения при клике
    protected override handleEvent(event) {
        event.stopPropagation();
    }
}
