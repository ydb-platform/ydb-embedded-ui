import {MultipointConnection} from '@gravity-ui/graph/react';

/**
 * Кастомный класс соединения, который отключает визуальное выделение
 * Наследуется от MultipointConnection и переопределяет поведение
 */
export class NonSelectableConnection extends MultipointConnection {
    // Переопределяем метод для предотвращения выделения при клике
    public override onClick() {
        // Ничего не делаем при клике - блокируем выделение
        return;
    }

    // Переопределяем метод для отключения hover эффектов
    public override onPointerEnter() {
        // Ничего не делаем при наведении
        return;
    }

    public override onPointerLeave() {
        // Ничего не делаем при уходе курсора
        return;
    }
}
