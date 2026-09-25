# Ubuntu Stakeholder UAT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подготовить LRT к управляемому тесту стейкхолдерами на одном сервере Ubuntu с HTTPS, отдельной тестовой базой, воспроизводимыми демоданными, резервным копированием, проверяемым развёртыванием и сценарием приёмки по четырём ролям.

**Architecture:** Один Ubuntu 24.04 LTS сервер запускает `db`, `api` и `web` через Docker Compose с фиксированным project name `lrt`. Контейнерный nginx отдаёт SPA и проксирует `/api`, но слушает только `127.0.0.1:8080`; системный nginx завершает TLS на 80/443. PostgreSQL не публикуется наружу, миграции применяет entrypoint API, а UAT-данные создаются отдельной явно разрешённой командой.

**Tech Stack:** Ubuntu 24.04 LTS, Docker Engine, Docker Compose v2, nginx, Certbot, PostgreSQL 17, Node.js 22 containers, NestJS 12, React 19, Prisma 6.

**Spec:** `roadmap documentation/11_development_plan.md`, `roadmap documentation/08_nfr_scope_and_open_questions.md`, `README.md`, запрос владельца проекта от 2026-09-21 о подготовке стейкхолдерского теста на Ubuntu.

## Global Constraints

- Среда предназначена только для UAT; реальные производственные данные в неё не загружаются.
- Сервер: Ubuntu 24.04 LTS, минимум 2 vCPU, 4 GB RAM, 30 GB SSD, публичный IPv4.
- Для входа обязателен домен с HTTPS: production-cookie имеет флаг `Secure` и не должен тестироваться через обычный HTTP/IP.
- Наружу открыты только TCP 22, 80 и 443; порты PostgreSQL 5432 и API 4000 остаются внутри Docker, web-порт 8080 привязан к loopback.
- `PUBLIC_ORIGIN` содержит единственный фактический HTTPS-origin без завершающего `/`.
- Секреты не попадают в репозиторий, release-архив, логи, скриншоты и stakeholder guide.
- Перед каждым обновлением создаётся логический dump PostgreSQL; откат схемы выполняется восстановлением dump, а не запуском обратных Prisma-миграций.
- Base seed и yearly demo разрешены только при `ALLOW_UAT_SEED=true`; пароли передаются через окружение и не имеют значения по умолчанию.
- Google OAuth и email reset входят в UAT только при наличии отдельных тестовых credentials. Без них эти пункты явно исключаются из приглашения и чек-листа.
- Исторический XLSX импортируется только администратором; максимальный размер запроса на внешнем nginx — 25 MB при лимите приложения 20 MB.

## Review Focus

- HTTPS/proxy: cookie входа должна устанавливаться и отправляться после редиректов; проверяется в Task 5 и Task 8.
- Свежая и уже мигрированная БД: `prisma migrate deploy` должен одинаково успешно запускаться в обоих случаях; проверяется в Task 2 и Task 7.
- Повторный UAT seed: второй запуск не создаёт дубликаты назначений, отчётов и пользователей; проверяется в Task 3.
- Импорт 20 MB: внешний nginx не должен вернуть 413 раньше Nest/Multer; проверяется в Task 5 и Task 8.
- Откат после несовместимой миграции: восстановление dump должно вернуть логин, отчёты и назначения; проверяется в Task 6.

---

## File Map

- `backend/src/health/*` — публичный минимальный health endpoint с проверкой БД.
- `backend/src/auth/*` — выключение публичной регистрации в UAT по умолчанию.
- `backend/prisma/seed.cjs` — базовая конфигурация и четыре ролевых аккаунта без захардкоженного пароля.
- `backend/prisma/seed-yearly-demo.cjs` — идемпотентные годовые демоданные с паролем из окружения.
- `backend/test/acceptance.cjs` — безопасный smoke с настраиваемым URL и без зависимости от порта 4001.
- `compose.yaml`, `.env.example` — healthchecks, loopback bind, лимиты логов и полный набор переменных.
- `deploy/ubuntu/nginx-lrt.conf.template` — TLS reverse proxy, rate limits и 25 MB upload.
- `deploy/ubuntu/install-host.sh` — проверяемая установка host dependencies и nginx-site.
- `deploy/ubuntu/backup.sh`, `restore-check.sh` — dump, retention и проверка восстановления.
- `deploy/ubuntu/lrt-backup.service`, `lrt-backup.timer` — ежедневный бэкап.
- `deploy/uat/package-release.ps1` — release-архив с checksum из текущего Windows workspace без секретов и build artifacts.
- `deploy/uat/preflight.sh`, `deploy/uat/smoke.cjs` — preflight и post-deploy проверки.
- `docs/uat/stakeholder-test-guide.md` — роли, сценарии, ожидаемые результаты и порядок фиксации замечаний.
- `docs/uat/known-limitations.md` — функции, намеренно не включённые в конкретный UAT-сеанс.
- `docs/uat/issue-template.md` — единый формат дефекта.

