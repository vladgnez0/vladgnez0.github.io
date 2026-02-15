# teacher-site-v4 (классический стиль)

## Как открыть
1) Откройте `index.html` в браузере.
2) Если браузер блокирует загрузку PDF по локальным путям — запустите локальный сервер:
   - VS Code → Live Server
   - или: `python -m http.server` в папке проекта.

## Где менять данные (ФИО/контакты/ссылки/новости)
`assets/data.js`

## Фото учителя
По умолчанию используется `assets/img/teacher.svg`.
Чтобы поставить настоящее фото:
1) Добавьте файл `teacher.jpg` в `assets/img/`
2) В `assets/data.js` замените:
   `photo: "assets/img/teacher.svg"` → `photo: "assets/img/teacher.jpg"`

## Материалы
PDF лежат в `assets/materials/` и уже подключены в раздел «Материалы».
