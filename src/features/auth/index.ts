/**
 * Feature: Auth
 * Barrel export for the authentication feature module.
 */

// Components will be added in Task 2
// export { SignInForm } from './components/SignInForm';
// export { SignUpForm } from './components/SignUpForm';

// Hooks
export { useAuth } from '@/hooks/useAuth';

// Validators
export {
  loginSchema,
  registerSchema,
} from '@/lib/validators/auth.validators';
export type {
  LoginFormValues,
  RegisterFormValues,
} from '@/lib/validators/auth.validators';
