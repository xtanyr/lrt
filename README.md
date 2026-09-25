# LRT — рейтинг лидеров кофеен

## Запуск для сервера

Для stakeholder UAT на Ubuntu используйте краткий порядок в [runbook](docs/uat/deployment-runbook.md): домен и HTTPS, `.env`, Docker Compose, UAT seed и smoke.

Перед упаковкой release выполните `deploy/uat/preflight.sh` из WSL/Git Bash и затем `deploy/uat/package-release.ps1`. HTTPS обязателен: production-cookie авторизации имеет флаг `Secure`.

Скрипты резервного копирования и проверки восстановления находятся в `deploy/ubuntu/`; процедура отката описана в [docs/uat/rollback.md](docs/uat/rollback.md).

Контейнер API применяет Prisma-миграции при запуске. Seed доступен только для отдельной UAT-базы и требует явных `ALLOW_UAT_SEED=true` и `UAT_PASSWORD` длиной не менее 12 символов. Не запускайте его для реальных данных.

Проведение теста описано в [сценарии для стейкхолдеров](docs/uat/stakeholder-test-guide.md), а выпуск и откат — в [rollback guide](docs/uat/rollback.md).

## Проверка перед запуском

В проекте проверены backend и frontend сборки, unit-тесты, форма отчёта и сквозной API-сценарий на отдельной локальной PostgreSQL. Импорт показывает источник каждой ячейки и сохраняет исторические результаты без пересчёта. Реальные XLSX-файлы остаются только источниками: приложение их не изменяет.
