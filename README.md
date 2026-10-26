# Marinaco unified web app

One Node host for the Marinaco hub and both restaurant menus (Ugarit and Al Marsa), each keeping its own branding, data, and admin login.

## URLs

| Path | Purpose |
|------|---------|
| `/` | Marinaco landing page |
| `/ugarit/` | Ugarit guest menu |
| `/ugarit/admin` | Ugarit staff console |
| `/almarsa/` | Al Marsa guest menu |
| `/almarsa/admin` | Al Marsa staff console |

## Local development

```bash
cd apps/ugarit && npm install
cd ../almarsa && npm install
cd ../..
npm run build
npm start
```

Open `http://localhost:8080/`.

Set `UGARIT_ADMIN_PASSWORD` and `ALMARSA_ADMIN_PASSWORD` (12+ characters) in `.env` if credential files are not already present under each app’s `data/` folder.

If `npm start` fails with **EADDRINUSE** on port 3000 or 4177 (another dev server may be using them), set free internal ports before starting, for example:

```bash
# PowerShell
$env:ALMARSA_PORT='13000'; $env:UGARIT_PORT='14177'; npm start
```

## Hosting notes

This is **not** a static Netlify-only site. Menus and feedback are stored as JSON on disk, with uploaded images under each app’s `public/` tree. Use a Node host with a **persistent disk** and run:

```bash
npm run build && npm start
```

## After go-live (checklist)

- 301 redirect `brilliant-nougat-35cf2f.netlify.app` → `https://<your-domain>/ugarit/`
- 301 redirect `symphonious-baklava-8ee5f8.netlify.app` → `https://<your-domain>/almarsa/`
- Reprint table QR codes to the new domain when ready
