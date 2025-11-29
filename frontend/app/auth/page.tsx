'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';

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
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg rounded-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Welcome back
                    </CardTitle>
                    <CardDescription>
                        Sign in to your account or create a new one
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="signin" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="signin">
                            <Form {...signInForm}>
                                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                                    <FormField
                                        control={signInForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="name@example.com" {...field} />
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
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="text-right">
                                        <a href="#" className="text-sm text-primary hover:underline">
                                            Forgot password?
                                        </a>
                                    </div>
                                    <Button className="w-full" type="submit" disabled={isLoading}>
                                        {isLoading ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <Form {...signUpForm}>
                                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                                    <FormField
                                        control={signUpForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
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
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="name@example.com" {...field} />
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
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••" {...field} />
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
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button className="w-full" type="submit" disabled={isLoading}>
                                        {isLoading ? 'Creating account...' : 'Create Account'}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
