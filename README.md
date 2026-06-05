# InventarioTecMM_Jr
Gestion de Inventario TecMM

Plataforma web robusta de nivel empresarial construida sobre el ecosistema moderno de Next.js, TypeScript y Prisma ORM. El sistema integra una arquitectura modular optimizada para el rendimiento y la escalabilidad, incorporando configuraciones avanzadas de estilos, análisis estático de código, soporte multi-entorno y scripts especializados para la gestión de bases de datos, pruebas de autenticación y verificación de seguridad.

## Tabla de contenidos

- [Descripción](#descripción)
- [Características principales](#características-principales)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Configuración del entorno y Base de Datos](#configuración-del-entorno-y-base-de-datos)
- [Scripts y Pruebas del Sistema](#scripts-y-pruebas-del-sistema)
- [Estándares de Código y Calidad](#estándares-de-código-y-calidad)

---

## Descripción

**PROYECTO_IS_JR** es una aplicación full-stack diseñada bajo el paradigma de componentes y rutas optimizadas que aprovecha el poder del renderizado híbrido. Concebida para interactuar de forma eficiente con capas de datos relacionales a través de Prisma, la solución ofrece mecanismos de validación estrictos y herramientas nativas de testing/scripts temporales (`tmp-*.js`) integradas directamente en la raíz para garantizar la integridad de las consultas, la verificación de estructuras de base de datos y la robustez en procesos de autenticación de usuarios.

---

## Características principales

- **Arquitectura Next.js Completa:** Configuración nativa y avanzada lista para producción utilizando TypeScript (`tsconfig.json`, `next.config.ts`).
- **Capa de Persistencia Avanzada:** Integración total con bases de datos relacionales mediante **Prisma ORM**, incluyendo esquemas declarativos y migraciones automatizadas.
- **Validación Estricta de Datos:** Esquemas de validación de tipado en tiempo de ejecución integrados con la librería **Zod** y gestión avanzada de errores informativos (`zod-validation-error`).
- **Seguridad en Autenticación:** Mecanismos de protección criptográfica y flujos de login verificados mediante hashing de contraseñas de última generación.
- **Procesamiento de Archivos y Assets:** Soporte optimizado para el manejo de recursos estáticos del lado del servidor y del cliente a través de utilidades de sistema como `sharp`.
- **Estrategia Multi-Entorno:** Aislamiento estricto de credenciales y variables de configuración de sistemas mediante entornos locales, de desarrollo y plantillas de ejemplo (`.env`, `.env.local`, `.env.example`).
- **Diseño UI Altamente Optimizado:** Infraestructura visual basada en utilidades con **Tailwind CSS**, preprocesamiento mediante PostCSS y componentes reactivos fluidos (`lucide-react`).

---

## Stack tecnológico

### Core & Framework
- **Framework:** Next.js
- **Lenguaje:** TypeScript
- **Entorno de Ejecución:** Node.js

### Base de Datos & Validación
- **ORM:** Prisma
- **Validación de Datos:** Zod & zod-validation-error
- **Drivers & Operaciones:** `pg` (PostgreSQL / ecosistema relacional), `lodas` (utilidades de manejo de colecciones y mezcla de objetos).

### Estilos & Interfaz de Usuario
- **Estilos Estructurados:** Tailwind CSS
- **Procesamiento CSS:** PostCSS (configuración `.mjs`)
- **Iconografía:** lucide-react
- **Optimización de Imagen/Media:** `sharp`

### Herramientas de Desarrollo y Calidad (Linter/Bundlers)
- **Análisis Estático:** ESLint (configuración `.mjs` personalizada y extensiones Next/React).
- **Compilación/Transpilación:** `typescript-eslint`, `ts-api-utils`, `jiti`, `tslib`.

---

## Estructura del proyecto

La organización de archivos de **PROYECTO_IS_JR** sigue un patrón limpio enfocado en la modularidad y la separación de responsabilidades:

```text
PROYECTO_IS_JR/
├── prisma/                  # Esquemas de datos, modelos y migraciones de Prisma
├── public/                  # Assets públicos y recursos estáticos del sistema
├── scripts/                 # Scripts automatizados de automatización y mantenimiento
├── .env                     # Archivo activo de variables de entorno (Producción/Desarrollo)
├── .env.example             # Plantilla de referencia para configuraciones de entorno
├── .env.local               # Configuración de variables de entorno para desarrollo local
├── .gitignore               # Exclusiones del control de versiones de Git
├── AGENTS.md                # Documentación/Instrucciones relativas a agentes autónomos
├── CLAUDE.md                # Directrices de desarrollo y reglas específicas para LLMs/Asistentes
├── eslint.config.mjs        # Configuración modular del linter ESLint
├── next-env.d.ts            # Declaración de tipos globales nativos de Next.js
├── next.config.ts           # Configuración avanzada del comportamiento de Next.js
├── package-lock.json        # Árbol de dependencias exacto y bloqueado del proyecto
├── package.json             # Manifiesto del proyecto, dependencias y scripts de ejecución
├── postcss.config.mjs       # Configuración del procesador PostCSS para Tailwind
├── README.md                # Documentación principal del sistema
├── tmp-db-structure.js      # Script temporal para análisis/verificación de la estructura de la DB
├── tmp-login-test.js        # Script de prueba técnica para flujos de inicio de sesión
├── tmp-password-check.js    # Script de verificación de algoritmos y políticas de contraseñas
├── tmp-query-users.js       # Script de consulta rápida y filtrado de usuarios en base de datos
└── tsconfig.json            # Configuración estricta del compilador de TypeScript
Instalación y ejecución
Requisitos previos
Node.js: Versión activa LTS (v18+ o v20+ recomendada).

Gestor de paquetes: npm (incluido por defecto con Node.js).

Motor de Base de Datos: PostgreSQL o equivalente compatible con la especificación del esquema de Prisma provisto.

Pasos de inicialización
Clonar el repositorio e ingresar al directorio raíz:

Bash
cd PROYECTO_IS_JR
Instalar el árbol de dependencias del proyecto:

Bash
npm install
Preparar el entorno de ejecución:
Copie el archivo de plantilla .env.example para inicializar sus configuraciones locales individuales:

Bash
cp .env.example .env.local
Ejecutar el entorno de desarrollo:

Bash
npm run dev
La aplicación estará disponible de forma local en: http://localhost:3000.

Configuración del entorno y Base de Datos
El sistema requiere variables críticas especificadas en los archivos .env o .env.local para garantizar la conectividad con los servicios esenciales.

Variables clave (.env.example)
DATABASE_URL: String de conexión absoluto de la base de datos (Ejemplo: postgresql://usuario:password@localhost:5432/mi_base_datos).

Inicialización de la capa de datos (Prisma)
Antes de interactuar con la aplicación, procese el esquema declarativo ubicado en la carpeta prisma/:

Bash
# Generar el cliente de Prisma adaptado al entorno TypeScript
npx prisma generate

# Aplicar las migraciones correspondientes a la base de datos en desarrollo
npx prisma migrate dev
Scripts y Pruebas del Sistema
El proyecto cuenta con herramientas nativas utilitarias (scripts/) y archivos ejecutables de diagnóstico rápido ubicados en el directorio raíz. Estos últimos permiten validar la integridad del backend sin levantar la infraestructura completa del servidor web:

tmp-db-structure.js: Inspecciona los modelos nativos, las relaciones y comprueba que las tablas reflejen con exactitud el mapeo esperado por el sistema.

tmp-password-check.js: Evalúa de manera segura la robustez, el comportamiento criptográfico de las funciones hash y las políticas aplicadas a las claves de acceso de los usuarios.

tmp-login-test.js: Simula las peticiones de autenticación frente a la base de datos para asegurar el correcto procesamiento de payloads de inicio de sesión.

tmp-query-users.js: Ejecuta búsquedas masivas o filtradas sobre la entidad de usuarios para depurar índices y relaciones complejas en tiempo de desarrollo.

Para ejecutar cualquiera de estos módulos utilitarios, utilice el motor de Node de forma directa:

Bash
node tmp-login-test.js
Estándares de Código y Calidad
Para asegurar la uniformidad estilística, el mantenimiento a largo plazo y mitigar la introducción de bugs en producción, el proyecto implementa un pipeline estricto de análisis de código:

TypeScript (tsconfig.json): Configurado en modo estricto para asegurar la inferencia correcta de tipos, mitigar los riesgos de valores undefined/null inesperados y potenciar el autocompletado en el IDE.

ESLint (eslint.config.mjs): Valida las mejores prácticas del ecosistema Next.js, Hooks de React, orden de importaciones y previene la presencia de código muerto en el repositorio.

Puede auditar el código manualmente ejecutando el comando de inspección de su package.json:

Bash
npm run lint
