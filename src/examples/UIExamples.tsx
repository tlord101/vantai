/**
 * UI System Examples
 * 
 * Comprehensive examples of using the custom UI components.
 * Copy these patterns into your components.
 */

import { useState } from 'react';
import Modal, { ConfirmModal } from '../components/Modal';
import Popup from '../components/Popup';
import { usePopup } from '../hooks/usePopup';
import { useConfirm, confirmPresets } from '../hooks/useConfirm';
import { usePreloader } from '../contexts/PreloaderContext';
import { showToast, showActionToast } from '../utils/toast';
import { ValidatedField, validationRules, FieldValidator } from '../utils/validation';

/**
 * Example 1: Basic Modal Usage
 */
export function BasicModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Welcome"
        size="md"
      >
        <p className="text-white/80">
          This is a basic modal with liquid-glass styling.
        </p>
      </Modal>
    </>
  );
}

/**
 * Example 2: Confirm Modal for Destructive Actions
 */
export function ConfirmModalExample() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    // Perform delete action
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast.success('Item deleted successfully');
    setShowConfirm(false);
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>Delete Item</button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}

/**
 * Example 3: useConfirm Hook (Recommended)
 */
export function UseConfirmExample() {
  const { confirm, ConfirmDialog } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm(confirmPresets.delete('Image'));
    
    if (confirmed) {
      showToast.success('Image deleted');
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm(confirmPresets.logout());
    
    if (confirmed) {
      // Perform logout
      showToast.info('Logged out successfully');
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Delete Image</button>
      <button onClick={handleLogout}>Logout</button>
      <ConfirmDialog />
    </>
  );
}

/**
 * Example 4: Sliding Popup Panel
 */
export function PopupExample() {
  const { isOpen, open, close } = usePopup('payment');

  return (
    <>
      <button onClick={() => open()}>Open Payment Panel</button>

      <Popup
        isOpen={isOpen}
        onClose={close}
        title="Payment"
        size="md"
        position="right"
      >
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold">Select Package</h3>
          <div className="grid gap-3">
            <div className="liquid-glass p-4 rounded-lg">
              <p className="text-white">Starter - ₦500</p>
            </div>
            <div className="liquid-glass p-4 rounded-lg">
              <p className="text-white">Pro - ₦1,200</p>
            </div>
          </div>
        </div>
      </Popup>
    </>
  );
}

/**
 * Example 5: Global Preloader
 */
export function PreloaderExample() {
  const { showPreloader, hidePreloader } = usePreloader();

  const handleUpload = async () => {
    showPreloader('Uploading image...');
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    hidePreloader();
    showToast.success('Upload complete!');
  };

  return (
    <button onClick={handleUpload}>Upload Image</button>
  );
}

/**
 * Example 6: Toast Notifications
 */
export function ToastExamples() {
  return (
    <div className="space-y-3">
      <button onClick={() => showToast.success('Operation successful!')}>
        Success Toast
      </button>

      <button onClick={() => showToast.error('Something went wrong')}>
        Error Toast
      </button>

      <button onClick={() => showToast.info('Processing your request...')}>
        Info Toast
      </button>

      <button onClick={() => showToast.warning('Low credits remaining')}>
        Warning Toast
      </button>

      <button onClick={() => {
        const id = showToast.loading('Uploading...');
        setTimeout(() => {
          showToast.success('Upload complete!', { id });
        }, 2000);
      }}>
        Loading → Success
      </button>

      <button onClick={() => {
        showActionToast(
          'Changes saved as draft',
          'Publish',
          () => showToast.success('Published!')
        );
      }}>
        Action Toast
      </button>
    </div>
  );
}

/**
 * Example 7: Promise Toast
 */
export function PromiseToastExample() {
  const uploadImage = async () => {
    // Simulate API call
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('success') : reject(new Error('Failed'));
      }, 2000);
    });
  };

  const handleUpload = () => {
    showToast.promise(
      uploadImage(),
      {
        loading: 'Uploading image...',
        success: 'Image uploaded successfully!',
        error: (err) => `Upload failed: ${err.message}`,
      }
    );
  };

  return (
    <button onClick={handleUpload}>Upload with Promise Toast</button>
  );
}

/**
 * Example 8: Form Validation
 */
