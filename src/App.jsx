import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInAnonymously, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithCredential,
    EmailAuthProvider,
    sendPasswordResetEmail
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    doc, 
    setDoc, 
    serverTimestamp,
    writeBatch,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

// --- Firebase Configuration & Services ---
let firebaseServices = null;
try {
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        const googleProvider = new GoogleAuthProvider();
        firebaseServices = { auth, db, storage, googleProvider, appId };
        console.log("Firebase initialized successfully.");
    } else {
        console.warn("Firebase config not found. Running in offline/demo mode.");
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}


// --- React Context for Auth ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (firebaseServices && firebaseServices.auth) {
            const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
                setUser(user);
                setLoading(false);
            });
            return unsubscribe;
        } else {
            setLoading(false);
            setUser(null);
        }
    }, []);

    const value = { user, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Main App Component ---
export default function App() {
    return (
        <AuthProvider>
            <div className="bg-gray-100 flex items-center justify-center p-4 min-h-screen">
                <SWYMApp />
            </div>
        </AuthProvider>
    );
}

function SWYMApp() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="app-container">
            {user ? <MainDashboard /> : <OnboardingScreen />}
        </div>
    );
}

// --- Screens ---
const LoadingScreen = () => (
    <div className="p-8 flex flex-col justify-center items-center h-full">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
        <p className="text-gray-500 mt-8">Initializing SWYM...</p>
    </div>
);

const OnboardingScreen = () => {
    const handleGetStarted = async () => {
        if (!firebaseServices) {
            alert("Firebase is not connected. Cannot start a session.");
            return;
        }
        try {
            await signInAnonymously(firebaseServices.auth);
        } catch (error) {
            alert("Initialization Failed: " + error.message);
        }
    };

    return (
        <div className="p-8 flex flex-col justify-center items-center h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Welcome to SWYM</h1>
            <p className="text-gray-600 mb-8 text-center">Get a clear overview of your insurance policies and unlock hidden benefits with the power of AI.</p>
            <button onClick={handleGetStarted} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 transition">
                Analyze Your First Document
            </button>
        </div>
    );
};

const MainDashboard = () => {
    const { user } = useAuth();
    const [policies, setPolicies] = useState([]);
    const [documents, setDocuments] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user || !firebaseServices) return;

        const { db, appId } = firebaseServices;
        const policiesRef = collection(db, "artifacts", appId, "users", user.uid, "policies");
        const unsubPolicies = onSnapshot(query(policiesRef), (snapshot) => {
            setPolicies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const documentsRef = collection(db, "artifacts", appId, "users", user.uid, "documents");
        const unsubDocs = onSnapshot(query(documentsRef), (snapshot) => {
            setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubPolicies();
            unsubDocs();
        };
    }, [user]);

    const handleFileUpload = async (event) => {
        // ... (File upload logic will go here in a future step)
    };

    const handleFabClick = () => {
        if (!firebaseServices) {
            alert("Firebase is not connected. Cannot upload files.");
            return;
        }
        fileInputRef.current.click();
    };
    
    const hasContent = policies.length > 0 || documents.length > 0;

    return (
        <div className="flex-1 flex flex-col">
            <header className="flex justify-between items-center p-6 pb-4 sticky top-0 bg-white z-10 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
            </header>
            
            <main className="p-6 overflow-y-auto flex-grow">
                {!hasContent && (
                    <div className="text-center text-gray-500 py-16">
                        <p className="text-lg">Click the '+' button to analyze your first policy!</p>
                    </div>
                )}
                {hasContent && (
                    <div className="space-y-8">
                        <BenefitsSection policies={policies} />
                        <CoverageSection policies={policies} />
                        <DocumentsSection documents={documents} />
                    </div>
                )}
            </main>

            <button onClick={handleFabClick} className="absolute bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg z-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
        </div>
    );
};

// --- Dashboard Components ---
const BenefitsSection = ({ policies }) => {
    // This is a placeholder for now
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Benefits</h3>
            <p className="text-sm text-gray-500">No benefits identified yet.</p>
        </div>
    );
};

const CoverageSection = ({ policies }) => {
     // This is a placeholder for now
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Coverage</h3>
            <p className="text-sm text-gray-500">No coverage details available yet.</p>
        </div>
    );
};

const DocumentsSection = ({ documents }) => {
    if (documents.length === 0) return null;
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Documents</h3>
            <div className="space-y-2">
                {documents.map(doc => <DocumentStatusItem key={doc.id} doc={doc} />)}
            </div>
        </div>
    );
};

const DocumentStatusItem = ({ doc }) => {
    // This is a placeholder for now
    return (
        <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <span>{doc.fileName} ({doc.status})</span>
            </div>
        </div>
    );
};
