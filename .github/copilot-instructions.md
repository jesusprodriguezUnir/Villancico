# Copilot Instructions - Villancico Video Maker

## Descripción del Proyecto

Aplicación React + TypeScript + Vite que sincroniza letras de villancicos navideños con audio MP3. Genera un visualizador musical donde las letras aparecen sincronizadas con el tiempo y las imágenes de fondo se generan dinámicamente usando Pollinations.ai.

## Arquitectura

```
├── App.tsx              # Componente principal: gestión de estado del reproductor y audio
├── constants.ts         # Array LYRICS con letras sincronizadas (tiempo, sección, imageKey)
├── types.ts             # Interfaces: LyricLine, PlayerState
├── components/
│   ├── LyricDisplay.tsx # Renderiza letra actual + preview siguiente + imagen de fondo
│   └── Controls.tsx     # Controles de reproducción (play/pause, seek, reset)
```

### Flujo de Datos

1. Usuario sube archivo MP3 → `handleFileUpload` crea URL blob
2. `requestAnimationFrame` loop actualiza `playerState.currentTime`
3. `updateSync()` busca en `LYRICS` la letra correspondiente al tiempo actual
4. `LyricDisplay` recibe `currentLyric`/`nextLyric` y genera imagen vía Pollinations.ai

## Comandos de Desarrollo

```bash
npm install       # Instalar dependencias
npm run dev       # Servidor de desarrollo (puerto 3000)
npm run build     # Build de producción
npm run preview   # Preview del build
```

## Convenciones del Código

### Componentes React
- Usar `FC<Props>` para tipado de componentes funcionales
- Importar tipos con `import { type X }` cuando es solo tipo
- Props interfaces definidas inline sobre el componente (ver `LyricDisplay.tsx`)

### Sincronización de Letras
- Cada entrada en `LYRICS` requiere: `section`, `text`, `time` (segundos), `imageKey`, `visualDescription`
- El tiempo se mide en segundos desde inicio del audio
- `visualDescription` se usa como prompt para generación de imágenes

```typescript
// Ejemplo de entrada en constants.ts
{ 
  section: "Chorus", 
  text: "Navidades, Navidades", 
  time: 34, 
  imageKey: "navidad", 
  visualDescription: "Beautiful decorated Christmas tree" 
}
```

### Estilizado
- **Tailwind CSS** vía CDN (`<script src="https://cdn.tailwindcss.com">`)
- Fuentes: `Mountains of Christmas` (títulos navideños), `Quicksand` (letras)
- Colores principales: `yellow-400/500` (acentos), `slate-900` (fondo), `black/80` (overlays)
- Animación Ken Burns para imágenes de fondo (definida en `index.html`)

### Generación de Imágenes
Las imágenes se generan dinámicamente desde Pollinations.ai:
```typescript
// LyricDisplay.tsx
const bgImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualDescription)}?width=1920&height=1080&nologo=true&seed=${time}`;
```

## Consideraciones Importantes

- **No hay backend**: Todo el procesamiento es client-side
- **No hay tests configurados**: Proyecto simple sin suite de tests
- **API Key Gemini**: Configurada en `.env.local` pero actualmente no se usa en la app
- **Path alias**: `@/*` mapea a la raíz del proyecto (ver `tsconfig.json`)

## Patrones Comunes

### Agregar nueva letra sincronizada
1. Escuchar el audio y anotar el timestamp exacto (segundos)
2. Añadir entrada al array `LYRICS` en `constants.ts`
3. Escribir `visualDescription` descriptivo en inglés para mejor generación de imagen

### Modificar controles del reproductor
- Estado centralizado en `App.tsx` via `useState<PlayerState>`
- Callbacks (`togglePlay`, `handleSeek`, `handleReset`) definidos en `App.tsx` y pasados como props
