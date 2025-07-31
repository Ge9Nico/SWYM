import React from 'react';

export default function LoadingScreen() {
    return (
        <div className="p-8 flex flex-col justify-center items-center h-full">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
            <p className="text-gray-500 mt-8">Initializing SWYM...</p>
        </div>
    );
}