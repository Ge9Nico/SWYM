import React from 'react';
import DocumentStatusItem from './documents/DocumentStatusItem';

export default function DocumentsSection({ documents }) {
    if (documents.length === 0) return null;
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Documents</h3>
            <div className="space-y-2">
                {documents.map(doc => <DocumentStatusItem key={doc.id} doc={doc} />)}
            </div>
        </div>
    );
}