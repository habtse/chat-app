'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function GoogleLoginButton() {
    const { loginWithGoogle } = useAuth();
    const router = useRouter();

    const handleSuccess = async (credentialResponse: any) => {
        try {
            if (credentialResponse.credential) {
                await loginWithGoogle(credentialResponse.credential);
                router.push('/chat');
            }
        } catch (error) {
            console.error('Google login failed:', error);
        }
    };

    // Check if Google Client ID is configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
        return (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                    Google Sign-In is not configured. Please add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file.
                </p>
            </div>
        );
    }

    return (
        <div className="flex justify-center w-full">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => {
                    console.error('Google Login Failed');
                }}
                useOneTap
                theme="outline"
                size="large"
                width="100%"
            />
        </div>
    );
}
