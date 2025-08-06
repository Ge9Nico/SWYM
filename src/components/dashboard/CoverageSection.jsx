import React from 'react';

export default function CoverageSection({ policies }) {
    const validPolicies = policies ?? [];

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Coverage</h3>
            {validPolicies.length === 0 ? (
                <p className="text-sm text-gray-500">No coverage details available yet.</p>
            ) : (
                <div className="space-y-4">
                    {validPolicies.map(policy => (
                        <div key={policy.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-md break-words">
                            <h3 className="text-lg font-semibold text-gray-800">{policy.provider}</h3>
                            
                            {(policy?.insuranceTypes ?? []).map((it, index) => (
                                <div key={index} className="mt-3">
                                    <h4 className="text-md font-semibold text-gray-700">{it.type}</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mt-1 pl-2">
                                        {(it?.coverages ?? []).map((cov, i) => <li key={i}>{cov}</li>)}
                                    </ul>
                                </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-3 pt-3 border-t">Policy Period: {policy.dates}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}