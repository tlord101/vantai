# UI System Integration Guide

Complete guide for integrating the custom UI system into your Vantai application.

## 🚀 Quick Start

### 1. Add Providers to App Root

Update your `main.tsx` or `App.tsx`:

```tsx
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

### 2. Import Liquid Glass Styles

In your `main.tsx` or `index.css`:

```tsx
import './styles/glass.css';
```

## 📦 Components Overview

### Modal Component
**File:** `/src/components/Modal.tsx`

**Features:**
- Liquid-glass styling
- ESC key to close
- Backdrop click to close
- Focus trap
- Multiple sizes (sm, md, lg, xl, full)
- Confirm/cancel callbacks
- Loading states

**Basic Usage:**
```tsx
import Modal from './components/Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="My Modal"
      size="md"
    >
      <p>Modal content here</p>
    </Modal>
  );
}
```

**Confirm Modal:**
```tsx
import { ConfirmModal } from './components/Modal';

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure?"
  variant="danger"
/>
```

### Popup / Sliding Panel
**File:** `/src/components/Popup.tsx`

**Features:**
- Slides from right, left, or bottom
- Liquid-glass styling
- Multiple sizes
- Global state management via `usePopup` hook

**Usage:**
```tsx
import Popup from './components/Popup';
import { usePopup } from './hooks/usePopup';

function MyComponent() {
  const { isOpen, open, close } = usePopup('payment');

  return (
    <>
      <button onClick={() => open()}>Open Panel</button>
      
      <Popup
        isOpen={isOpen}
        onClose={close}
        title="Payment"
        size="md"
        position="right"
      >
        <div>Panel content</div>
      </Popup>
    </>
  );
}
```

### useConfirm Hook
**File:** `/src/hooks/useConfirm.tsx`

**Features:**
- Promise-based API
- Preset dialogs for common actions
- Liquid-glass styling
- Variant support (danger, primary, success)

**Usage:**
```tsx
import { useConfirm, confirmPresets } from './hooks/useConfirm';

function MyComponent() {
  const { confirm, ConfirmDialog } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm(confirmPresets.delete('Image'));
    
    if (confirmed) {
      // Perform delete
      showToast.success('Deleted!');
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      <ConfirmDialog />
    </>
  );
}
```

**Available Presets:**
- `confirmPresets.delete(itemName)`
- `confirmPresets.discard()`
- `confirmPresets.logout()`
- `confirmPresets.removeUser(userName)`
- `confirmPresets.cancelSubscription()`

### Toast System
**File:** `/src/utils/toast.tsx`

**Features:**
- Custom liquid-glass renderer
- Success, error, info, warning, loading states
- Promise-based toasts
- Action toasts with buttons
- Inline validation toasts

**Usage:**
```tsx
import { showToast } from './utils/toast';

// Basic toasts
showToast.success('Operation successful!');
showToast.error('Something went wrong');
showToast.info('Processing...');
showToast.warning('Low credits');

// Loading toast
const id = showToast.loading('Uploading...');
// Later update it
showToast.success('Upload complete!', { id });

// Promise toast
showToast.promise(
  uploadImage(),
  {
    loading: 'Uploading...',
    success: 'Uploaded!',
    error: 'Failed to upload',
  }
);

// Action toast
showActionToast(
  'Draft saved',
  'Publish',
  () => publishPost()
);
```

### Preloader Context
**File:** `/src/contexts/PreloaderContext.tsx`

**Features:**
- Global loading overlay
- Animated logo
- Custom messages
- Liquid-glass backdrop

**Setup:**
```tsx
// In App.tsx
import { PreloaderProvider } from './contexts/PreloaderContext';

<PreloaderProvider>
  <YourApp />
</PreloaderProvider>
```

**Usage:**
```tsx
import { usePreloader } from './contexts/PreloaderContext';

function MyComponent() {
  const { showPreloader, hidePreloader } = usePreloader();

  const handleUpload = async () => {
    showPreloader('Uploading image...');
    
    await uploadToServer();
    
    hidePreloader();
  };
}
```

### Form Validation
**File:** `/src/utils/validation.tsx`

**Features:**
- Common validation rules
- Inline field errors
- Toast notifications
- Field-level feedback
- Success indicators

**Usage:**
```tsx
import { 
  ValidatedField, 
  validationRules, 
  FieldValidator 
} from './utils/validation';

