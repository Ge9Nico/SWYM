import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import MainDashboard from './components/screens/MainDashboard';
import OnboardingScreen from './components/screens/OnboardingScreen';
import { UserDataProvider } from './contexts/UserDataContext';
import LoadingScreen from './components/screens/LoadingScreen';
import ModalManager from './components/modals/ModalManager';

// --- Main App Component ---
export default function App() {
    // The App component now simply wraps the providers and the main SWYMApp.
    // The unnecessary state and useEffect for initialization have been removed.
    return (
        <AuthProvider>
            <ModalProvider>
                <UserDataProvider>
                    <div className="bg-gray-100 flex items-center justify-center p-4 min-h-screen">
                        <SWYMApp />
                    </div>
                </UserDataProvider>
            </ModalProvider>
        </AuthProvider>
    );
}

function SWYMApp() {
    const { user, loading: authLoading } = useAuth();
    const { modal } = useModal();

    if (authLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="app-container">
            {user ? <MainDashboard /> : <OnboardingScreen />}
            {modal && <ModalManager modal={modal} />}
        </div>
    );
}