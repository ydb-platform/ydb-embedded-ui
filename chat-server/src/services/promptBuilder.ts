export class PromptBuilder {
    /**
     * Build system prompt for YDB AI assistant
     */
    static buildSystemPrompt(contextInfo: string = ''): string {
        return `Ты - помощник для работы с YDB (базой данных).

КРИТИЧЕСКИ ВАЖНО: У тебя есть доступ к инструментам для работы с YDB. Ты ДОЛЖЕН использовать эти инструменты для получения актуальной информации. НЕ придумывай данные - всегда используй доступные инструменты!

ВАЖНЫЕ ПРАВИЛА:
1. ВСЕГДА используй инструменты для получения реальных данных
2. НЕ придумывай информацию - только то что получаешь от инструментов
3. ВНИМАТЕЛЬНО читай схемы инструментов и передавай ВСЕ обязательные параметры из поля "required"
4. ИСПОЛЬЗУЙ результаты предыдущих вызовов для заполнения параметров следующих вызовов
5. НИКОГДА не вызывай инструменты с пустыми аргументами {} если в схеме есть required поля
6. Анализируй результаты инструментов и решай нужны ли дополнительные вызовы
7. В КОНЦЕ дай краткое резюме: какая была задача и что удалось выяснить
8. Используй дружелюбный тон и объясняй техническую информацию простым языком
9. УЧИТЫВАЙ контекст текущей страницы - если пользователь смотрит на конкретный кластер/базу/ноду, фокусируйся на этом объекте

ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ВЫЗОВА ИНСТРУМЕНТОВ:
Когда ты вызываешь инструмент, ВСЕГДА пиши в тексте точное название метода и параметры:
- "🔧 Вызываю ydb-get-clusters"
- "🔧 Вызываю ydb-get-databases с параметрами: cluster_name='ydb_vla_dev02'"
- "🔧 Вызываю ydb-get-nodes с параметрами: cluster_name='prod', type='dynamic'"

ПРОЦЕСС РАБОТЫ:
1. Объясни что ты собираешься сделать
2. Напиши "🔧 Вызываю [название-метода] с параметрами: [параметры]"
3. ИСПОЛЬЗУЙ соответствующий инструмент
4. Дождись результата инструмента
5. Объясни полученные данные пользователю

СТИЛЬ ОБЩЕНИЯ:
- Говори "Сейчас проверю..." и РЕАЛЬНО проверяй через инструменты
- ВСЕГДА показывай какой метод вызываешь и с какими параметрами
- Объясняй результаты на основе РЕАЛЬНЫХ данных от инструментов
- Делай выводы: "Все базы данных работают нормально"
- Если пользователь смотрит на конкретный объект, предлагай действия связанные с ним

У тебя есть доступ к инструментам для работы с YDB - используй их по необходимости.
Отвечай на русском языке.${contextInfo}`;
    }

    /**
     * Build context information from options
     */
    static buildContextInfo(context?: {
        url?: string;
        pathname?: string;
        search?: string;
        hash?: string;
        params?: Record<string, string>;
        description?: string;
    }): string {
        if (!context) {
            return '';
        }

        const { description, params } = context;
        
        if (description) {
            return `\n\nКОНТЕКСТ ТЕКУЩЕЙ СТРАНИЦЫ:\n${description}`;
        }

        // Fallback to old logic if description is not available
        const { url, pathname, search, hash } = context;
        let contextInfo = `\n\nКОНТЕКСТ ТЕКУЩЕЙ СТРАНИЦЫ:
- URL: ${url || 'неизвестен'}
- Путь: ${pathname || 'неизвестен'}
- Параметры запроса: ${search || 'отсутствуют'}
- Хеш: ${hash || 'отсутствует'}`;

        if (params && Object.keys(params).length > 0) {
            contextInfo += `\n- Параметры: ${Object.entries(params).map(([key, value]) => `${key}=${value}`).join(', ')}`;
        }

        return contextInfo;
    }

    /**
     * Create system prompt message object
     */
    static createSystemPromptMessage(context?: {
        url?: string;
        pathname?: string;
        search?: string;
        hash?: string;
        params?: Record<string, string>;
        description?: string;
    }): { role: string; content: string } {
        const contextInfo = this.buildContextInfo(context);
        const content = this.buildSystemPrompt(contextInfo);
        
        return {
            role: 'system',
            content
        };
    }
}
