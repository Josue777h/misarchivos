# MisArchivos - Sistema Personal de Sincronización Automática (PC ⇄ Celular)

Sistema de sincronización bidireccional de archivos de uso estrictamente personal entre un computador con Windows y un celular mediante Next.js (PWA) y Supabase.

---

## 🏛️ Arquitectura del Sistema

```
[ Computador Windows ]          [ Supabase Cloud ]           [ Celular (PWA) ]
  Carpeta: C:\MisArchivos   ⇄   PostgreSQL (Metadatos)   ⇄   Next.js Mobile-First
  Sync Daemon (Node.js)         Storage Bucket (Archivos)    Cámara / Galería / Visor
  SHA-256 Hash Watcher          Realtime (Notificaciones)    Web Share API
```

1. **Frontend Web & PWA (`web/`)**:
   - **Framework**: Next.js 15 (App Router), React 19, TypeScript.
   - **Estilos y UI**: Tailwind CSS, Lucide Icons, diseño Mobile-First y Responsive.
   - **Capacidades**: Vista de cuadrícula/lista, visor de imágenes/documentos, buscador instantáneo, clasificación por categorías automática, papelera de reciclaje, selector de cámara móvil, PWA instalable.

2. **Backend y Almacenamiento (`database/`)**:
   - **Motor**: Supabase (PostgreSQL).
   - **Almacenamiento**: Supabase Storage Bucket (`misarchivos`).
   - **Eventos en vivo**: Supabase Realtime para notificar adición, modificación y borrado en tiempo real.
   - **Seguridad**: Variables de entorno y Row Level Security (RLS) para acceso personal sin registro público.

3. **Agente de Sincronización Windows (`desktop-sync/`)**:
   - **Vigilante local**: Observa la carpeta `C:\MisArchivos` detectando adición, modificación y eliminación.
   - **Integridad**: Calcula Hashes SHA-256 para prevenir transferencias duplicadas.
   - **Manejo de conflictos**: Preserva ambas versiones renombrando con marca de tiempo y dispositivo en caso de cambios concurrentes.

---

## 📁 Estructura del Proyecto

```
C:\Users\josue\Documents\Misarchivos\
├── database\
│   └── schema.sql            # Esquema SQL de PostgreSQL y políticas de Supabase
├── web\                      # Aplicación Web y PWA (Next.js + TypeScript)
│   ├── public\
│   │   └── manifest.json     # Manifiesto PWA para instalación en móvil
│   ├── src\
│   │   ├── app\
│   │   │   ├── categories\   # Vista de categorías automáticas
│   │   │   ├── files\        # Explorador general de archivos
│   │   │   ├── settings\     # Configuración y estado de sincronización
│   │   │   ├── trash\        # Papelera de seguridad
│   │   │   ├── globals.css   # Estilos globales y variables de tema
│   │   │   ├── layout.tsx    # Layout raíz con navegación móvil y de escritorio
│   │   │   └── page.tsx      # Dashboard de Inicio con estadísticas
│   │   ├── components\       # Componentes modulares y reutilizables
│   │   ├── context\          # Estado global de archivos y sincronización
│   │   └── lib\              # Tipos TypeScript, formateadores y helpers
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

---

## 🚀 Hoja de Ruta de Fases

- [x] **FASE 1: Aplicación web moderna con Next.js y TypeScript** *(Completada)*
- [ ] **FASE 2: Configuración de base de datos Supabase y Storage**
- [ ] **FASE 3: Conexión de subida, descarga y eliminación real con Supabase**
- [ ] **FASE 4: PWA optimizada para celular con Service Workers y caché**
- [ ] **FASE 5: Agente de sincronización local para Windows (`C:\MisArchivos`)**
- [ ] **FASE 6: Sincronización bidireccional en tiempo real**
- [ ] **FASE 7: Detección por hashes SHA-256 y resolución de conflictos**
- [ ] **FASE 8: Pruebas integrales de rendimiento y validación**
