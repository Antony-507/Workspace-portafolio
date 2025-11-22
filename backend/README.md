Backend - Instrucciones de despliegue local

Este backend soporta SQLite (por defecto) y MSSQL (para producción). A continuación se indican pasos para configurar y ejecutar localmente con MSSQL.

Variables de entorno importantes
- `DB_TYPE`: `sqlite` (por defecto) o `mssql`.
- `MSSQL_CONN` o `DB_CONNECTION_STRING`: cadena de conexión para SQL Server.
- `PORT`: puerto donde correrá el backend (por defecto `3001`).
- `JWT_SECRET`: secreto para firmar JWT (cámbialo en producción).
- `ADMIN_IP`: IP desde la que se permiten operaciones administrativas sin autenticación JWT (opcional).

Ejemplos de cadenas de conexión
- Autenticación SQL Server (SQL Auth):
  Server=localhost;Database=PortafolioDB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;
- LocalDB / Windows Auth (puede necesitar driver `msnodesqlv8`):
  Server=(localdb)\\MSSQLLocalDB;Database=PortafolioDB;Trusted_Connection=True;

Instalación
```powershell
cd 'C:\Users\amira\Documents\Aplicaciones\Sitio web portafolio\backend'
npm install
```

Crear un admin (MSSQL)
- Hay dos scripts incluidos:
  - `seed-admin-mssql.js` : crea un usuario Manager en la tabla `Usuarios` si no existe.
  - `run-seed-and-push.ps1` : helper PowerShell que ejecuta el seed y hace `git commit` + `git push` (usa tus credenciales locales).

Ejecutar seed manualmente (PowerShell):
```powershell
# exporta MSSQL_CONN en tu sesión, por ejemplo:
$env:MSSQL_CONN='Server=localhost;Database=PortafolioDB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;'
node .\seed-admin-mssql.js admin@local admin123 "Admin"
```

Usar el helper PowerShell (incluye push):
```powershell
.\run-seed-and-push.ps1 -Email admin@local -Password admin123 -Nombre Admin -Conn 'Server=localhost;Database=PortafolioDB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;'
```

Ejecutar el servidor
```powershell
# exporta variables si usas MSSQL
$env:DB_TYPE='mssql'
$env:MSSQL_CONN='Server=localhost;Database=PortafolioDB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;'
node .\server.js
```

Probar la conexión
- Endpoint de chequeo (requiere IP de administrador o token Manager):
  `GET http://localhost:3001/admin/db-info` (protegido)

PM2 (ejemplo)
```powershell
npm install -g pm2
pm2 start server.js --name "portafolio-backend" --watch --cwd "C:\Users\amira\Documents\Aplicaciones\Sitio web portafolio\backend"
pm2 save
```

Seguridad
- Cambia `JWT_SECRET` por un secreto fuerte.
- No dejes `seed` y scripts de creación de usuarios en el repositorio público si no los necesitas.
# Portafolio - Backend

Este README resume los pasos recomendados para desplegar y asegurar el backend de la aplicación.

## Requisitos previos
- Node.js 18+
- SQL Server (Azure SQL, instancia en VPS, o SQL Server gestionado)
- (Opcional) AWS S3 o Azure Blob para almacenamiento de archivos
- (Opcional) Nginx para reverse proxy y SSL

## Variables de entorno mínimas (producción)
- PORT=3001
- DB_SERVER=<host o instancia>
- DB_NAME=PortafolioDB
- DB_USER=<usuario_sql>
- DB_PASSWORD=<contraseña_sql>
- USE_WINDOWS_AUTH=false
- JWT_SECRET=<valor-muy-seguro>
- ADMIN_IP=<tu_ip_admin>
- S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (si usas S3)

No dejar `JWT_SECRET` con el valor por defecto en producción. Si `NODE_ENV=production` y `JWT_SECRET` no está configurado el servidor se detendrá.

## Despliegue recomendado (Linux + PM2 + Nginx)
1. Instalar Node, Nginx, PM2:

```bash
# Ubuntu ejemplo
sudo apt update && sudo apt install -y nodejs npm nginx
sudo npm install -g pm2
```

2. Subir el código al servidor y en la carpeta `backend` instalar dependencias:

```bash
cd /ruta/al/repositorio/backend
npm ci --production
```

3. Configurar variables de entorno (ejemplo export en bash) y arrancar con PM2:

```bash
export PORT=3001
export DB_SERVER='mi-sql-server'
export DB_NAME='PortafolioDB'
export DB_USER='appuser'
export DB_PASSWORD='MiPassSegura'
export JWT_SECRET='valor-muy-seguro'
export ADMIN_IP='mi.ip.publica'
pm run start # o pm2 start ecosystem.config.js
```