### Task 1: Зафиксировать UAT-контракт и локальный baseline

**Files:**
- Create: `docs/uat/known-limitations.md`
- Create: `deploy/uat/preflight.sh`
- Modify: `backend/test/acceptance.cjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: текущие команды `npm run build`, Jest/Vitest и `docker compose`.
- Produces: `LRT_BASE_URL`, `UAT_LEADER_EMAIL`, `UAT_PASSWORD` как единый интерфейс smoke scripts; таблицу включённых функций UAT.

- [ ] **Step 1: Записать scope UAT**

  В `docs/uat/known-limitations.md` зафиксировать: email/password, четыре роли, отчёт, годовые рейтинги, смена лидера, импорт, аудит, редактирование метрик и справочник кофеен входят; Google OAuth и password reset входят только при переданных credentials; запуск на боевом сервере не входит.

- [ ] **Step 2: Сделать acceptance script независимым от локального порта**

  Заменить `const base = 'http://localhost:4001/api'` на:

  ```js
  const base = `${process.env.LRT_BASE_URL || 'http://localhost:8080'}/api`;
  const email = process.env.UAT_LEADER_EMAIL || 'leader@skuratovcoffee.ru';
  const password = process.env.UAT_PASSWORD;
  if (!password) throw new Error('UAT_PASSWORD is required');
  ```

- [ ] **Step 3: Добавить preflight script**

  `deploy/uat/preflight.sh` должен выполнить `docker compose config`, backend unit tests, frontend tests, обе production-сборки и `node --check` для `.cjs` smoke scripts; любой сбой завершает скрипт ненулевым кодом.

- [ ] **Step 4: Запустить baseline**

  Run:

  ```bash
  npm test --workspace=backend -- --runInBand test/unit
  npm test --workspace=frontend
  npm run build --workspace=backend
  npm run build --workspace=frontend
  ```

  Expected: все suites PASS, обе сборки завершаются с exit code 0.

- [ ] **Step 5: Обновить README**

  Добавить ссылки на `deploy/uat/preflight.sh`, UAT guide, backup/restore и обязательность HTTPS.

### Task 2: Добавить health endpoint и безопасный lifecycle контейнеров

**Files:**
- Create: `backend/src/health/health.controller.ts`
- Create: `backend/src/health/health.module.ts`
- Create: `backend/test/unit/health.controller.spec.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `compose.yaml`

**Interfaces:**
- Produces: `GET /api/health -> { status: 'ok', database: 'ok' }`, HTTP 200 только при доступной БД.
- Consumes: `PrismaService.$queryRaw` и Docker Compose health conditions.

- [ ] **Step 1: Написать падающий unit test health endpoint**

  ```ts
  it('reports readiness only after a database query succeeds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) };
    await expect(new HealthController(prisma as any).getHealth())
      .resolves.toEqual({ status: 'ok', database: 'ok' });
  });
  ```

- [ ] **Step 2: Реализовать endpoint и подключить module**

  Endpoint не должен возвращать версию БД, credentials или stack traces.

- [ ] **Step 3: Добавить Compose healthchecks**

  Для API проверять `http://localhost:4000/api/health`, для web — `http://localhost/`; web зависит от healthy API. Добавить `stop_grace_period: 20s` и logging limits `max-size: 10m`, `max-file: 5`.

