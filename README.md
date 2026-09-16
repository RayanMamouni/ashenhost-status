# AshenHost Status 🛡️⚡

SaaS multi-tenant di uptime monitoring, incident management e status page pubbliche in stile BetterStack / Hyperping, con interfaccia ispirata al **Technical Dark Brutalism / Cyber-Minimalist**.

## 🚀 Caratteristiche Principali

- 📡 **Multi-Protocol Monitoring**: Check periodici HTTP/HTTPS, Ping/ICMP, TCP Port, Certificati SSL e DNS.
- ⚡ **Architettura Scalabile & Distribuita**: Next.js App Router per frontend/API + Node.js Worker asincrono alimentato da BullMQ & Redis.
- 🏢 **Multi-Tenancy & RBAC**: Organizzazioni isolate, gestione membri e ruoli (Admin, Member, Viewer).
- 🚨 **Incident Management & Timeline**: Creazione automatica di incidenti al superamento di soglie di errore, gestione manuale e timeline di risoluzione.
- 🌐 **Status Page Pubbliche**: Pagine dedicate per slug o custom domain con storico heartbeat a barre a 90 giorni.
- 🔔 **Multi-Channel Alerting**: Notifiche via Email (SMTP/Resend), Slack Webhook e Webhook generici.
- 🎨 **Design Cyber-Minimalist**: Strict Dark Mode (`#030303`), neon glow mirati, tipografia Space Grotesk / JetBrains Mono e sintassi terminale.
- 🐳 **Docker Native**: Deploy completo e sviluppo locale con Docker Compose.

---

## 🏗️ Struttura Monorepo

```
ashenhost-status/
├── apps/
│   ├── web/               # Next.js App Router (Dashboard, API, SSE, Status Page)
│   └── worker/            # Processo Node.js per monitoraggio periodico & notifiche
├── packages/
│   ├── database/          # Prisma ORM, schema & seed script
│   └── shared-types/      # Tipi TypeScript condivisi
├── docs/                  # Documentazione tecnica approfondita
├── docker-compose.yml     # Stack completa di produzione (Web, Worker, Postgres, Redis)
└── docker-compose.dev.yml # Dipendenze locali (Postgres + Redis)
```

---

## 🛠️ Avvio Rapido in Locale

### 1. Prerequisiti
- Node.js >= 18
- Docker & Docker Compose (o PostgreSQL e Redis installati localmente)

### 2. Configurazione
```bash
# Clona il repository
git clone https://github.com/RayanMamouni/ashenhost-status.git
cd ashenhost-status

# Crea il file di ambiente
cp .env.example .env

# Installa le dipendenze
npm install
```

### 3. Database & Cache
```bash
# Avvia Postgres e Redis in locale
docker compose -f docker-compose.dev.yml up -d

# Genera client Prisma e popola il database con dati di test
npm run db:push
npm run db:seed
```

### 4. Avvio Applicazione
```bash
# Avvia sia Web che Worker in contemporanea
npm run dev
```
- Dashboard Web: [http://localhost:3000](http://localhost:3000)
- Prisma Studio: `npm run db:studio` (su [http://localhost:5555](http://localhost:5555))

---

## 📚 Documentazione

- [Architettura di Sistema](docs/architecture.md)
- [Data Model & Schema Prisma](docs/data-model.md)
- [Guida al Deploy su VPS](docs/deployment.md)

---

## 📄 Licenza
Proprietario / AshenHost.
