# Liquid Glass Design System Guide

## Overview
This design system implements a modern glassmorphism (liquid glass) effect with 90% transparency while maintaining excellent text readability and accessibility.

## Core Principles
1. **High Transparency**: 90%+ transparency for glass effect
2. **Readable Text**: Strong text contrast with subtle shadows
3. **Backdrop Blur**: 8-16px blur with saturation boost
4. **Subtle Borders**: Minimal but visible borders
5. **Layered Depth**: Multiple glass layers create depth

---

## CSS Classes

### Base Glass Classes

#### `.liquid-glass` - Default Glass
```css
background: rgba(255, 255, 255, 0.06);
backdrop-filter: blur(12px) saturate(120%);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 16px;
box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
```
**Use for**: Primary containers, cards, panels

#### `.liquid-glass-light` - Light Background Variant
```css
background: rgba(255, 255, 255, 0.1);
```
**Use for**: Light mode, better visibility

#### `.liquid-glass-dark` - Dark Background Variant
```css
background: rgba(0, 0, 0, 0.15);
```
**Use for**: Dark mode, dark backgrounds

#### `.liquid-glass-intense` - More Visible
```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(16px) saturate(130%);
```
**Use for**: Important UI elements, headers

#### `.liquid-glass-subtle` - More Transparent
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(8px) saturate(110%);
```
**Use for**: Subtle backgrounds, secondary elements

---

### Interactive States

#### `.liquid-glass-hover` - Hover Effect
Increases opacity and shadow on hover
**Use for**: Clickable cards, buttons

#### `.liquid-glass-active` - Active State
Slightly more opaque than hover
**Use for**: Selected items, active tabs

---

### Text Contrast Utilities

#### Light Text (for dark/image backgrounds)
- `.text-glass-primary` - Main text (95% opacity)
- `.text-glass-secondary` - Secondary text (70% opacity)
- `.text-glass-tertiary` - Tertiary text (50% opacity)

#### Dark Text (for light backgrounds)
- `.text-glass-primary-dark` - White text (95% opacity)
- `.text-glass-secondary-dark` - White text (75% opacity)
- `.text-glass-tertiary-dark` - White text (55% opacity)

**All text includes subtle shadow for legibility**

---

### Form Elements

#### `.input-glass` - Input Fields
```css
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(8px);
border: 1px solid rgba(255, 255, 255, 0.1);
```
**Features**:
- Focus state with blue border
- Placeholder styling
- Auto-transitions

**Example**:
```tsx
<input className="input-glass px-4 py-2" placeholder="Type here..." />
```

#### `.button-glass` - Buttons
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
```
**Features**:
- Hover lift effect
- Active press effect
- Shadow transitions

**Example**:
```tsx
<button className="button-glass px-6 py-3">Click Me</button>
```

---

### Utility Components

#### `.badge-glass` - Badges/Pills
Rounded pill with glass effect
**Example**:
```tsx
<span className="badge-glass">New</span>
```

#### `.glass-divider` - Horizontal Divider
Gradient line for sections
**Example**:
```tsx
<div className="glass-divider my-4"></div>
```

#### `.glass-scrollbar` - Custom Scrollbar
Transparent scrollbar with glass thumb
**Apply to scrollable containers**:
```tsx
<div className="overflow-auto glass-scrollbar">...</div>
```

---

## Color Tokens (Accessible Contrast)

### Background Gradients
```tsx
// Light gradient (recommended for glass backgrounds)
className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50"

// Dark gradient
className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"

// Colorful gradient
className="bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400"
```

### Text Colors (High Contrast)
```tsx
// On glass surfaces
className="text-glass-primary"        // Black text, high contrast
className="text-glass-secondary"      // Gray text, medium contrast
className="text-glass-tertiary"       // Light gray, low contrast

// On dark backgrounds
className="text-glass-primary-dark"   // White text, high contrast
className="text-glass-secondary-dark" // Light gray, medium contrast
className="text-glass-tertiary-dark"  // Gray, low contrast
```

### Border Colors
```tsx
className="border border-white/10"  // Subtle border
className="border border-white/20"  // Visible border
className="border border-blue-500/30" // Colored border
```

---

## Layout Patterns

