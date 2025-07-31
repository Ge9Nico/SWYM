import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import AccountModal from './AccountModal';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

const ModalWrapper = ({ children }) => (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

export default function ModalManager({ modal }) {
    if (!modal) return null;

    switch (modal.type) {
        case 'account': return <ModalWrapper><AccountModal /></ModalWrapper>;
        case 'auth': return <ModalWrapper><AuthModal /></ModalWrapper>;
        case 'upgrade': return <ModalWrapper><UpgradeModal {...modal.props} /></ModalWrapper>;
        default: return null;
    }
}