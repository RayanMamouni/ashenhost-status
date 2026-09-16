# Guida al Deployment su VPS con Docker Compose 🚀

Questa guida illustra la procedura per effettuare il deploy in produzione di **AshenHost Status** su una VPS Linux (Ubuntu / Debian).

## 1. Prerequisiti della VPS
- VPS con almeno **2 GB di RAM** e **1 vCPU** (consigliati 4 GB RAM per installazioni con molti monitor).
- Docker e Docker Compose installati:
```bash
# Installazione rapida Docker su Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## 2. Configurazione del Progetto sulla VPS

1. Clona il repository sulla macchina:
```bash
git clone https://github.com/RayanMamouni/ashenhost-status.git /opt/ashenhost-status
cd /opt/ashenhost-status
```

2. Crea e configura le variabili d'ambiente di produzione:
```bash
cp .env.example .env
nano .env
```
Assicurati di impostare:
- `POSTGRES_PASSWORD`: Una password robusta generata casualmente.
- `REDIS_PASSWORD`: Una password robusta per Redis.
- `NEXTAUTH_SECRET`: Generato con `openssl rand -base64 32`.
- `NEXTAUTH_URL`: L'URL pubblico finale del servizio (es. `https://status.ashenhost.com`).
- `NEXT_PUBLIC_APP_URL`: Idem come sopra.
- `SMTP_*`: I parametri per l'invio delle notifiche email.

---

## 3. Avvio dei Servizi

1. Esegui il build e l'avvio di tutti i container:
```bash
docker compose up -d --build
```

2. Applica le migrazioni del database ed esegui il seed iniziale se necessario:
```bash
docker compose exec web npm run db:push
docker compose exec web npm run db:seed
```

---

## 4. Configurazione Reverse Proxy (Nginx + SSL Certbot)

Esempio di configurazione per Nginx:

```nginx
server {
    server_name status.ashenhost.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Supporto per Server-Sent Events (SSE)
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

Abilita SSL con Let's Encrypt:
```bash
sudo certbot --nginx -d status.ashenhost.com
```

---

## 5. Manutenzione & Aggiornamenti

Per aggiornare l'applicazione con una nuova versione:
```bash
cd /opt/ashenhost-status
git pull origin main
docker compose up -d --build
```
