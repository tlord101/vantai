# UI System Quick Reference

Fast copy-paste reference for the custom UI components.

## 🚀 Setup (Do This First!)

```tsx
// In main.tsx or App.tsx
import { PreloaderProvider } from './contexts/PreloaderContext';
import { ToastContainer } from './utils/toast';
import './styles/glass.css';

function App() {
  return (
    <PreloaderProvider>
      <YourApp />
      <ToastContainer />
    </PreloaderProvider>
  );
}
```

## 📦 Component Imports

```tsx
// Modals
import Modal, { ConfirmModal } from './components/Modal';

// Popups
import Popup from './components/Popup';
import { usePopup } from './hooks/usePopup';

// Confirm Dialogs
import { useConfirm, confirmPresets } from './hooks/useConfirm';

// Toasts
import { showToast, showActionToast } from './utils/toast';

// Preloader
import { usePreloader } from './contexts/PreloaderContext';

// Validation
import { ValidatedField, validationRules, FieldValidator } from './utils/validation';
```

## 🎯 Common Patterns

### Delete with Confirmation
```tsx
const { confirm, ConfirmDialog } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm(confirmPresets.delete('Image'));
  if (!confirmed) return;
  
  await deleteImage();
  showToast.success('Image deleted');
};

return <><button onClick={handleDelete}>Delete</button><ConfirmDialog /></>;
```

### Loading + Success/Error
```tsx
const { showPreloader, hidePreloader } = usePreloader();

const handleSave = async () => {
  showPreloader('Saving...');
  try {
    await saveData();
    hidePreloader();
    showToast.success('Saved!');
  } catch (error) {
    hidePreloader();
    showToast.error('Failed to save');
  }
};
```

### Form Validation
```tsx
const validator = new FieldValidator();

const validateEmail = () => {
  return validator.validate('Email', email, [
    (val) => validationRules.required(val, 'Email'),
    (val) => validationRules.email(val),
  ]);
};

<ValidatedField label="Email" error={validator.getError('Email')} touched required>
  <input onBlur={validateEmail} className="input-glass w-full px-4 py-2" />
</ValidatedField>
```

### Popup Panel
```tsx
const { isOpen, open, close } = usePopup('payment');

<button onClick={() => open()}>Open</button>

<Popup isOpen={isOpen} onClose={close} title="Payment" position="right">
  <div>Content</div>
</Popup>
```

### Promise Toast
```tsx
showToast.promise(
  uploadImage(),
  {
    loading: 'Uploading...',
    success: 'Uploaded!',
    error: 'Failed',
  }
);
```

## 🎨 CSS Classes

```css
/* Base */
.liquid-glass          /* Standard glass */
.liquid-glass-intense  /* More visible */
.liquid-glass-subtle   /* More transparent */

/* Interactive */
.input-glass    /* Form inputs */
.button-glass   /* Buttons */
.badge-glass    /* Badges */
```

## 💡 Quick Tips

1. **Delete actions:** Always use `confirmPresets.delete()`
2. **Async operations:** Use `showPreloader()` or `showToast.promise()`
3. **Form validation:** Validate on `onBlur`, not `onChange`
4. **Multi-step flows:** Use `Popup` instead of multiple pages
5. **Success feedback:** Always show `showToast.success()` after actions

## 🔗 Full Docs

- Integration Guide: `/UI_SYSTEM_GUIDE.md`
- Examples: `/src/examples/UIExamples.tsx`
- Implementation: `/UI_SYSTEM_IMPLEMENTATION.md`
