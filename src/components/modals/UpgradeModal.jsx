import React from 'react';
import { useModal } from '../../contexts/ModalContext';

export default function UpgradeModal({ isGuest }) {
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
}