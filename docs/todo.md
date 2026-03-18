# Pusula TODO

## Güvenlik

- [ ] **HTTPS / TLS** — Webhook'lar şu an HTTP üzerinden geliyor (`http://138.199.193.143:3000/`). GitHub → sunucu arası trafik şifresiz. Nginx reverse proxy + Let's Encrypt ile HTTPS zorunlu:
  ```bash
  apt install nginx certbot python3-certbot-nginx
  # domain yönlendir → certbot al → nginx config
  ```
  Webhook URL'i `https://` olarak güncelle.

- [ ] **Webhook Secret doğrulaması** — `.env`'de `WEBHOOK_SECRET` ayarlandı ama probot bunu otomatik doğruluyor. Sunucudaki `.env` değerinin GitHub App ayarlarındaki ile birebir eşleştiği teyit edilmeli.

- [ ] **PAT token git credential cache** — `setup.sh` çalıştırılırken PAT token URL içinde geçti (`https://<PAT>@github.com`). Git credential cache'de kalıyor olabilir:
  ```bash
  git -C /opt/pusula credential reject  # veya
  git config --global credential.helper ""
  ```
  Uzun vadede deploy key veya GitHub Actions OIDC kullanılmalı.

- [ ] **`/opt/pusula/.env` izinleri** — `chmod 600` yapıldı, `chown` ile sadece uygulama user'ına verilmeli. Şu an root:root.

- [ ] **Uygulama root olarak çalışıyor** — PM2 ve pusula root user ile çalışıyor. Dedicated `pusula` user oluşturulup least-privilege ile çalıştırılmalı:
  ```bash
  useradd -r -s /bin/false pusula
  chown -R pusula:pusula /opt/pusula
  # pm2 ekosistemi pusula user altında
  ```

- [ ] **Rate limiting** — `/api/github/webhooks` endpoint'i herhangi bir rate limit olmadan herkese açık. Nginx katmanında IP-based rate limiting eklenmeli.

## Eksik Özellikler

- [ ] **`GITHUB_TOKEN` .env'de boş** — `.env.example`'da `GITHUB_TOKEN=` var ama probot App kimlik doğrulamasıyla çalışıyor. Bu alan gereksiz mi, kaldırılmalı mı netleştirilmeli.

- [ ] **PM2 startup** — `pm2 startup` komutu çalıştırılmadı. Sunucu reboot olursa PM2 daemon başlasa da `pm2 save` yapıldığı için prosesler geri gelir — ama `pm2 startup systemd` çalıştırılırsa daha güvenilir:
  ```bash
  pm2 startup systemd -u root
  ```

- [ ] **Loglama** — PM2 logları `/root/.pm2/logs/` altında birikecek. Log rotation ayarlanmalı:
  ```bash
  pm2 install pm2-logrotate
  ```

- [ ] **GitHub Actions CI** — Pusula için test + build pipeline yok. PR açıldığında `npm test` otomatik çalışmalı.

- [ ] **`setup.sh` PAT alanı boş** — Sıfırdan kurulum için PAT ve REPO_ORG doldurulması gerekiyor, otomatik değil. Deploy key alternatifi değerlendirilmeli.

## İyileştirmeler

- [ ] **`dist/` klasörünü git'e ekle** — Her deploy'da `tsc` derleme adımı kaldırılır, deploy süresi ~10s kısalır. `.gitignore`'dan `dist/` çıkarılmalı.

- [ ] **`start.sh` yerine PM2 ecosystem.config.js** — `start.sh` wrapper yerine `ecosystem.config.js` kullanmak daha temiz ve `env_file` desteği sağlar.

- [ ] **Health endpoint** — Probot'un `/probot` sayfası health check için kullanılıyor ama bu UI sayfası. Dedicated `/health` endpoint'i eklenebilir (Express middleware ile).
