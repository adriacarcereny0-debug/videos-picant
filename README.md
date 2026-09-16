# Madrastras

Plataforma web **premium de vídeo privado bajo suscripción**, exclusiva para mayores de 18 años.
Identidad, diseño, arquitectura y código originales.

El producto hace exactamente una cosa: **vender acceso a un catálogo privado de vídeo mediante
dos suscripciones mensuales y proteger ese contenido**. No incluye sorteos, directos, webcams,
chats, propinas, monedas virtuales, marketplace ni gamificación.

---

## 1. Resumen funcional

| Área | Qué hace |
| --- | --- |
| Acceso | Verificación de edad obligatoria, registro, login, verificación de correo, recuperación de contraseña |
| Suscripciones | Dos planes mensuales: **Básico 9,99 €** y **Premium 19,99 €** |
| Pagos | Stripe Checkout + Billing + Customer Portal + webhooks firmados |
| Contenido | Catálogo con niveles `BASIC` / `PREMIUM`, fichas bloqueadas y reproductor propio |
| Portada | El hero usa la imagen del vídeo que marques como destacado en `/admin/videos`; con varios, rota |
| Protección | Almacenamiento privado, URLs firmadas de caducidad corta, autorización siempre en servidor |
| Cuenta | Dashboard, gestión de suscripción, notificaciones, perfil |
| Administración | Panel completo en `/admin`: métricas, vídeos, usuarios, suscripciones, reportes y ajustes |

---

## 2. Arquitectura

```
Navegador ──► Next.js (App Router, RSC)
                 │
                 ├── Proxy de borde  ......  verificación de edad + redirección de rutas privadas
                 ├── Server Components ....  render con datos ya autorizados
                 ├── Route Handlers .......  API (auth, checkout, webhooks, admin, streaming)
                 │
                 ├──► PostgreSQL (Prisma)    usuarios, suscripciones, vídeos, notificaciones…
                 ├──► Object Storage PRIVADO vídeos y miniaturas (S3 / R2 / B2)
                 ├──► Stripe                 Checkout, Billing, Portal, Webhooks
                 └──► SMTP                   correos transaccionales
```

**Separación de responsabilidades**

- **Frontend**: `src/app/**` (páginas), `src/components/**` (UI). Nunca decide permisos.
- **Backend**: `src/app/api/**` (endpoints) y `src/lib/**` (dominio: auth, storage, stripe, vídeos).
- **Base de datos**: `prisma/schema.prisma`, acceso exclusivo desde el servidor.
- **Almacenamiento**: `src/lib/storage.ts`, con tres drivers intercambiables (`blob`, `s3` y `local`).
- **Pagos**: `src/lib/stripe.ts` + `src/app/api/stripe/webhook`.

### Stack

- Next.js 16 (App Router) · React 19 · TypeScript estricto
- Tailwind CSS 4 (sistema de diseño propio con tokens en `globals.css`)
- PostgreSQL + Prisma 6
- Stripe SDK · Nodemailer · Zod · bcrypt · jose

---

## 3. Modelo de datos

`users`, `sessions`, `verification_tokens`, `login_attempts`, `subscriptions`,
`subscription_events`, `processed_webhook_events`, `videos`, `video_renditions`,
`video_views`, `notifications`, `reports`, `security_logs`, `settings`, `contact_messages`.

Definición completa y relaciones en [`prisma/schema.prisma`](prisma/schema.prisma).

---

## 4. Control de acceso

Tres estados efectivos, derivados **siempre** del estado real de la suscripción en base de datos:

| Estado | Navegar | Reproducir Básico | Reproducir Premium |
| --- | :---: | :---: | :---: |
| `FREE` | ✅ | ❌ | ❌ |
| `BASIC` | ✅ | ✅ | ❌ |
| `PREMIUM` | ✅ | ✅ | ✅ |

El plan efectivo se calcula en `effectivePlan()` (`src/lib/auth.ts`): exige suscripción `ACTIVE`
o `TRIALING` y periodo vigente. Si el periodo caduca, el usuario vuelve a `FREE` aunque la fila
diga otra cosa.

