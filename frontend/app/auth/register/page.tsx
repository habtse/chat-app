'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import Link from 'next/link';
import { GoogleLoginButton } from '../../../components/auth/google-login-button';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateName = (name: string): boolean => {
        if (!name.trim()) {
            setNameError('Name is required');
            return false;
        }
        if (name.trim().length < 2) {
            setNameError('Name must be at least 2 characters');
            return false;
        }
        setNameError('');
        return true;
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (password: string): boolean => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        if (!/(?=.*[a-z])/.test(password)) {
            setPasswordError('Password must contain at least one lowercase letter');
            return false;
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            setPasswordError('Password must contain at least one uppercase letter');
            return false;
        }
        if (!/(?=.*\d)/.test(password)) {
            setPasswordError('Password must contain at least one number');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const validateConfirmPassword = (confirmPassword: string): boolean => {
        if (!confirmPassword) {
            setConfirmPasswordError('Please confirm your password');
            return false;
        }
        if (confirmPassword !== password) {
            setConfirmPasswordError('Passwords do not match');
            return false;
        }
        setConfirmPasswordError('');
        return true;
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        if (nameError) {
            validateName(value);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (emailError) {
            validateEmail(value);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (passwordError) {
            validatePassword(value);
        }
        // Re-validate confirm password if it's already filled
        if (confirmPassword && confirmPasswordError) {
            validateConfirmPassword(confirmPassword);
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (confirmPasswordError) {
            validateConfirmPassword(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate all fields
        const isNameValid = validateName(name);
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

        if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        setIsLoading(true);

        try {
            await register(email, name, password);
            router.push(`/auth/otp-verification?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join Shipper Chat today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            onBlur={() => validateName(name)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${nameError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-indigo-500'
                                }`}
                            placeholder="John Doe"
                        />
                        {nameError && (
                            <p className="mt-1 text-sm text-red-600">{nameError}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={() => validateEmail(email)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${emailError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-indigo-500'
                                }`}
                            placeholder="you@example.com"
                        />
                        {emailError && (
                            <p className="mt-1 text-sm text-red-600">{emailError}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={handlePasswordChange}
                                onBlur={() => validatePassword(password)}
                                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${passwordError
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {passwordError ? (
                            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                        ) : (
                            <p className="mt-1 text-sm text-gray-500">Must contain uppercase, lowercase, number, and be 6+ characters</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                onBlur={() => validateConfirmPassword(confirmPassword)}
                                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${confirmPasswordError
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {confirmPasswordError && (
                            <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <GoogleLoginButton />
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