### Card Pattern
```tsx
<div className="liquid-glass-light p-6 rounded-2xl">
  <h2 className="text-glass-primary font-bold text-xl mb-2">Title</h2>
  <p className="text-glass-secondary">Description text</p>
</div>
```

### Navigation Pattern
```tsx
<nav className="liquid-glass-light sticky top-0 backdrop-blur-xl">
  <div className="flex items-center justify-between p-4">
    <h1 className="text-glass-primary font-bold">Logo</h1>
    <div className="flex gap-2">
      <button className="button-glass px-4 py-2">Menu</button>
    </div>
  </div>
</nav>
```

### Sidebar Pattern
```tsx
<aside className="liquid-glass-light h-screen overflow-auto glass-scrollbar">
  <div className="p-4 space-y-2">
    <button className="liquid-glass-hover w-full p-3 rounded-lg text-left">
      <span className="text-glass-primary">Item 1</span>
    </button>
  </div>
</aside>
```

### Modal Pattern
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center">
  <div className="liquid-glass-dark p-6 max-w-md w-full">
    <h2 className="text-glass-primary-dark font-bold mb-4">Modal Title</h2>
    <p className="text-glass-secondary-dark">Content</p>
  </div>
</div>
```

---

## Responsive Design

### Mobile-First Approach
```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">
  <div className="liquid-glass-light p-4">Left</div>
  <div className="liquid-glass-light p-4">Right</div>
</div>

// Hidden on mobile, visible on desktop
<div className="hidden md:block liquid-glass-light">
  Desktop only
</div>

// Full width on mobile, fixed width on desktop
<div className="w-full md:w-80 liquid-glass-light">
  Responsive width
</div>
```

### Collapsible Panels
```tsx
const [isOpen, setIsOpen] = useState(false);

<div className={`
  ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  md:translate-x-0
  fixed md:relative
  transition-transform duration-300
  liquid-glass-light
`}>
  Panel content
</div>
```

---

## Accessibility Guidelines

### Text Contrast
✅ **DO**: Use `text-glass-primary` for important text
✅ **DO**: Use text shadows on glass backgrounds
✅ **DO**: Test with WCAG AA contrast tools

❌ **DON'T**: Use tertiary text for essential information
❌ **DON'T**: Place light text on light backgrounds

### Focus States
Always ensure focus indicators are visible:
```tsx
<button className="button-glass focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Accessible Button
</button>
```

### Keyboard Navigation
Ensure all interactive elements are keyboard accessible:
```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="liquid-glass-hover cursor-pointer"
>
  Interactive Card
</div>
```

---

## Animation Examples

### Shimmer Effect
```tsx
<div className="glass-shimmer liquid-glass p-8">
  Loading...
</div>
```

### Fade In
```tsx
<div className="liquid-glass animate-in fade-in duration-300">
  Content
</div>
```

### Slide In
```tsx
<div className="liquid-glass animate-in slide-in-from-bottom duration-500">
  Content
</div>
```

---

## Best Practices

1. **Layer Intentionally**: Use different glass variants to create depth
2. **Contrast First**: Always ensure text is readable
3. **Test on Backgrounds**: Glass looks different on various backgrounds
4. **Don't Overuse**: Too much glass can look cluttered
5. **Performance**: Backdrop filters are GPU-intensive, use wisely
6. **Browser Support**: Provide fallbacks for older browsers

---

## Example: Complete Chat Interface

See `/src/components/ChatRoom.tsx` for a full implementation featuring:
- Sidebar with conversation list (liquid-glass-light)
- Main chat area with message bubbles (gradient for sent, glass for received)
- Right panel with settings (liquid-glass-light)
- Responsive mobile design with collapsible panels
- Image modal with glass background
- Custom scrollbars throughout

---

## Testing Checklist

- [ ] Text is readable on all backgrounds
- [ ] Focus states are visible
- [ ] Hover effects work smoothly
- [ ] Mobile responsive breakpoints work
- [ ] Animations are smooth (60fps)
- [ ] Keyboard navigation works
- [ ] Screen readers can access content
- [ ] Works in Safari (webkit-backdrop-filter)
- [ ] Graceful degradation in older browsers

---

## Browser Support

- ✅ Chrome/Edge 76+
- ✅ Safari 9+ (with -webkit prefix)
- ✅ Firefox 103+
- ⚠️  IE11: Falls back to solid background
