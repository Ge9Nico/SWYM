import React from 'react';

const statusStyles = {
  completed: { bg: 'bg-green-50', text: 'text-green-800', icon: '✔' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-800', icon: '...' },
  uploading: { bg: 'bg-blue-50', text: 'text-blue-800', icon: '↑' },
  failed: { bg: 'bg-red-50', text: 'text-red-800', icon: '✖' },
};

export default function DocumentsSection({ documents }) {
    const validDocuments = documents ?? [];

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Documents</h3>
            <div className="space-y-2">
                {validDocuments.map(doc => {
                    const style = statusStyles[doc.status] || statusStyles.processing;
                    return (
                        <div key={doc.id} className={`p-3 rounded-lg flex items-center gap-3 ${style.bg} ${style.text}`}>
                            <span className="font-mono">{style.icon}</span>
                            <span className="flex-1 truncate">{doc.fileName} ({doc.status})</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}