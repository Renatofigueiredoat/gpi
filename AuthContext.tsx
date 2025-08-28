import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User as AppUser } from '../types';
import { mockUser } from '../data/mockUser';

interface AuthContextType {
    currentUser: AppUser | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
    currentUser: null, 
    setCurrentUser: () => {},
    loading: true 
});

export const useAuth = () => {
    return useContext(AuthContext);
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // A aplicação agora usa um usuário mockado por padrão, sem necessidade de login.
    const [currentUser, setCurrentUser] = useState<AppUser | null>(mockUser);

    const value = {
        currentUser,
        setCurrentUser,
        loading: false, // A autenticação não é mais assíncrona.
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};