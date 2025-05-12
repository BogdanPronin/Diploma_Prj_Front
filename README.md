# Diploma Project Frontend

Фронтенд почтового клиента с чат-функционалом, реализованный на React и Tailwind CSS. Поддерживает авторизацию, просмотр и отправку писем, отображение переписки в виде диалогов.

## Требования

- **Docker** и **Docker Compose**
- Доступ к бэкенду (`Diploma_prj_backend`) и микросервису авторизации (`SMTP_server_back`)

## Установка и развертывание

Фронтенд развертывается через Docker Compose вместе с другими сервисами.

1. **Клонируйте репозитории**:
   ```bash
   mkdir mail-client && cd mail-client
   git clone https://github.com/BogdanPronin/SMTP_server_back.git smtpauth
   git clone https://github.com/BogdanPronin/Diploma_prj_backend.git backend
   git clone https://github.com/BogdanPronin/Diploma_Prj_Front.git front
   ```

2. **Настройте docker-compose.yml**:
   Используйте файл, описанный в README для `SMTP_server_back`. Убедитесь, что фронтенд настроен на порт `3001`.

3. **Запустите сервисы**:
   ```bash
   docker-compose up -d
   ```

4. **Проверьте доступность**:
   - Приложение: `http://<your-ip>:3001` или `http://localhost:3001`

## Тестирование

- Откройте приложение в браузере:
  - Авторизуйтесь через локальный сервер или OAuth (Google, Яндекс).
  - Проверьте просмотр писем, чат-формат и отправку сообщений.

## Примечания

- Убедитесь, что бэкенд (`:8080`) и микросервис авторизации (`:8081`) запущены.
- Для продакшена настройте HTTPS и домен (`https://mail.messenger-mail.ru`).
