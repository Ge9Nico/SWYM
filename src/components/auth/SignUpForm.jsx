import React, { useState } from 'react';
import { EmailAuthProvider, linkWithCredential, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { closeModal } = useModal();
    const { user } = useAuth();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        
        // Basic client-side validation
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        
        setLoading(true);

        try {
            // Check if the current user is a guest (anonymous)
            if (user && user.isAnonymous) {
                // If so, link the new credentials to the existing guest account
                const credential = EmailAuthProvider.credential(email, password);
                await linkWithCredential(user, credential);
            } else {
                // Otherwise, create a brand new user account
                await createUserWithEmailAndPassword(auth, email, password);
            }
            closeModal();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        setError('');
        try {
            if (user && user.isAnonymous) {
                // Link Google account to the existing guest session
                await signInWithPopup(user, googleProvider);
            } else {
                // Sign in with Google as a new user
                await signInWithPopup(auth, googleProvider);
            }
            closeModal();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSignUp} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="button" onClick={handleGoogleSignUp} disabled={loading} className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                {loading ? (
                    <div className="loader h-5 w-5 border-2 border-t-2 rounded-full mr-2"></div>
                ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#34A853" d="m43.611 20.083l-5.657 5.657C39.946 24.654 41 22.88 41 21H24v-1h19.611z"></path><path fill="#FBBC05" d="M12.303 28.657l5.657-5.657C16.306 21.346 15 19.12 15 17H8.955C7.053 20.046 6 23.268 6 27s1.053 6.954 2.955 9.999l6.045-4.657z"></path><path fill="#EA4335" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-2.715 0-5.211-.909-7.211-2.409L10.591 30.81C14.14 34.023 18.834 36 24 36z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                )}
                Continue with Google
            </button>
            <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-gray-400 text-sm">or</span><div className="flex-grow border-t border-gray-300"></div></div>
            <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="signup-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="signup-password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50">
                {loading ? <div className="loader h-5 w-5 border-2 border-t-2 rounded-full"></div> : 'Create Account'}
            </button>
        </form>
    );
}