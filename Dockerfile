# syntax=docker/dockerfile:1.4
# Включаем поддержку синтаксиса BuildKit для оптимизаций

# Этап сборки
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# Устанавливаем зависимости с использованием BuildKit mount для кэширования
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Копируем исходный код проекта
COPY . .

# Собираем приложение
RUN npm run build

# Этап для production окружения
FROM node:20-alpine AS production

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем глобально serve для раздачи статических файлов
RUN npm install -g serve

# Копируем собранные файлы из этапа сборки
COPY --from=builder /app/build /app/build

# Открываем порт для доступа к приложению
EXPOSE 3001

# Запускаем приложение
CMD ["serve", "-s", "build", "-l", "3000"]
