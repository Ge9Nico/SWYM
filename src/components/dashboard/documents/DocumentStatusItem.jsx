import React from 'react';

export default function DocumentStatusItem({ doc }) {
    let statusIcon;
    if (doc.status === 'processing' || doc.status === 'uploading') {
        statusIcon = <div className="loader h-5 w-5 border-2 border-t-2 rounded-full"></div>;
    } else if (doc.status === 'completed') {
        statusIcon = <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
    } else if (doc.status === 'failed') {
        statusIcon = <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
    }

    return (
        <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-3">
                {statusIcon}
                <span>{doc.fileName} ({doc.status})</span>
            </div>
        </div>
    );
}