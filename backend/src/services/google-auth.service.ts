import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class GoogleAuthService {
    static async verifyToken(token: string) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            return payload;
        } catch (error) {
            console.error('Error verifying Google token:', error);
            throw new Error('Invalid Google token');
        }
    }
}
