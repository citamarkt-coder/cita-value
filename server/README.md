# Cita Value – Vollständige App (Server + Client)

**Stack:** Node.js (Express, ESM) · PostgreSQL · JWT-Auth · Stripe (Checkout + Portal + Webhook) · React (UMD, ohne Build)  
**Designfarben:** #17419B (Haupt), #0D9488 (Sekundär), #F7FAFC (Hintergrund)

---

## A) Windows PowerShell – Schnellstart

1. **ZIP entpacken** nach z. B.:  
   `C:\Users\<DU>\Desktop\CITA VALUE\cita-value-complete\server`

2. **PowerShell** öffnen und in den Ordner wechseln:
   ```powershell
   Set-Location "C:\Users\<DU>\Desktop\CITA VALUE\cita-value-complete\server"
   ```

3. **.env erstellen & bearbeiten:**
   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```
   Trage deine echte `DATABASE_URL`, `STRIPE_SECRET_KEY`, `PRICE_*` usw. ein.

4. **PostgreSQL bereitstellen**
   - Variante **Docker** (schnell):
     ```powershell
     docker run --name citadb -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cita -p 5432:5432 -d postgres:16
     docker exec -it citadb psql -U postgres -d cita -c "create extension if not exists pgcrypto;"
     docker cp "sql/schema.sql" citadb:/schema.sql
     docker exec -it citadb psql -U postgres -d cita -f /schema.sql
     ```
     Setze dann in `.env`:
     ```
     DATABASE_URL=postgres://postgres:postgres@localhost:5432/cita
     ```
   - Variante **lokal installiertes PostgreSQL**: Erstelle DB `cita` und führe `sql\schema.sql` aus (psql oder pgAdmin).

5. **npm Skripte erlauben (nur, wenn Fehler kommt)**:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

6. **Dependencies & Start**
   ```powershell
   npm install
   npm run dev
   ```
   → Öffne `http://localhost:8080`

---

## B) Stripe einrichten

1. Produkte/Preise in Stripe anlegen: `Starter` (19 €), `Pro` (59 €), `Expert` (129 €).  
   Trage **Price IDs** in `.env` ein: `PRICE_STARTER`, `PRICE_PRO`, `PRICE_EXPERT`.

2. Webhook-URL setzen (lokal via ngrok):
   ```powershell
   npx ngrok http 8080
   ```
   Dann im Stripe Dashboard:  
   `https://<deine-ngrok-id>.ngrok.io/api/stripe/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.*`

---

## C) Features
- **Login/Registrieren** (JWT), **/api/auth/me** gibt Abo-Status.
- **Checkout** & **Billing-Portal** (Stripe).
- **Projekte** (Anlegen, Bearbeiten, Speichern in DB).
- **Uploads** (PDF/DOCX/Images) mit Vorschau/Download (Server-Storage + DB).
- **Preisempfehlung** (NOI/LZ, Mietfaktor-Band, WEG-Risiko, Ampel).
- **Drucken/Export** (HTML, PDF via Browser-Print).

---

## D) Ordnerstruktur

```
server/
  client/                # React-UMD Client (ohne Build)
  sql/schema.sql         # Datenbank-Schema
  src/
    index.js             # Server-Entry
    db.js                # PG Pool
    middleware/auth.js   # JWT-Guard
    routes/
      auth.js            # Login/Register/Me
      public.js          # /api/public/config (Prices)
      billing.js         # Stripe Checkout/Portal
      webhook.js         # Stripe Webhook (roh)
      projects.js        # CRUD für Projekte
      uploads.js         # Upload/Download
  uploads/               # Upload-Dateien (lokal)
  .env.example
  package.json
```

---

## E) Sicherer Betrieb (Kurz)
- HTTPS aktivieren (Produktivbetrieb).
- CORS auf deine Domain begrenzen.
- Rate Limiting (z. B. `express-rate-limit`) ergänzen.
- Backups & Rotationsplan für Uploads/DB.

Viel Erfolg! – Wenn du konkrete Anpassungen brauchst (z. B. DOCX-Vorlagen, PDF-Renderer, Mandantenfähigkeiten), sag Bescheid.
