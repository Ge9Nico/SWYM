import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import MainDashboard from './components/screens/MainDashboard';
import OnboardingScreen from './components/screens/OnboardingScreen';
import LoadingScreen from './components/screens/LoadingScreen';
import ModalManager from './components/modals/ModalManager';

// --- Main App Component ---
export default function App() {
    return (
        <AuthProvider>
            <ModalProvider>
                <div className="bg-gray-100 flex items-center justify-center p-4 min-h-screen">
                    <SWYMApp />
                </div>
            </ModalProvider>
        </AuthProvider>
    );
}

function SWYMApp() {
    const { user, loading } = useAuth();
    const { modal } = useModal();

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="app-container">
            {user ? <MainDashboard /> : <OnboardingScreen />}
            {modal && <ModalManager modal={modal} />}
        </div>
    );
}