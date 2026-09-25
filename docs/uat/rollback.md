# Обновление и откат LRT

Обновляйте UAT в согласованное окно, когда участники не редактируют отчёты. Перед переключением выпуска сделайте дамп и проверьте его восстановление:

```bash
sudo bash /opt/lrt/current/deploy/ubuntu/backup.sh
sudo bash /opt/lrt/current/deploy/ubuntu/restore-check.sh
```

Распакуйте новый архив в отдельный каталог `/opt/lrt/releases/<release>`, проверьте checksum и manifest. Затем переключите ссылку и перезапустите приложение:

```bash
sudo ln -sfn /opt/lrt/releases/<release> /opt/lrt/current
cd /opt/lrt/current
sudo docker compose -p lrt --env-file /opt/lrt/shared/.env up -d --build
sudo docker compose -p lrt --env-file /opt/lrt/shared/.env ps
curl -fsS https://rating.example.ru/api/health
```

Если новая версия не стартовала до миграции данных, верните ссылку на предыдущий release и выполните `up -d --build` из его каталога. Если миграция успела изменить схему или данные несовместимым образом, верните каталог предыдущего release, остановите API/web, восстановите последний проверенный дамп и затем поднимите сервисы:

```bash
sudo docker compose -p lrt --env-file /opt/lrt/shared/.env stop api web
sudo env RESTORE_LRT_CONFIRM=YES bash /opt/lrt/current/deploy/ubuntu/restore.sh /var/backups/lrt/lrt-<timestamp>.dump
cd /opt/lrt/current
sudo docker compose -p lrt --env-file /opt/lrt/shared/.env up -d
curl -fsS https://rating.example.ru/api/health
```

Восстановление заменяет текущее содержимое тестовой базы состоянием дампа и удалит изменения, появившиеся после его создания. Поэтому перед восстановлением сохраните отдельный дамп текущего состояния, если он может понадобиться для разбора. `restore-check.sh` проверяет dump во временной базе и не меняет рабочую базу.