- [ ] **Step 4: Проверить fresh и existing database paths**

  На одноразовом project name выполнить fresh start дважды. Первый запуск применяет все миграции, второй сообщает, что новых миграций нет; оба заканчиваются healthy.

### Task 3: Сделать UAT seed безопасным и идемпотентным

**Files:**
- Modify: `backend/prisma/seed.cjs`
- Modify: `backend/prisma/seed-yearly-demo.cjs`
- Create: `backend/test/uat-seed-smoke.cjs`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `ALLOW_UAT_SEED=true`, `UAT_PASSWORD`, `UAT_YEAR`.
- Produces: четыре ролевых аккаунта, два города, четыре кофейни и 48 submitted reports за `UAT_YEAR`.

- [ ] **Step 1: Написать smoke assertions до исправления seed**

  Проверить количество пользователей по ролям, отсутствие открытых дублей `UserCoffeeShopAssignment`, 12 отчётов на каждую демо-кофейню и сохранённый `submittedById`.

- [ ] **Step 2: Убрать несовместимый unique selector**

  В `seed.cjs` заменить устаревший `userId_coffeeShopId` на `findFirst({ assignedUntil: null })` плюс `create`, как уже сделано в yearly seed.

- [ ] **Step 3: Убрать `password123` из серверного seed**

  Оба seed scripts завершаются ошибкой, если `ALLOW_UAT_SEED !== 'true'`, `UAT_PASSWORD` отсутствует или короче 12 символов. `UAT_YEAR` по умолчанию равен текущему календарному году сервера.

- [ ] **Step 4: Проверить повторный запуск**

  Run base seed и yearly seed дважды. Expected: одинаковые counts после обоих запусков, без unique violations и без новых назначений.

- [ ] **Step 5: Зафиксировать выдачу credentials**

  В документации указать только email-адреса ролей. Пароль передавать стейкхолдерам отдельным защищённым каналом и сменить после UAT.

### Task 4: Закрыть публичное создание аккаунтов и дополнить env-контракт

**Files:**
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/test/unit/auth.service.spec.ts`
- Modify: `compose.yaml`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `ALLOW_SELF_REGISTRATION=false` по умолчанию.
- Produces: `/api/auth/register` возвращает 403 в UAT; заранее созданные пользователи продолжают входить.

- [ ] **Step 1: Написать тест отключённой регистрации**

  При `ALLOW_SELF_REGISTRATION=false` `register()` должен завершиться `ForbiddenException`; при явном `true` существующий сценарий регистрации остаётся рабочим.

- [ ] **Step 2: Реализовать feature gate**

  Не удалять endpoint, чтобы локальная разработка могла включить его явно.

- [ ] **Step 3: Исправить password reset variables**

  Передавать в API фактически используемые `PASSWORD_RESET_EMAIL_API_KEY`, `PASSWORD_RESET_FROM_EMAIL`, `PASSWORD_RESET_EMAIL_API_URL`; удалить неиспользуемый `PASSWORD_RESET_FROM` из `.env.example`.

- [ ] **Step 4: Проверить auth matrix**

  Login/refresh/logout проходят; register закрыт; forgot-password либо отправляет тестовое письмо через настроенный provider, либо явно исключён из stakeholder guide.

### Task 5: Подготовить Ubuntu nginx, TLS и сетевую границу

**Files:**
- Create: `deploy/ubuntu/nginx-lrt.conf.template`
- Create: `deploy/ubuntu/install-host.sh`
- Modify: `compose.yaml`

**Interfaces:**
- Consumes: обязательные `LRT_DOMAIN`, `LETSENCRYPT_EMAIL`.
- Produces: HTTPS endpoint `https://$LRT_DOMAIN`, HTTP→HTTPS redirect, proxy на `127.0.0.1:8080`.

- [ ] **Step 1: Привязать контейнерный web только к loopback**

  Compose mapping:

  ```yaml
  ports:
    - "127.0.0.1:${HTTP_PORT:-8080}:80"
  ```

- [ ] **Step 2: Создать nginx template**

  Добавить `client_max_body_size 25m`, `proxy_read_timeout 60s`, forwarded headers, WebSocket-compatible headers, security headers и отдельные rate limits: login 10 req/min/IP, forgot/register 5 req/min/IP, остальные API 120 req/min/IP.

