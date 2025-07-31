import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import SignUpForm from '../auth/SignUpForm';
import LoginForm from '../auth/LoginForm';

export default function AuthModal() {
    const [isLogin, setIsLogin] = useState(false);
    const { closeModal } = useModal();
    
    return (
        <div>
            <div className="flex border-b mb-4 justify-around">
                <div className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Create Account</div>
                <div className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Log In</div>
            </div>
            {isLogin ? <LoginForm /> : <SignUpForm />}
            <button onClick={closeModal} className="w-full text-gray-500 py-2 text-center mt-2">Cancel</button>
        </div>
    );
}