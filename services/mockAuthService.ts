import { User } from '../types';

// Mock user database
const MOCK_USERS = {
    'admin@unistay.com': {
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@unistay.com',
        password: 'password123',
        isAdmin: true,
    },
    'sarah@unistay.com': {
        id: 'profile-1', // Matches a roommate profile
        name: 'Sarah Doe',
        email: 'sarah@unistay.com',
        password: 'password123',
        isAdmin: false,
    }
};

let currentUser: User | null = null;
let onAuthChangeCallback: ((user: User | null) => void) | null = null;

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
    async login(email: string, password: string): Promise<User> {
        await simulateDelay(500);
        const userInDb = Object.values(MOCK_USERS).find(u => u.email === email);
        if (userInDb && userInDb.password === password) {
            currentUser = { id: userInDb.id, name: userInDb.name, email: userInDb.email };
            if (onAuthChangeCallback) onAuthChangeCallback(currentUser);
            return currentUser;
        }
        throw new Error('Invalid email or password.');
    },

    async signUp(name: string, email: string, password: string): Promise<User> {
        await simulateDelay(600);
        if (Object.values(MOCK_USERS).find(u => u.email === email)) {
            throw new Error('An account with this email already exists.');
        }
        const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
        };
        MOCK_USERS[email] = { ...newUser, password, isAdmin: false };
        currentUser = newUser;
        if (onAuthChangeCallback) onAuthChangeCallback(currentUser);
        return currentUser;
    },

    async socialLogin(provider: 'Google'): Promise<User> {
        await simulateDelay(700);
        // Log in as a predefined user for social login simulation
        const user = MOCK_USERS['sarah@unistay.com'];
        currentUser = { id: user.id, name: user.name, email: user.email };
        if (onAuthChangeCallback) onAuthChangeCallback(currentUser);
        return currentUser;
    },

    async logout(): Promise<void> {
        await simulateDelay(200);
        currentUser = null;
        if (onAuthChangeCallback) onAuthChangeCallback(null);
    },

    // A way for the app to listen to auth changes, mimicking onAuthStateChanged
    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        onAuthChangeCallback = callback;
        // Immediately call with current user state
        callback(currentUser);
        // Return an unsubscribe function
        return () => {
            onAuthChangeCallback = null;
        };
    },
    
    // Check if a user is an admin
    isAdmin(user: User | null): boolean {
        if (!user) return false;
        const userInDb = Object.values(MOCK_USERS).find(u => u.id === user.id);
        return userInDb?.isAdmin || false;
    }
};