**La autorización de reproducción vive en un único sitio**: `authorizePlayback()`
(`src/lib/videos.ts`). Comprueba sesión, estado de cuenta, publicación del vídeo y cobertura del
plan, y solo entonces emite URLs firmadas. El frontend nunca participa en la decisión: recibe
`unlocked: true|false` ya resuelto y, si está bloqueado, sencillamente no existe ninguna URL de
vídeo que pueda usar.

---

## 5. Protección de los vídeos

1. Los ficheros **nunca** se guardan en `public/`. En desarrollo van a `storage/` (fuera del
   árbol servido); en producción, a **Vercel Blob privado** (`access: "private"`) o a un
   **bucket privado** S3/R2 sin acceso anónimo.
2. Antes de generar cualquier acceso se comprueban los permisos en el servidor.
3. El acceso se entrega como **URL firmada con caducidad corta** (por defecto 15 min):
   - driver `blob`: URL prefirmada de Vercel Blob (`issueSignedToken` + `presignUrl`);
   - driver `s3`: URL prefirmada del proveedor;
   - driver `local`: `/api/stream/<jwt>` con token HS256 firmado, verificado en cada petición.
4. La ruta real del objeto no se expone jamás al cliente.
5. El streaming responde a `Range` (206) para permitir el salto de posición, con
   `Cache-Control: private, no-store` y `X-Robots-Tag: noindex`.
6. Cada concesión y cada denegación quedan registradas en `security_logs`.

> Una URL firmada es una credencial temporal: quien la tiene puede reproducir hasta que caduque.
> Ese es el mismo modelo que usan los presigned URLs de S3. Ajusta `SIGNED_URL_TTL_SECONDS` al
> compromiso que quieras entre seguridad y duración de las reproducciones.

---

## 6. Seguridad implementada

- Contraseñas con **bcrypt** (coste 12). Nunca en claro, nunca reversibles.
- Sesiones opacas: el token viaja en cookie **HttpOnly + Secure + SameSite=Lax**; en base de
  datos solo se guarda su **hash SHA-256**. Revocables una a una o todas a la vez.
- **Rate limiting** en registro, login (por IP *y* por cuenta), recuperación, reportes,
  contacto y checkout.
- Mensajes genéricos en login y recuperación: no se puede enumerar qué correos existen.
- **Validación de entrada con Zod** en todos los endpoints.
- **Webhooks de Stripe verificados criptográficamente** (`constructEvent`) y procesados de forma
  **idempotente** mediante `processed_webhook_events`.
- Rutas `/admin` protegidas por rol en el servidor, en cada petición (`requireAdmin`,
  `guardAdmin`), no solo por navegación.
- Cambio de contraseña ⇒ revocación de todas las sesiones. Suspensión de cuenta ⇒ ídem.
- Cabeceras de seguridad: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`. Las zonas privadas se marcan `noindex`.
- Protección XSS por el escapado por defecto de React (sin `dangerouslySetInnerHTML`) y CSRF por
  cookies `SameSite=Lax` + endpoints mutadores que solo aceptan JSON/multipart.
- El panel **no muestra datos bancarios**: la plataforma solo guarda identificadores de Stripe.
- Las claves privadas (Stripe, almacenamiento, SMTP) existen **solo** en variables de entorno
  del servidor; no hay ninguna clave en el bundle del navegador.

---

## 7. Flujo de pago

```
Usuario ──► POST /api/checkout ──► Stripe Checkout ──► pago
                                                        │
                        webhook firmado ◄───────────────┘
                                │
   customer.subscription.created/updated → plan + estado + periodo en BD
   invoice.paid                          → notificación + email de confirmación
   invoice.payment_failed                → estado PAST_DUE + aviso
   customer.subscription.deleted         → vuelta a FREE
   invoice.upcoming                      → recordatorio de renovación
                                │
                                ▼
                   El acceso al contenido se recalcula solo