- [ ] **Step 3: Создать idempotent install-host.sh**

  Script проверяет Ubuntu 24.04, устанавливает Docker из официального Docker apt repository, Compose plugin, nginx, certbot; включает UFW для OpenSSH/Nginx Full; создаёт `/opt/lrt` и `/var/backups/lrt`.

- [ ] **Step 4: Проверить TLS и 20 MB upload**

  `curl -I http://$LRT_DOMAIN` возвращает redirect на HTTPS; `curl https://$LRT_DOMAIN/api/health` возвращает 200; 20 MB XLSX доходит до preview, файл больше 20 MB получает контролируемый 413 от приложения.

### Task 6: Добавить резервное копирование и проверяемый откат

**Files:**
- Create: `deploy/ubuntu/backup.sh`
- Create: `deploy/ubuntu/restore-check.sh`
- Create: `deploy/ubuntu/lrt-backup.service`
- Create: `deploy/ubuntu/lrt-backup.timer`
- Create: `docs/uat/rollback.md`

**Interfaces:**
- Produces: gzip custom-format dump `/var/backups/lrt/lrt-YYYYmmdd-HHMMSS.dump`, SHA-256 checksum, retention 14 дней.
- Consumes: Compose project `lrt`, service `db`, `.env` в `/opt/lrt/current`.

- [ ] **Step 1: Реализовать backup.sh**

  Использовать `docker compose -p lrt exec -T db pg_dump -Fc`; временный `.partial` переименовывать только после успешного dump и checksum.

- [ ] **Step 2: Реализовать restore-check.sh**

  Создать временную БД `lrt_restore_check`, восстановить последний dump, проверить counts пользователей/кофеен/отчётов и удалить только временную БД.

- [ ] **Step 3: Добавить systemd timer**

  Ежедневный запуск в 02:30 Asia/Omsk и обязательный ручной backup непосредственно перед deploy.

- [ ] **Step 4: Провести rehearsal восстановления**

  Expected: checksum совпадает, restore завершён, smoke login на основной БД продолжает работать, временная БД удалена.

### Task 7: Создать воспроизводимый release и развернуть его на Ubuntu

**Files:**
- Create: `deploy/uat/package-release.ps1`
- Create: `deploy/uat/release-excludes.txt`
- Create: `docs/uat/deployment-runbook.md`

**Interfaces:**
- Produces: `lrt-uat-<UTC timestamp>.tar.gz`, `.sha256`, `release-manifest.json` с source file hashes.
- Consumes: текущий workspace; `.env`, `node_modules`, `dist`, `.local`, `graphify-out` и Google exports исключены.

- [ ] **Step 1: Создать release packager**

  Script должен отказать, если в архив попали `.env`, XLSX, дампы, логи или `node_modules`.

- [ ] **Step 2: Передать и проверить release**

  На сервере сверить `sha256sum -c`, распаковать в `/opt/lrt/releases/<release-id>`, обновить `/opt/lrt/current` только после успешного preflight.

- [ ] **Step 3: Создать secrets**

  На сервере сгенерировать `POSTGRES_PASSWORD` и `JWT_SECRET` через `openssl rand -base64 48`, записать `/opt/lrt/shared/.env` с mode 600 и symlink в current release. `PUBLIC_ORIGIN=https://$LRT_DOMAIN`, `HTTP_PORT=8080`, `ALLOW_SELF_REGISTRATION=false`.

- [ ] **Step 4: Первый запуск**

  Run:

  ```bash
  cd /opt/lrt/current
  docker compose -p lrt config
  docker compose -p lrt up -d --build
  docker compose -p lrt ps
  curl --fail https://$LRT_DOMAIN/api/health
  ```

  Expected: `db`, `api`, `web` healthy; наружу опубликован только host nginx.

- [ ] **Step 5: Однократно заполнить UAT-базу**

  Передать `UAT_PASSWORD` интерактивно, выполнить base seed и yearly demo с `ALLOW_UAT_SEED=true`, затем удалить переменную из shell history/environment.

- [ ] **Step 6: Выполнить post-deploy smoke**

  Проверить логин четырёх ролей, scope города/кофейни, годовые рейтинги, чтение отчёта и health. Smoke не должен менять рейтинги и конфигурацию.