4. Configurar Nginx (reverse proxy) y HTTPS con Let's Encrypt (certbot).

## Docker
Se incluye `Dockerfile` para construir una imagen. Ejemplo:

```bash
docker build -t portafolio-backend .
docker run -d -p 3001:3001 --env-file .env --name portafolio portafolio-backend
```

`uploads/` está incluido en .dockerignore porque las copias locales se gestionan fuera del contenedor (volúmenes)

## Seguridad y producción
- Usar un `JWT_SECRET` robusto.
- No guardar contraseñas en `config.json`; usar variables de entorno o un secret store.
- Crear un usuario DB con privilegios mínimos (no db_owner) y aplicar migrations con un usuario administrador durante setup.
- Habilitar backups regulares de la base de datos y del bucket S3 (o del almacenamiento local si aplica).

## Despliegue en Windows (IIS / NSSM / PM2)

Si prefieres desplegar en Windows, estos son los pasos recomendados:

1. Preparar servidor Windows con Node.js instalado (18+), SQL Server (o conectar a Azure SQL), y IIS con URL Rewrite e Application Request Routing (ARR) si vas a usar IIS como reverse proxy.

2. Clonar el repositorio y en la carpeta `backend` instalar dependencias:

```powershell
cd C:\ruta\al\repositorio\backend
.\win-install-deps.ps1
# o npm ci
```

3. Configurar variables de entorno (ejemplo con PowerShell) — NO guardes secretos en `config.json`:

```powershell
setx JWT_SECRET "valor-muy-seguro"
setx DB_SERVER "mi-servidor-sql"
setx DB_NAME "PortafolioDB"
setx DB_USER "appuser"
setx DB_PASSWORD "MiPassSegura"
setx ADMIN_IP "mi.ip.admin"
```

4. Ejecutar la aplicación manualmente para pruebas:

```powershell
cd C:\ruta\al\repositorio\backend
.\win-start.ps1
```

5. Opciones para ejecutar como servicio en Windows:
 - Usar NSSM (Non-Sucking Service Manager): crear un servicio que ejecute `node server.js` en la carpeta `backend` y herede las variables de entorno del sistema.
 - Usar PM2 en Windows (instalar con `npm install -g pm2`) y luego `pm2 start ecosystem.config.js` y `pm2 save`.
 - Usar un scheduled task o servicio personalizado si prefieres.

6. Reverse proxy y HTTPS:
 - Usar IIS + URL Rewrite + ARR: coloca el archivo `web.config` en la raíz (ejemplo incluido) y configura un certificado TLS en IIS para tu dominio.
 - Alternativa: instalar Nginx for Windows y usar el `nginx.example.conf` como base.

7. Backup y monitorización:
 - Configura backups de SQL Server (log shipping / backups programados) o usa Azure SQL que lo gestiona.
 - Para logs, usa PM2 logs o integra `winston` con un sink centralizado.

8. Probar endpoints y panel admin una vez en producción (smoke tests):
 - /, /api/is-admin-ip, login Manager, CRUD de usuarios, subir y borrar archivos (Manager).

Si quieres, genero un script `win-create-service.ps1` que crea un servicio usando `sc.exe` o que guía para NSSM; dime si prefieres NSSM o PM2 y lo creo.

## Logs y monitorización
- Se incluye configuración básica para PM2. Añade `winston` y `morgan` para logging.
- Considerar integraciones con servicios de monitorización (Datadog, NewRelic, Azure Monitor) y configurar alertas.

