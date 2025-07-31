import React from 'react';

export default function BenefitsSection({ policies }) {
    const allPerks = policies.flatMap(p => p.perks || []);
    const uniquePerks = Array.from(new Map(allPerks.map(item => [item.name, item])).values());

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Benefits</h3>
            {uniquePerks.length === 0 ? (
                <p className="text-sm text-gray-500">No benefits identified yet.</p>
            ) : (
                <div className="space-y-3">
                    {uniquePerks.map((perk, index) => (
                        <div key={index} className="bg-purple-50 p-3 rounded-lg shadow-sm border border-purple-200 break-words">
                            <p className="font-medium text-purple-800">{perk.name}</p>
                            <p className="text-xs text-gray-600">{perk.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}