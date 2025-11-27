"use client";

import { useState } from "react";
import { testSessionAction } from "@/lib/actions/auth";

export function TestSession() {
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleTest() {
        setLoading(true);
        try {
            const response = await testSessionAction();
            setResult(JSON.stringify(response, null, 2));
        } catch (error) {
            setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-4 border border-gray-300 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Test Server Action Session</h3>
            <button
                onClick={handleTest}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? "Testing..." : "Test Session"}
            </button>
            {result && (
                <pre className="mt-4 p-4 bg-gray-100 rounded-md text-sm overflow-auto">
                    {result}
                </pre>
            )}
        </div>
    );
}

