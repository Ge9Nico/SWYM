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
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'default-app-id';

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

// --- React Contexts ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

const ModalContext = createContext();
const useModal = () => useContext(ModalContext);

// --- Providers ---
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

const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null);
    const showModal = (modalType, modalProps = {}) => setModal({ type: modalType, props: modalProps });
    const closeModal = () => setModal(null);

    return (
        <ModalContext.Provider value={{ showModal, closeModal }}>
            {children}
            {modal && <ModalManager modal={modal} />}
        </ModalContext.Provider>
    );
};

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
    const { showModal } = useModal();
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
        if (!firebaseServices || !user || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const fileName = `${Date.now()}-${file.name}`;
        const { storage, db, appId } = firebaseServices;
        const userId = user.uid;

        const storagePath = `artifacts/${appId}/users/${userId}/uploads/${fileName}`;
        const storageRef = ref(storage, storagePath);
        const docStatusRef = doc(db, "artifacts", appId, "users", userId, "documents", fileName);

        try {
            await setDoc(docStatusRef, { status: 'uploading', fileName: file.name, createdAt: serverTimestamp() });
            await uploadBytes(storageRef, file);
            await setDoc(docStatusRef, { status: 'processing' }, { merge: true });

            setTimeout(async () => {
                try {
                    const policyData = { provider: "Simulated Insurance", dates: "2025-2026", insuranceTypes: [{type: "General", coverages: ["Simulated Coverage"]}], perks: [{name: "Simulated Perk", description: "A cool benefit"}]};
                    const policiesRef = collection(db, "artifacts", appId, "users", userId, "policies");
                    await addDoc(policiesRef, { ...policyData, sourceFile: fileName });
                    await setDoc(docStatusRef, { status: 'completed', completedAt: serverTimestamp() }, { merge: true });
                } catch (simError) {
                    await setDoc(docStatusRef, { status: 'failed', error: simError.message }, { merge: true });
                }
            }, 5000);

        } catch (error) {
            await setDoc(docStatusRef, { status: 'failed', error: error.message }, { merge: true });
        }
    };

    const handleFabClick = () => {
        const limit = user.isAnonymous ? 1 : 3;
        const count = user.isAnonymous ? policies.length : documents.length;
        if (count >= limit) {
            showModal('upgrade', { isGuest: user.isAnonymous });
        } else {
            fileInputRef.current.click();
        }
    };
    
    const hasContent = policies.length > 0 || documents.length > 0;

    return (
        <div className="flex-1 flex flex-col">
            <header className="flex justify-between items-center p-6 pb-4 sticky top-0 bg-white z-10 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <button onClick={() => showModal('account')} className="text-gray-400 hover:text-gray-600">
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
    const allPerks = policies.flatMap(p => p.perks || []);
    const uniquePerks = Array.from(new Map(allPerks.map(item => [item.name, item])).values());

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Benefits</h3>
            {uniquePerks.length === 0 ? (
                <p className="text-sm text-gray-500">No benefits identified yet.</p>
            ) : (
                <div className="space-y-3">
                    {uniquePerks.map((perk, index) => (
                        <div key={index} className="bg-purple-50 p-3 rounded-lg shadow-sm border border-purple-200 break-words">
                            <p className="font-medium text-purple-800">{perk.name}</p>
                            <p className="text-xs text-gray-600">{perk.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CoverageSection = ({ policies }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Coverage</h3>
            {policies.length === 0 ? (
                <p className="text-sm text-gray-500">No coverage details available yet.</p>
            ) : (
                <div className="space-y-4">
                    {policies.map(policy => (
                        <div key={policy.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-md break-words">
                            <h3 className="text-lg font-semibold text-gray-800">{policy.provider}</h3>
                            {policy.insuranceTypes.map((it, index) => (
                                <div key={index} className="mt-3">
                                    <h4 className="text-md font-semibold text-gray-700">{it.type}</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mt-1 pl-2">
                                        {it.coverages.map((cov, i) => <li key={i}>{cov}</li>)}
                                    </ul>
                                </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-3 pt-3 border-t">Policy Period: {policy.dates}</p>
                        </div>
                    ))}
                </div>
            )}
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
    let statusIcon;
    if (doc.status === 'processing' || doc.status === 'uploading') {
        statusIcon = <div className="loader h-5 w-5 border-2 border-t-2 rounded-full"></div>;
    } else if (doc.status === 'completed') {
        statusIcon = <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
    } else if (doc.status === 'failed') {
        statusIcon = <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
    }

    return (
        <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-3">
                {statusIcon}
                <span>{doc.fileName} ({doc.status})</span>
            </div>
        </div>
    );
};

// --- Modals ---
const ModalManager = ({ modal }) => {
    if (!modal) return null;

    const ModalWrapper = ({ children }) => (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );

    switch (modal.type) {
        case 'account': return <ModalWrapper><AccountModal /></ModalWrapper>;
        case 'auth': return <ModalWrapper><AuthModal /></ModalWrapper>;
        case 'upgrade': return <ModalWrapper><UpgradeModal {...modal.props} /></ModalWrapper>;
        default: return null;
    }
};

const AccountModal = () => {
    const { user } = useAuth();
    const { showModal, closeModal } = useModal();
    const isLoggedIn = user && !user.isAnonymous;

    const handleLogout = async () => {
        await signOut(firebaseServices.auth);
        closeModal();
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{isLoggedIn ? "Account Status" : "Create your Free Account"}</h3>
            {isLoggedIn ? (
                <>
                    <p className="text-gray-600 mb-1">You are logged in as:</p>
                    <p className="text-gray-800 font-mono text-sm break-all mb-6">{user.uid}</p>
                    <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition mb-2">Log Out</button>
                </>
            ) : (
                <>
                    <p className="text-gray-600 mb-6">Add up to 3 documents and save your data to your secure account.</p>
                    <button onClick={() => showModal('auth')} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition mb-2">Create Free Account</button>
                </>
            )}
            <button onClick={closeModal} className="w-full text-gray-500 py-2">Maybe Later</button>
        </div>
    );
};

const AuthModal = () => {
    const [isLogin, setIsLogin] = useState(false);
    const { closeModal } = useModal();
    // ... Full auth modal implementation will go here
    return (
        <div>
            <div className="flex border-b mb-4 justify-around">
                <div className={`auth-tab ${!isLogin && 'active'}`} onClick={() => setIsLogin(false)}>Create Account</div>
                <div className={`auth-tab ${isLogin && 'active'}`} onClick={() => setIsLogin(true)}>Log In</div>
            </div>
            {isLogin ? <LoginForm /> : <SignUpForm />}
            <button onClick={closeModal} className="w-full text-gray-500 py-2 text-center mt-2">Cancel</button>
        </div>
    );
}

const SignUpForm = () => {
    // ...
    return <div>Sign Up Form Placeholder</div>
}

const LoginForm = () => {
    // ...
    return <div>Log In Form Placeholder</div>
}

const UpgradeModal = ({ isGuest }) => {
    const { showModal, closeModal } = useModal();
    const title = isGuest ? "Add More Documents" : "Go Premium";
    const message = isGuest 
        ? "Create a free account to save this analysis and add up to 3 documents."
        : "Upgrade to Premium to analyze unlimited documents and unlock advanced features.";
    const buttonText = isGuest ? "Create Free Account" : "Upgrade Now";

    const handleUpgrade = () => {
        if (isGuest) {
            showModal('auth');
        } else {
            alert("Premium feature coming soon!");
        }
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <button onClick={handleUpgrade} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition mb-2">{buttonText}</button>
            <button onClick={closeModal} className="w-full text-gray-500 py-2">Maybe Later</button>
        </div>
    );
};
