import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming your firebase instance is exported from firebase.js
import { useAuth } from './AuthContext'; // Assuming AuthContext provides the current user

const UserDataContext = createContext();

export function useUserData() {
    return useContext(UserDataContext);
}

export function UserDataProvider({ children }) {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let unsubscribe = () => {}; // Initialize with a no-op function

        if (user) {
            setLoading(true);
            setError(null);
            const userDocRef = doc(db, 'users', user.uid);

            unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    setUserData(null); // User document doesn't exist
                }
                setLoading(false);
            }, (err) => {
                setError(err);
                setLoading(false);
                console.error("Error fetching user data:", err);
            });
        } else {
            setUserData(null);
            setLoading(false);
            setError(null);
        }

        return () => {
            unsubscribe(); // Clean up the listener
        };
    }, [user]); // Re-run effect if the user object changes

    const value = {
        userData,
        loading,
        error,
    };

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
}