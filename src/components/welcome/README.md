# Welcome Module - Arquitectura Modular

## 📁 Estructura

```
components/
├── WelcomeModal.tsx          # Componente principal (orquestador)
└── welcome/
    ├── index.ts              # Barrel export para exports limpios
    ├── types.ts              # Tipos TypeScript compartidos
    ├── animations.ts         # Animaciones CSS reutilizables
    ├── WelcomeScreen.tsx     # Pantalla de bienvenida inicial
    ├── ModeSelectionScreen.tsx # Pantalla de selección de modo
    └── OrbitBackground.tsx   # Componente de fondo orbital animado
```

## 🏗️ Arquitectura

### Principios Aplicados

- **Separación de Responsabilidades**: Cada componente tiene una única responsabilidad
- **Modularidad**: Componentes independientes y reutilizables
- **Escalabilidad**: Fácil añadir nuevas pantallas o animaciones
- **Clean Code**: Código legible, mantenible y bien documentado
- **Type Safety**: TypeScript para prevenir errores en tiempo de compilación

### Flujo de Datos

1. **WelcomeModal** (Controlador)
   - Maneja el estado global del wizard (`welcome` | `mode-selection`)
   - Orquesta las transiciones entre pantallas
   - Maneja eventos de teclado (ESC para volver)

2. **WelcomeScreen**
   - Muestra título, brief y botón de inicio
   - Footers con información de créditos
   - Emit evento `onStart` al hacer clic

3. **ModeSelectionScreen**
   - Muestra las opciones de modo (Free/Simulation)
   - Cards interactivas con hover effects
   - Emit evento `onSelectMode` con el modo elegido

4. **OrbitBackground**
   - Fondo animado independiente
   - Recibe prop `zoomLevel` para animar zoom
   - No tiene lógica de negocio, solo presentación

## 🎨 Características

### Animaciones

- **Framer Motion**: Transiciones suaves entre pantallas
- **CSS Keyframes**: Órbitas planetarias y efectos de pulsación
- **Zoom Dinámico**: El fondo hace zoom cuando cambias de pantalla

### Responsividad

- Todos los tamaños usan `clamp()` para escalar dinámicamente
- Media queries para ajustes finos
- Mobile-first approach

### Interactividad

- Hover effects en botones y cards
- Feedback visual inmediato
- Soporte de teclado (ESC)

## 🔧 Extensibilidad

### Añadir una Nueva Pantalla

1. Crear componente en `welcome/NuevaPantalla.tsx`
2. Añadir tipo en `types.ts`: `type WelcomeStep = 'welcome' | 'mode-selection' | 'nueva'`
3. Importar y usar en `WelcomeModal.tsx` con AnimatePresence
4. Exportar en `welcome/index.ts`

### Personalizar Animaciones

Editar `animations.ts` para añadir nuevos keyframes CSS reutilizables.

### Añadir Nuevos Modos

1. Actualizar tipo en `types.ts`: `type AppMode = 'free' | 'simulation' | 'nuevo'`
2. Añadir ModeCard en `ModeSelectionScreen.tsx`

## 📦 Dependencias

- `framer-motion`: Animaciones declarativas y transiciones
- `react`: Framework base
- `typescript`: Type safety

## 🚀 Uso

```tsx
import WelcomeModal from './components/WelcomeModal';

function App() {
  const handleModeSelect = (mode: 'free' | 'simulation') => {
    console.log('Modo seleccionado:', mode);
    // Tu lógica aquí
  };

  return <WelcomeModal onSelectMode={handleModeSelect} />;
}
```