```

Cambio de plan, método de pago, facturas y cancelación se gestionan desde **Mi suscripción**
(`/subscription`) y el **Customer Portal** de Stripe.

### Configurar Stripe

1. Crea dos productos con precio **recurrente mensual**: 9,99 € y 19,99 € (EUR).
2. Copia sus `price_…` a `STRIPE_PRICE_BASIC` y `STRIPE_PRICE_PREMIUM`.
3. Crea un endpoint de webhook apuntando a `https://TU-DOMINIO/api/stripe/webhook` con los
   eventos: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`,
   `invoice.payment_failed`, `invoice.upcoming`.
4. Copia el secreto de firma a `STRIPE_WEBHOOK_SECRET`.
5. Activa el **Customer Portal** en el dashboard de Stripe.

Pruebas en local:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 8. Puesta en marcha

```bash
npm install
cp .env.example .env          # rellena los valores
npm run db:push               # crea el esquema
npm run db:seed               # datos ficticios de demostración
npm run dev                   # http://localhost:3000
```

### Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@madrastras.example` | `Madrastras2026Admin` |
| Free | `free@madrastras.example` | `Demo2026Cuenta` |
| Básico | `basic@madrastras.example` | `Demo2026Cuenta` |
| Premium | `premium@madrastras.example` | `Demo2026Cuenta` |

El *seed* genera fichas con miniatura, pero **sin archivo de vídeo reproducible**. Para
reproducir de verdad en la demo: sube vídeos desde `/admin/videos`, o siembra con un MP4 real:

```bash
SEED_VIDEO_PATH=/ruta/a/demo.mp4 npm run db:seed
```

### Modo demostración

Sin claves de Stripe (`DEMO_MODE=true`), el checkout **simula** la activación del plan para poder
recorrer el producto de punta a punta. **En producción, pon `DEMO_MODE=false`** y configura
Stripe: el checkout simulado queda desactivado.

---

## 9. Variables de entorno

Todas están documentadas en [`.env.example`](.env.example), separadas por bloque: general, base
de datos, sesiones, Stripe, almacenamiento, correo y *seed*.

**Imprescindibles en producción**

| Variable | Motivo |
| --- | --- |
| `DATABASE_URL` | PostgreSQL |
| `SESSION_SECRET` | Firma de sesiones y tokens de vídeo (32+ caracteres aleatorios) |
| `APP_URL` | URL pública **https**, usada en correos y en Stripe |
| `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` | Pagos y verificación de webhooks |
| `STRIPE_PRICE_BASIC` · `STRIPE_PRICE_PREMIUM` | Precios recurrentes |
| `STORAGE_DRIVER=s3` + credenciales `S3_*` | Bucket **privado** de vídeo |
| `SMTP_*` · `MAIL_FROM` | Correos transaccionales |
| `DEMO_MODE=false` | Desactiva el checkout simulado |

---

## 10. Estructura del proyecto

```
prisma/
  schema.prisma          Modelo de datos
  seed.ts                Datos ficticios de demostración
src/
  app/
    (site)/              Público: landing, catálogo, ficha, precios, legales, contacto
    (auth)/              Registro, login, recuperación, verificación
    (app)/               Privado: dashboard, suscripción, notificaciones, perfil
    admin/               Panel de administración
    api/                 Endpoints (auth, checkout, portal, webhook, stream, admin…)
    age-verification/    Pantalla de mayoría de edad
  components/            UI: sistema de diseño, reproductor, tarjetas, panel
  lib/                   Dominio: auth, videos, storage, stripe, mail, stats, seguridad
  proxy.ts               Verificación de edad + redirección de rutas privadas
```

---

## 11. Producción

- Sirve **siempre** bajo HTTPS (las cookies se marcan `Secure` automáticamente).
- Sustituye el rate limiter en memoria (`src/lib/security.ts`) por **Redis** si despliegas más de
  una instancia.
- El bucket de vídeo debe ser **privado**, sin ACL pública ni listado.
- Programa `invoice.upcoming` en Stripe para los recordatorios de renovación.
- Revisa `security_logs` y los reportes pendientes periódicamente.
- Ejecuta `npm run build` en el despliegue: genera el cliente de Prisma y compila.

## 12. Scripts

```bash
npm run dev          # desarrollo
npm run build        # prisma generate + next build
npm start            # producción
npm run typecheck    # TypeScript sin emitir
npm run db:push      # sincroniza el esquema
npm run db:migrate   # migraciones versionadas
npm run db:seed      # datos de demostración
```

---

## 13. Despliegue en Vercel

### Por qué la subida de vídeo va directa al almacenamiento

