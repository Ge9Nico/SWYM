import React, { useState, createContext, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null);

    const showModal = (modalType, modalProps = {}) => setModal({ type: modalType, props: modalProps });
    const closeModal = () => setModal(null);

    const value = { modal, showModal, closeModal };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};
