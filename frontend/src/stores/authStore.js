import {
    create
} from 'zustand';
import {
    authService
} from '../services/auth';

export const useAuthStore = create((set) => ({
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,

    register: async (name, email, password) => {
        set({
            loading: true,
            error: null
        });
        try {
            const response = await authService.register(name, email, password);
            set({
                loading: false
            });
            return response;
        } catch (error) {
            set({
                error: error.message || 'Registration failed',
                loading: false
            });
            throw error;
        }
    },

    verifyCode: async (code) => {
        set({
            loading: true,
            error: null
        });
        try {
            const response = await authService.verifyCode(code);
            set({
                loading: false
            });
            return response;
        } catch (error) {
            set({
                error: error.message || 'Verification failed',
                loading: false
            });
            throw error;
        }
    },

    resendVerification: async (email) => {
        try {
            const response = await authService.resendVerification(email);
            return response;
        } catch (error) {
            throw error.message || 'Failed to resend verification';
        }
    },

    login: async (email, password) => {
        set({
            loading: true,
            error: null
        });
        try {
            const user = await authService.login(email, password);
            set({
                user,
                isAuthenticated: true,
                loading: false
            });
            return user;
        } catch (error) {
            set({
                error: error.message || 'Login failed',
                loading: false
            });
            throw error;
        }
    },

    forgotPassword: async (email) => {
        set({
            loading: true,
            error: null
        });
        try {
            const response = await authService.forgotPassword(email);
            set({
                loading: false
            });
            return response;
        } catch (error) {
            set({
                error: error.message || 'Password reset failed',
                loading: false
            });
            throw error;
        }
    },

    logout: () => {
        authService.logout();
        set({
            user: null,
            isAuthenticated: false
        });
    },

    checkAuth: async () => {
        set({
            loading: true
        });
        try {
            const user = await authService.getCurrentUser();
            set({
                user,
                isAuthenticated: true,
                loading: false
            });
            return user;
        } catch (error) {
            set({
                user: null,
                isAuthenticated: false,
                loading: false
            });
            return null;
        }
    }
}));