Las funciones de Vercel limitan el cuerpo de la petición a **4,5 MB**, así que un vídeo no
puede viajar a través de la API. El panel pide un token acotado a `/api/admin/upload-token`
(solo administradores, ruta, tipo y tamaño concretos) y el navegador sube el fichero
**directamente** al almacenamiento privado. Después se guarda la ficha con la clave del objeto.

En desarrollo con el driver `local` el fichero sí viaja en la petición, que es más cómodo.
El panel elige la vía automáticamente según el driver activo.

### Pasos

1. **Base de datos**: crea un Postgres (Neon, Vercel Postgres, Supabase…) y copia su URL.
2. **Almacenamiento**: en Vercel → *Storage* → *Blob*, crea un store y conéctalo al proyecto.
   Vercel inyecta `BLOB_READ_WRITE_TOKEN` por su cuenta.
3. **Variables de entorno** del proyecto (*Settings* → *Environment Variables*):

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | URL de tu Postgres |
   | `SESSION_SECRET` | 32+ caracteres aleatorios (`openssl rand -base64 48`) |
   | `ADMIN_PASSWORD` | Contraseña de acceso a `/admin`. Cámbiala: el repositorio es público |
   | `APP_URL` | `https://tu-dominio.vercel.app` |
   | `STORAGE_DRIVER` | `blob` |
   | `DEMO_MODE` | `false` cuando conectes Stripe de verdad |
   | `STRIPE_*` | claves y precios, cuando los tengas |
   | `SMTP_*`, `MAIL_FROM` | correo transaccional, cuando lo tengas |

4. **Rama de producción**: en *Settings* → *Git*, comprueba que apunta a la rama que has
   desplegado.
5. Vuelve a desplegar. El build ejecuta `prisma migrate deploy`, así que el esquema se aplica
   solo en la primera publicación.

> El build no falla si falta `DATABASE_URL`: se salta las migraciones y avisa por consola.
> La aplicación necesita esa variable para funcionar, pero así un despliegue a medio
> configurar publica igualmente en lugar de romperse.

### Datos de demostración en producción

El *seed* no se ejecuta automáticamente. Para cargarlo contra la base de datos de producción:

```bash
DATABASE_URL="postgresql://…" npm run db:seed
```

---

## 14. Identidad visual

La marca es **Madrastras** y el lenguaje visual es el de una fotonovela impresa,
deliberadamente lejos tanto del neón rosa como del oro de lujo, que son las dos
respuestas automáticas para una web de este sector.

- **Color.** Estrategia comprometida: el carmín `oklch(0.585 0.205 22)` no es un
  acento del 10%, sostiene secciones enteras. Ningún neutro es negro ni blanco
  puro: todos van teñidos hacia el rojo de la marca.
- **Tipografía.** Anton para los titulares, tratados como un cartel (versalitas,
  interlineado por debajo de 1, muy apretado). Geist para interfaz y lectura.
- **Superficies.** Rectángulos con radio mínimo, filetes de 1px y filetes carmín
  de 2px para separar. Sin tarjetas anidadas, sin cristal esmerilado, sin
  sombras decorativas.
- **Movimiento.** Solo dos gestos: la entrada escalonada al aparecer en pantalla
  y el encadenado de portadas. Todo con curvas de salida exponencial, y anulado
  por completo cuando el sistema pide movimiento reducido.
- **Textura.** Trama de grano fija sobre el conjunto, para que las superficies
  planas no parezcan vectores.

---

## 15. Acceso al panel

`/admin` acepta dos puertas:

1. **Contraseña única**, en `/admin/login`. Sin correo. Abre una sesión de panel
   de 12 horas en una cookie HttpOnly firmada, independiente de la sesión de
   usuario. La contraseña se lee de `ADMIN_PASSWORD`.
2. **Cuenta con rol `ADMIN`**, entrando por el acceso normal del sitio.

La primera puerta es cómoda, pero una clave corta y compartida es fácil de
probar por fuerza bruta. Por eso el endpoint limita a cinco intentos por IP cada
quince minutos y registra cada intento fallido en el histórico de seguridad.

**Cambia `ADMIN_PASSWORD` en producción.** El valor por defecto está escrito en
el código de un repositorio público.
