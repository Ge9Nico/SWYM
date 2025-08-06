import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useUserData } from '../../contexts/UserDataContext';
import { doc, setDoc } from 'firebase/firestore';

export default function AccountSection() {
    const { user } = useAuth();
    const { userData, loading: userDataLoading } = useUserData();
    const { closeModal } = useModal();

    const [firstName, setFirstName] = useState('');
    const [country, setCountry] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (userData) {
            setFirstName(userData.firstName || '');
            setCountry(userData.country || '');
        }
        // If the user profile is new and has no data, automatically open the edit mode.
        if (userData && !userData.firstName) {
            setIsEditing(true);
        }
    }, [userData]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        setMessage('');

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { 
                firstName: firstName, 
                country: country 
            }, { merge: true });
            
            setMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            setMessage('Error: Could not update profile.');
            console.error("Error updating profile: ", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        closeModal();
    };

    if (userDataLoading) {
        return <div className="text-center p-4">Loading account details...</div>;
    }

    return (
        <div className="text-left">
            <h3 className="text-xl font-bold text-gray-800 mb-4">My Account</h3>
            
            {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                        <input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country of Residence</label>
                        <select id="country" value={country} onChange={e => setCountry(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="">Select Country</option>
                            <option value="Norway">Norway</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="France">France</option>
                        </select>
                    </div>
                    {message && <p className="text-sm text-green-600">{message}</p>}
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="w-full text-gray-600 py-2 px-4 rounded-lg font-semibold border hover:bg-gray-100 transition">Cancel</button>
                        <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        <span className="font-semibold">Name:</span> {userData?.firstName || 'Not set'}
                    </p>
                    <p className="text-gray-600">
                        <span className="font-semibold">Country:</span> {userData?.country || 'Not set'}
                    </p>
                    <p className="text-gray-600">
                        <span className="font-semibold">Email:</span> {user?.email}
                    </p>
                    <button onClick={() => setIsEditing(true)} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition">
                        Edit Profile
                    </button>
                </div>
            )}

            <div className="border-t my-6"></div>

            <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition mb-2">Log Out</button>
        </div>
    );
}