export function FormValidationExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const validator = new FieldValidator();

  const validateEmail = () => {
    return validator.validate('Email', email, [
      (val) => validationRules.required(val, 'Email'),
      (val) => validationRules.email(val),
    ]);
  };

  const validatePassword = () => {
    return validator.validate('Password', password, [
      (val) => validationRules.required(val, 'Password'),
      (val) => validationRules.minLength(val, 8, 'Password'),
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (isEmailValid && isPasswordValid) {
      showToast.success('Form submitted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ValidatedField
        label="Email"
        error={validator.getError('Email')}
        touched={touched.email}
        required
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            setTouched(prev => ({ ...prev, email: true }));
            validateEmail();
          }}
          className="input-glass w-full px-4 py-2"
          placeholder="Enter your email"
        />
      </ValidatedField>

      <ValidatedField
        label="Password"
        error={validator.getError('Password')}
        touched={touched.password}
        required
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => {
            setTouched(prev => ({ ...prev, password: true }));
            validatePassword();
          }}
          className="input-glass w-full px-4 py-2"
          placeholder="Enter your password"
        />
      </ValidatedField>

      <button type="submit" className="button-glass px-6 py-2">
        Submit
      </button>
    </form>
  );
}

/**
 * Example 9: Nested Modals
 */
export function NestedModalsExample() {
  const [firstModal, setFirstModal] = useState(false);
  const [secondModal, setSecondModal] = useState(false);

  return (
    <>
      <button onClick={() => setFirstModal(true)}>Open First Modal</button>

      <Modal
        isOpen={firstModal}
        onClose={() => setFirstModal(false)}
        title="First Modal"
      >
        <p className="text-white/80 mb-4">This is the first modal.</p>
        <button
          onClick={() => setSecondModal(true)}
          className="button-glass px-4 py-2"
        >
          Open Second Modal
        </button>

        <Modal
          isOpen={secondModal}
          onClose={() => setSecondModal(false)}
          title="Second Modal"
          size="sm"
        >
          <p className="text-white/80">This is a nested modal!</p>
        </Modal>
      </Modal>
    </>
  );
}

/**
 * Example 10: Complete Payment Flow with Multiple UI Elements
 */
export function CompletePaymentFlowExample() {
  const { confirm, ConfirmDialog } = useConfirm();
  const { showPreloader, hidePreloader } = usePreloader();
  const { isOpen, open, close } = usePopup('payment');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    const confirmed = await confirm({
      title: 'Confirm Purchase',
      message: `Purchase ${packageId} package for ₦1,200?`,
      confirmText: 'Purchase',
      variant: 'success',
    });

    if (!confirmed) return;

    showPreloader('Processing payment...');

    try {
      // Simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      hidePreloader();
      showToast.success('Payment successful! Credits added to your account.');
      close();
    } catch (error) {
      hidePreloader();
      showToast.error('Payment failed. Please try again.');
    }
  };

  return (
    <>
      <button onClick={() => open()}>Buy Credits</button>

      <Popup
        isOpen={isOpen}
        onClose={close}
        title="Purchase Credits"
        size="lg"
      >
        <div className="space-y-6">
          {/* Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Starter', 'Pro', 'Premium'].map((pkg) => (
              <div
                key={pkg}
                onClick={() => setSelectedPackage(pkg)}
                className={`liquid-glass p-6 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                  selectedPackage === pkg ? 'border-2 border-blue-400' : ''
                }`}
              >
                <h3 className="text-white text-xl font-bold mb-2">{pkg}</h3>
                <p className="text-white/70 mb-4">
                  {pkg === 'Starter' && '50 credits - ₦500'}
                  {pkg === 'Pro' && '150 credits - ₦1,200'}
                  {pkg === 'Premium' && '500 credits - ₦3,500'}
                </p>
                {selectedPackage === pkg && (
                  <div className="text-blue-400 text-sm">✓ Selected</div>
                )}
              </div>
            ))}
          </div>

          {/* Purchase Button */}
          <button
            onClick={() => selectedPackage && handlePurchase(selectedPackage)}
            disabled={!selectedPackage}
            className="button-glass w-full py-3 disabled:opacity-50"
          >
            Purchase Now
          </button>
        </div>
      </Popup>

      <ConfirmDialog />
    </>
  );
}