## Operaciones administrativas
- El panel de administración (http://<host>:3001/admin.html) solo es visible para usuarios con role `Manager` y desde `ADMIN_IP`.
- Desde el panel puedes guardar config, ejecutar `db_init.sql` e iniciar la creación de logins SQL (requiere IP admin y role Manager).

## Checklist antes de exponer públicamente
- [ ] JWT_SECRET seguro en env
- [ ] DB en instancia adecuada y `db_init.sql` ejecutado
- [ ] Backups configurados
- [ ] HTTPS configurado
- [ ] Variables de entorno sensibles no almacenadas en repo

Si quieres, genero también un `docker-compose.yml` y un small `nginx` config para esta app.

## Resetear contraseña de usuario (instrucciones)

He añadido `reset-password-mssql.js` que calcula un hash bcrypt y actualiza la columna `Password` de `dbo.Usuarios`.

Uso desde PowerShell (ejemplo):

```powershell
cd 'C:\Users\amira\Documents\Aplicaciones\Sitio web portafolio\backend'
# exporta cadena de conexión o pásala como tercer argumento
$env:MSSQL_CONN = 'Server=localhost;Database=PortafolioDB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;'
node .\reset-password-mssql.js 'amirandrev...@gmail.com' 'NuevaPassSegura123'
```

O pasando la cadena de conexión en el comando (sin exportar):

```powershell
node .\reset-password-mssql.js 'amirandrev...@gmail.com' 'NuevaPassSegura123' 'Server=localhost;Database=PortafolioDB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;'
```

Alternativa en dos pasos (si prefieres usar SSMS):
- Genera el hash en Node y cópialo:

```powershell
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('NuevaPassSegura123',10).then(h=>console.log(h));"
```

- En SSMS ejecuta (reemplaza <HASH> y <EMAIL>):

```sql
UPDATE dbo.Usuarios
SET Password = '<HASH>'
WHERE Email = '<EMAIL>'
```

Después del reset: cambia la contraseña desde la UI del admin o elimina el script del repo si no quieres mantener herramientas de modificación de credenciales en el árbol principal.
 
NOTA: La contraseña del usuario con email `amirandreve507@gmail.com` fue actualizada localmente por el propietario (por procedimiento manual en SSMS). Si fuiste tú, confirma que puedes iniciar sesión y después considera eliminar `reset-password-mssql.js` del repositorio o moverlo a un repositorio privado.

---

Conexión a LocalDB desde Node (Windows)

Si estás usando `(localdb)\\MSSQLLocalDB` con Autenticación de Windows y el servidor muestra errores como `ENOTFOUND (localdb)`, sigue estos pasos rápidos:

1) Instala el driver nativo `msnodesqlv8` en `backend`:

```powershell
cd 'C:\Users\amira\Documents\Aplicaciones\Sitio web portafolio\backend'
npm install msnodesqlv8 --save
```

2) Exporta la cadena y arranca el servidor (ejemplo):

```powershell
$env:DB_TYPE='mssql'
$env:MSSQL_CONN='Server=(localdb)\\MSSQLLocalDB;Database=PortafolioDB;Trusted_Connection=True;'
$env:JWT_SECRET='un_secreto_para_pruebas'
node .\server.js
```

El servidor intentará primero la conexión TCP y, si detecta una referencia a LocalDB o falla la resolución de nombre, intentará automáticamente usar `msnodesqlv8` (si está instalado). Si ves errores relacionados con msnodesqlv8, revisa la salida; puede que necesites Visual C++ Redistributable o permisos de Windows para el driver nativo.

Si prefieres evitar drivers nativos, otra opción es usar una instancia SQL Server que acepte conexiones TCP (por ejemplo habilitar SQL Auth en tu instancia o usar una instancia `localhost` que escuche en TCP) y configurar `MSSQL_CONN` con `User Id`/`Password`.

---

## Recomendación práctica: usar SQL Server (TCP) + SQL Auth (evita msnodesqlv8)

Si quieres evitar las dependencias nativas de `msnodesqlv8` y problemas con LocalDB/named-pipes, lo más práctico es:

1. Instalar **SQL Server Express** o Developer edition localmente (soporta TCP y SQL Auth).
2. Mover/adjuntar tu base `PortafolioDB` a esa instancia (puedes hacer backup/restore desde LocalDB usando SSMS).
3. Crear un login SQL y usuario para la app (ejemplo abajo).
4. Establecer `MSSQL_CONN` con una cadena TCP como `Server=localhost;Database=PortafolioDB;User Id=appuser;Password=MiPassSegura;TrustServerCertificate=True;` y arrancar el backend.

Ejemplo T-SQL para crear login + usuario (ejecutar en SSMS conectado a la instancia TCP):

```sql
CREATE LOGIN appuser WITH PASSWORD = 'P@ssw0rd!123';
USE PortafolioDB;
CREATE USER appuser FOR LOGIN appuser;
ALTER ROLE db_owner ADD MEMBER appuser; -- para pruebas; en producción reducir permisos
```

Ejemplo: arrancar backend con la cadena TCP en PowerShell (temporal para la sesión):

```powershell
Push-Location 'C:\Users\amira\Documents\Aplicaciones\Sitio web portafolio\backend'
$env:MSSQL_CONN = 'Server=localhost;Database=PortafolioDB;User Id=appuser;Password=P@ssw0rd!123;TrustServerCertificate=True;'
node .\server.js
Pop-Location
```

Si quieres, hay un script práctico `run-with-tcp.ps1` en este directorio que te permite pasar la cadena de conexión y arranca el servidor guardando logs.

