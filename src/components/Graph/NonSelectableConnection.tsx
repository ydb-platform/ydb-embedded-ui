import {MultipointConnection} from '@gravity-ui/graph/react';

/**
 * Кастомный класс соединения, который отключает визуальное выделение
 * Наследуется от MultipointConnection и переопределяет поведение
 */
export class NonSelectableConnection extends MultipointConnection {
    //eslint-disable @typescript-eslint/explicit-member-accessibility
    override cursor: 'pointer' = 'pointer';

    // Переопределяем метод для предотвращения выделения при клике
    protected override handleEvent(event: Event) {
        event.stopPropagation();
    }
}
