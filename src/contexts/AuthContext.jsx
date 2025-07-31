import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe; // Cleanup subscription on unmount
    }, []);

    const value = { user, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
