'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Loader2, Mail, Lock, User } from 'lucide-react';

const signInSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signUpSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export default function AuthPage() {
    const { login, register } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const signInForm = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const signUpForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    async function onSignIn(values: z.infer<typeof signInSchema>) {
        setIsLoading(true);
        try {
            await login(values.email, values.password);
            toast({
                title: 'Success',
                description: 'Logged in successfully',
            });
            router.push('/chat');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to login',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function onSignUp(values: z.infer<typeof signUpSchema>) {
        setIsLoading(true);
        try {
            await register(values.email, values.name, values.password);
            toast({
                title: 'Success',
                description: 'Account created successfully',
            });
            router.push('/chat');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to register',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            {/* Main card */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
                    {/* Logo and title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h1>
                        <p className="text-gray-600">
                            {isSignUp ? 'Join Shipper Chat today' : 'Sign in to continue to Shipper Chat'}
                        </p>
                    </div>

                    {/* Toggle buttons */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setIsSignUp(false)}
                            className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${!isSignUp
                                    ? 'bg-white text-indigo-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsSignUp(true)}
                            className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${isSignUp
                                    ? 'bg-white text-indigo-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Sign In Form */}
                    {!isSignUp && (
                        <Form {...signInForm}>
                            <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                                <FormField
                                    control={signInForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        placeholder="name@example.com"
                                                        {...field}
                                                        className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={signInForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••"
                                                        {...field}
                                                        className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/50 transition-all"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}

                    {/* Sign Up Form */}
                    {isSignUp && (
                        <Form {...signUpForm}>
                            <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                                <FormField
                                    control={signUpForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        placeholder="John Doe"
                                                        {...field}
                                                        className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={signUpForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        placeholder="name@example.com"
                                                        {...field}
                                                        className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={signUpForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••"
                                                        {...field}
                                                        className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={signUpForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••"
                                                        {...field}
                                                        className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/50 transition-all"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Test credentials: john@example.com / password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
