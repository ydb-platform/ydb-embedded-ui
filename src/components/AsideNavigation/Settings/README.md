### Settings

Компонент для отображения настроек сервиса. Поддерживает

- одно-уровневую и двух-уровневую группировки настроек;
- поиск по заголовкам настроек;
- отображение состояния загрузки;

### PropTypes

#### Settings

| Property       | Type     | Required | Default | Description                                                              |
| :------------- | :------- | :------: | :------ | :----------------------------------------------------------------------- |
| loading        | boolean  |          |         | флаг неготовности настроек для отображения                               |
| renderLoading  | Function |          |         | Содержимое компонента на время загрузки                                  |
| renderNotFound | Function |          |         | Содержимое страницы при отсутствии найденных элементов                   |
| initialPage    | string   |          |         | Активный раздел настроек по умолчанию в формате "/ид группы/ид страницы" |
| onPageChange   | Function |          |         | Обработчик события изменения активной страницы настроек                  |

#### Settings.Group

| Property   | Type   | Required | Default | Description                              |
| :--------- | :----- | :------: | :------ | :--------------------------------------- |
| id         | string |          |         | Уникальный идентификатор группы настроек |
| groupTitle | string |   true   |         | заголовок группы страниц настроек        |

#### Settings.Page

| Property | Type      | Required | Default | Description                                                |
| :------- | :-------- | :------: | :------ | :--------------------------------------------------------- |
| id       | string    |          |         | Уникальный идентификатор страницы настроек в рамках группы |
| title    | string    |   true   |         | заголовок страницы настроек                                |
| icon     | IconProps |   true   |         | данные иконки, отображаемой в меню                         |

#### Settings.Section

| Property  | Type      | Required | Default | Description                            |
| :-------- | :-------- | :------: | :------ | :------------------------------------- |
| title     | string    |   true   |         | заголовок раздела настроек на странице |
| header    | ReactNode |          |         | Шапка секции                           |
| withBadge | boolean   |          |         | Рисует бэйдж у секции и меню           |

#### Settings.Item

| Property             | Type            | Required | Default  | Description                                 |
| :------------------- | :-------------- | :------: | :------- | :------------------------------------------ |
| title                | string          |   true   |          | заголовок настройки                         |
| renderTitleComponent | Function        |          |          | Произвольное содержимое заголовка настройки |
| align                | 'top', 'center' |          | 'center' | выравнивание заголовка и контрола           |

### Использование

Смотрите в storybook пример `src/strories/demo/SettingsDemo`.

### Описание

Меню настроек может быть одно-уровневым:

```jsx
<Settings>
  <Settings.Page title="Оформление">...</Settings.Page>
  <Settings.Page title="Коммуникации">...</Settings.Page>
</Settings>
```

или двух-уровневым:

```jsx
<Settings>
  <Settings.Group groupTitle="Arcanum">
    <Settings.Page title="Оформление">...</Settings.Page>
    <Settings.Page title="Коммуникации">...</Settings.Page>
  </Settings.Group>
  <Settings.Group groupTitle="General">
    <Settings.Page title="Оформление">...</Settings.Page>
    <Settings.Page title="Коммуникации">...</Settings.Page>
  </Settings.Group>
</Settings>
```

Страницы настроек делятся на секции с наборами настроек:

```jsx
<Settings.Page title="Features" icon={'...'}>
  <Settings.Section title="Common">
    <Settings.Item title="Default VCS">...</Settings.Item>
    <Settings.Item title="Search root">...</Settings.Item>
  </Settings.Section>
  <Settings.Section title="Beta functionality">...</Settings.Section>
</Settings.Page>
```