### Task 8: Подготовить сценарий теста стейкхолдерами

**Files:**
- Create: `docs/uat/stakeholder-test-guide.md`
- Create: `docs/uat/issue-template.md`
- Create: `deploy/uat/smoke.cjs`

**Interfaces:**
- Produces: 60–90-минутный сценарий, единый defect format, go/no-go checklist.

- [ ] **Step 1: Описать данные и роли**

  Два города, по две кофейни, четыре лидера, 12 месяцев рейтингов; отдельно admin, COO и city leader. В guide не указывать пароли.

- [ ] **Step 2: Зафиксировать сценарии**

  1. Leader: вход, имя/кофейня в навигации, выбор периода, автосохранение чисел и анализа, цвет, submit, история.
  2. City leader: только свой город, средний балл, drill-down, редактирование и комментарий.
  3. COO: переключатель города/кофейни, средние по городу, годовая таблица и разные авторы по месяцам.
  4. Admin: изменение назначения лидера с датами, сохранение истории, редактирование метрики, деактивация/активация кофейни, аудит.
  5. Import: preview утверждённого XLSX, выбор заполненного месяца, confirm, защита от повторного импорта.
  6. Responsive: desktop 1440×900 и mobile 390×844, включая sidebar и custom dropdown placement.

- [ ] **Step 3: Создать issue template**

  Поля: роль, URL, экран, время и timezone, шаги, ожидаемое, фактическое, screenshot, severity P0–P3, блокирует ли продолжение, test account email без пароля.

- [ ] **Step 4: Определить exit criteria**

  Нет P0/P1; все шесть сценариев пройдены; P2 имеют owner и решение; backup/restore проверены; 24 часа после сессии нет повторяющихся 5xx и контейнерных restart loops.

### Task 9: Провести dry run, UAT и закрыть среду

**Files:**
- Modify: `docs/uat/stakeholder-test-guide.md` только фактическими результатами и ссылками на заведённые дефекты.

**Interfaces:**
- Consumes: healthy deployment, stakeholder guide, credentials, backup.
- Produces: подписанный go/no-go результат UAT и список изменений перед отдельным production launch.

- [ ] **Step 1: Внутренний dry run за день до сессии**

  Пройти сценарии всеми ролями с чистого browser profile; отдельно проверить XLSX upload и смену лидера.

- [ ] **Step 2: Снять baseline backup**

  Создать dump и записать release id, image ids, migration status и counts основных таблиц.

- [ ] **Step 3: Провести stakeholder session**

  Один ведущий управляет последовательностью, стейкхолдеры выполняют действия сами, наблюдатель фиксирует дефекты по шаблону; исправления во время сессии не выкатываются, кроме P0, полностью блокирующего вход.

- [ ] **Step 4: Наблюдать среду 24 часа**

  Проверить `docker compose ps`, restart counts, nginx 5xx, disk usage и backup timer. Секреты и полные request bodies в отчёт не копировать.

- [ ] **Step 5: Принять решение**

  Если exit criteria выполнены — зафиксировать UAT accepted и составить отдельный production deployment plan. Если нет — восстановить baseline при повреждении данных, исправить P0/P1 и повторить только затронутые сценарии плюс smoke всех ролей.

## Recommended Schedule

- День 1: Tasks 1–4, автоматические тесты и seed rehearsal.
- День 2: Tasks 5–7, Ubuntu deploy, TLS, backup/restore rehearsal.
- День 3: Task 8 и внутренний dry run.
- День 4: stakeholder session.
- День 5: 24-hour observation, triage и go/no-go.

## Inputs Required Before Task 5

- DNS-имя UAT-сервиса и доступ к его A-record.
- Ubuntu SSH host/user и подтверждение, что можно открыть 80/443.
- Email для Let's Encrypt уведомлений.
- Решение, входят ли Google OAuth и password reset в эту UAT-сессию; при включении — отдельные тестовые credentials.
- Список stakeholder emails для аккаунтов и защищённый канал передачи временного пароля.
- Один утверждённый XLSX для импорт-сценария; файл не включается в release archive.
