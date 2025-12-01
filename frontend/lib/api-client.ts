const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';

interface RequestOptions extends RequestInit {
    token?: string;
}

class APIClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { token, ...fetchOptions } = options;

        const headers: any = {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Auth endpoints
    async register(data: { email: string; name: string; password: string }) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(data: { email: string; password: string }) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async refreshToken(refreshToken: string) {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    }

    async googleLogin(token: string) {
        return this.request('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async verifyEmail(data: { email: string; otp: string }) {
        return this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // User endpoints
    async getUsers(token: string) {
        return this.request<any[]>('/users', { token });
    }

    async getCurrentUser(token: string) {
        return this.request('/users/me', { token });
    }

    async getOnlineUsers(token: string) {
        return this.request('/users/online', { token });
    }

    async updateUserProfile(userId: string, data: { name?: string; profilePicUrl?: string }, token: string) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    }

    // Session endpoints
    async getSessions(token: string) {
        return this.request<any[]>('/sessions', { token });
    }

    async getSession(sessionId: string, token: string) {
        return this.request(`/sessions/${sessionId}`, { token });
    }

    async createSession(data: { isGroup: boolean; name?: string; memberIds: string[]; categoryId?: string }, token: string) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(data),
            token,
        });
    }

    async addMember(sessionId: string, userId: string, token: string) {
        return this.request(`/sessions/${sessionId}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
            token,
        });
    }

    async removeMember(sessionId: string, userId: string, token: string) {
        return this.request(`/sessions/${sessionId}/members/${userId}`, {
            method: 'DELETE',
            token,
        });
    }

    // Message endpoints
    async getMessages(sessionId: string, token: string, limit = 50, offset = 0) {
        return this.request(`/messages/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`, { token });
    }

    async markMessageAsRead(messageId: string, token: string) {
        return this.request(`/messages/${messageId}/read`, {
            method: 'PUT',
            token,
        });
    }

    async markSessionMessagesAsRead(sessionId: string, token: string) {
        return this.request(`/messages/sessions/${sessionId}/messages/read`, {
            method: 'PUT',
            token,
        });
    }

    async searchMessages(query: string, token: string, sessionId?: string) {
        const params = new URLSearchParams({ q: query });
        if (sessionId) params.append('sessionId', sessionId);
        return this.request(`/messages/search?${params.toString()}`, { token });
    }

    // Category endpoints
    async getCategories(token: string) {
        return this.request<any[]>('/categories', { token });
    }

    async createCategory(name: string, token: string) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify({ name }),
            token,
        });
    }

    async assignCategoryToSession(sessionId: string, categoryId: string | null, token: string) {
        return this.request(`/categories/sessions/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify({ categoryId }),
            token,
        });
    }

    async deleteCategory(categoryId: string, token: string) {
        return this.request(`/categories/${categoryId}`, {
            method: 'DELETE',
            token,
        });
    }

    // AI endpoints
    async getAIUser(token: string) {
        return this.request('/ai/user', { token });
    }

    async createAIChatSession(token: string) {
        return this.request<any>('/ai/session', {
            method: 'POST',
            token,
        });
    }
}

export const apiClient = new APIClient(API_BASE_URL);