function MyForm() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const validator = new FieldValidator();

  const validateEmail = () => {
    return validator.validate('Email', email, [
      (val) => validationRules.required(val, 'Email'),
      (val) => validationRules.email(val),
    ]);
  };

  return (
    <ValidatedField
      label="Email"
      error={validator.getError('Email')}
      touched={touched}
      required
    >
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => {
          setTouched(true);
          validateEmail();
        }}
        className="input-glass w-full px-4 py-2"
      />
    </ValidatedField>
  );
}
```

**Validation Rules:**
- `required(value, fieldName)`
- `email(value, fieldName)`
- `minLength(value, min, fieldName)`
- `maxLength(value, max, fieldName)`
- `password(value, fieldName)`
- `confirmPassword(password, confirmPassword)`
- `url(value, fieldName)`
- `number(value, fieldName)`
- `min(value, min, fieldName)`
- `max(value, max, fieldName)`
- `fileSize(file, maxSizeMB)`
- `fileType(file, allowedTypes)`
- `imageFile(file)`

## 🎨 Liquid Glass CSS Classes

### Base Classes
```css
.liquid-glass         /* Standard glass effect */
.liquid-glass-light   /* Light variant */
.liquid-glass-dark    /* Dark variant */
.liquid-glass-intense /* More visible */
.liquid-glass-subtle  /* More transparent */
```

### Interactive Classes
```css
.liquid-glass-hover   /* Hover state */
.liquid-glass-active  /* Active/pressed state */
```

### Input/Button Classes
```css
.input-glass    /* Form inputs */
.button-glass   /* Buttons */
.badge-glass    /* Badges */
```

### Utility Classes
```css
.glass-divider    /* Horizontal divider */
.glass-shimmer    /* Shimmer animation */
.glass-scrollbar  /* Custom scrollbar */
.custom-scrollbar /* For modals/popups */
```

## 🎭 Animations

All animations are defined in `/src/styles/glass.css`:

- `modal-fade-in` - Backdrop fade in
- `modal-scale-in` - Modal scale animation
- `popup-slide-right` - Popup from right
- `popup-slide-left` - Popup from left
- `popup-slide-bottom` - Popup from bottom
- `preloader-fade-in` - Preloader backdrop
- `preloader-scale-in` - Preloader content
- `spin-reverse` - Reverse spin
- `pulse-scale` - Pulsing scale
- `credit-pulse` - Credit balance animation

## 📝 Common Patterns

### Pattern 1: Delete with Confirmation
```tsx
const { confirm, ConfirmDialog } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm(confirmPresets.delete('Image'));
  if (!confirmed) return;

  const { showPreloader, hidePreloader } = usePreloader();
  showPreloader('Deleting...');

  try {
    await deleteImage(imageId);
    hidePreloader();
    showToast.success('Image deleted');
  } catch (error) {
    hidePreloader();
    showToast.error('Failed to delete');
  }
};

return <><button onClick={handleDelete}>Delete</button><ConfirmDialog /></>;
```

### Pattern 2: Form Submission with Validation
```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate all fields
  const isValid = validator.validate('Email', email, [
    (val) => validationRules.required(val, 'Email'),
    (val) => validationRules.email(val),
  ]);

  if (!isValid) return;

  // Submit with loading toast
  await showToast.promise(
    submitForm(formData),
    {
      loading: 'Submitting...',
      success: 'Form submitted!',
      error: 'Submission failed',
    }
  );
};
```

### Pattern 3: Payment Flow
```tsx
const { isOpen, open, close } = usePopup('payment');
const { confirm, ConfirmDialog } = useConfirm();
const { showPreloader, hidePreloader } = usePreloader();

const handlePurchase = async (packageId) => {
  const confirmed = await confirm({
    title: 'Confirm Purchase',
    message: 'Purchase this package?',
    variant: 'success',
  });

  if (!confirmed) return;

  showPreloader('Processing payment...');

  try {
    await processPurchase(packageId);
    hidePreloader();
    showToast.success('Payment successful!');
    close();
  } catch (error) {
    hidePreloader();
    showToast.error('Payment failed');
  }
};
```

### Pattern 4: Image Upload with Preview
```tsx
const [imagePreview, setImagePreview] = useState(null);
const { isOpen, open, close } = usePopup('image-preview');

const handleFileChange = (e) => {
  const file = e.target.files[0];
  
  // Validate
  const error = validationRules.imageFile(file) || 
                validationRules.fileSize(file, 10);
  
  if (error) {
    showToast.error(error);
    return;
  }

  // Preview
  const reader = new FileReader();
  reader.onload = () => {
    setImagePreview(reader.result);
    open();
  };
  reader.readAsDataURL(file);
};
```

## 🔧 Troubleshooting

### Modals not appearing
- Ensure z-index is high enough (default: z-50)
- Check if PreloaderProvider is wrapping your app
- Verify glass.css is imported

### Toasts not showing
- Add `<ToastContainer />` to your app root
- Import react-hot-toast: `npm install react-hot-toast`

### Animations not working
- Ensure glass.css is imported
- Check Tailwind config includes animation utilities
- Verify browser supports backdrop-filter

### Backdrop blur not working
- Some browsers require `-webkit-backdrop-filter`
- Fallback: Use solid backgrounds for unsupported browsers

## 📚 Examples

See `/src/examples/UIExamples.tsx` for comprehensive examples including:
- Basic modals
- Confirm dialogs
- Sliding popups
- Toast notifications
- Form validation
- Nested modals
- Complete payment flows

## 🎯 Best Practices

1. **Always use ConfirmDialog for destructive actions**
2. **Show loading states with Preloader or loading toasts**
3. **Validate forms before submission**
4. **Provide clear error messages**
5. **Use appropriate toast types (success/error/info)**
6. **Keep modal content focused and concise**
7. **Use popups for multi-step flows**
8. **Add keyboard shortcuts (ESC to close)**
9. **Ensure accessible color contrast**
10. **Test on mobile devices**

## 🚀 Next Steps

1. Integrate Modal into image editing flow
2. Add Popup for payment selection
3. Use useConfirm for all delete actions
4. Replace alert() with toast notifications
5. Add form validation to all forms
6. Use Preloader for long operations

---

**Need Help?** Check `/src/examples/UIExamples.tsx` for working examples!
