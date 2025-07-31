import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { db, appId, storage } from '../../firebase';
import { collection, onSnapshot, query, doc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import BenefitsSection from '../dashboard/BenefitsSection';
import CoverageSection from '../dashboard/CoverageSection';
import DocumentsSection from '../dashboard/DocumentsSection';

export default function MainDashboard() {
    const { user } = useAuth();
    const { showModal } = useModal();
    const [policies, setPolicies] = useState([]);
    const [documents, setDocuments] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user) return;

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
        if (!user || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const fileName = `${Date.now()}-${file.name}`;
        
        const storagePath = `artifacts/${appId}/users/${user.uid}/uploads/${fileName}`;
        const storageRef = ref(storage, storagePath);
        const docStatusRef = doc(db, "artifacts", appId, "users", user.uid, "documents", fileName);

        try {
            await setDoc(docStatusRef, { status: 'uploading', fileName: file.name, createdAt: serverTimestamp() });
            await uploadBytes(storageRef, file);
            await setDoc(docStatusRef, { status: 'processing' }, { merge: true });

            setTimeout(async () => {
                try {
                    const policyData = { provider: "Simulated Insurance", dates: "2025-2026", insuranceTypes: [{type: "General", coverages: ["Simulated Coverage"]}], perks: [{name: "Simulated Perk", description: "A cool benefit"}]};
                    const policiesRef = collection(db, "artifacts", appId, "users", user.uid, "policies");
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
}