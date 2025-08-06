import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { db, appId, storage } from '../../firebase';
import { collection, onSnapshot, query, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import BenefitsSection from '../dashboard/BenefitsSection';
import CoverageSection from '../dashboard/CoverageSection';
import DocumentsSection from '../dashboard/DocumentsSection';

export default function MainDashboard() {
    const { user } = useAuth();
    const { showModal } = useModal();
    const [policies, setPolicies] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // New state to manage loading
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user || !appId || appId === 'default-app-id') {
            setIsLoading(true); // Keep loading if config is not ready
            return;
        }

        console.log(`Setting up listeners for user: ${user.uid} and appId: ${appId}`);
        let isMounted = true; // Flag to check if component is still mounted

        const policiesQuery = query(collection(db, "artifacts", appId, "users", user.uid, "policies"));
        const unsubPolicies = onSnapshot(policiesQuery, (snapshot) => {
            if (isMounted) {
                const policiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPolicies(policiesData);
                setIsLoading(false); // Stop loading once we get the first data snapshot
            }
        }, (error) => {
            console.error("Error listening to policies:", error);
            if (isMounted) setIsLoading(false);
        });

        const documentsQuery = query(collection(db, "artifacts", appId, "users", user.uid, "documents"));
        const unsubDocs = onSnapshot(documentsQuery, (snapshot) => {
            if (isMounted) {
                const documentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDocuments(documentsData);
            }
        }, (error) => {
            console.error("Error listening to documents:", error);
        });

        return () => {
            console.log("Cleaning up listeners.");
            isMounted = false;
            unsubPolicies();
            unsubDocs();
        };
    }, [user, appId]);

    const handleFileUpload = async (event) => {
        if (!user || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const docId = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        const storagePath = `artifacts/${appId}/users/${user.uid}/uploads/${docId}`;
        const storageRef = ref(storage, storagePath);
        const docStatusRef = doc(db, "artifacts", appId, "users", user.uid, "documents", docId);

        try {
            await setDoc(docStatusRef, { status: 'uploading', fileName: file.name, createdAt: serverTimestamp() });
            await uploadBytes(storageRef, file);
            await setDoc(docStatusRef, { status: 'processing' }, { merge: true });
        } catch (error) {
            console.error("Upload failed:", error);
            await setDoc(docStatusRef, { status: 'failed', error: error.message }, { merge: true });
        }
    };

    const handleFabClick = () => {
        const limit = user.isAnonymous ? 1 : 3;
        const count = documents.length;
        if (count >= limit) {
            showModal('upgrade', { isGuest: user.isAnonymous });
        } else {
            fileInputRef.current.click();
        }
    };
    
    const handleAccountClick = () => {
        showModal('account');
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50">
            <header className="flex justify-between items-center p-4 pb-3 sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">
                    Dashboard
                </h2>
                <button onClick={handleAccountClick} className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>
            </header>
            
            <main className="p-4 overflow-y-auto flex-grow">
                {isLoading ? (
                    <div className="text-center text-gray-500 py-16">
                        <p className="text-lg">Loading your dashboard...</p>
                    </div>
                ) : ( 
                    <div className="space-y-8">
                        <BenefitsSection policies={policies} />
                        <CoverageSection policies={policies} />
                        <DocumentsSection documents={documents} />
                    </div>
                )}
            </main>

            <button onClick={handleFabClick} className="absolute bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 z-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
        </div>
    );
}