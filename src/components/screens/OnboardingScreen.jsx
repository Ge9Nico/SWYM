import React from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase';

export default function OnboardingScreen() {
    const handleGetStarted = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            alert("Initialization Failed: " + error.message);
        }
    };

    return (
        <div className="p-8 flex flex-col justify-center items-center h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Welcome to SWYM</h1>
            <p className="text-gray-600 mb-8 text-center">Get a clear overview of your insurance policies and unlock hidden benefits with the power of AI.</p>
            <button onClick={handleGetStarted} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover to-indigo-700 transition">
                Analyze Your First Document
            </button>
        </div>
    );
}