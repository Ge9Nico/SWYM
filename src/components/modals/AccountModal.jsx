import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';

export default function AccountModal() {
    const { user } = useAuth();
    const { showModal, closeModal } = useModal();
    const isLoggedIn = user && !user.isAnonymous;

    const handleLogout = async () => {
        await signOut(auth);
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
}