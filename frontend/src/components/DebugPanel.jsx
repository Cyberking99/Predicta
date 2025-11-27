"use client"

import { useState } from "react"

const DebugPanel = ({ debugInfo, onRunDebug, isVisible = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible) return null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-4 mb-4 overflow-auto max-h-96">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-semibold">Debug Information</h3>
        <div className="flex gap-2">
          {onRunDebug && (
            <button onClick={onRunDebug} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Run Debug
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {debugInfo ? (
        <div className="space-y-3">
          {/* Summary */}
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-white font-medium mb-2">Summary</h4>
            <div className="space-y-1 text-sm">
              <div className={`${debugInfo.summary?.canStake ? "text-green-400" : "text-red-400"}`}>
                Can Stake: {debugInfo.summary?.canStake ? "✅ Yes" : "❌ No"}
              </div>
              <div className="text-gray-300">Critical Issues: {debugInfo.summary?.criticalIssues || 0}</div>
              <div className="text-gray-300">Warnings: {debugInfo.summary?.warnings || 0}</div>
              {debugInfo.summary?.mainBlocker && (
                <div className="text-red-400">Main Issue: {debugInfo.summary.mainBlocker}</div>
              )}
            </div>
          </div>

          {/* Errors */}
          {debugInfo.errors && debugInfo.errors.length > 0 && (
            <div className="bg-red-900 bg-opacity-20 p-3 rounded">
              <h4 className="text-red-400 font-medium mb-2">Errors</h4>
              <ul className="space-y-1 text-sm text-red-300">
                {debugInfo.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {debugInfo.warnings && debugInfo.warnings.length > 0 && (
            <div className="bg-yellow-900 bg-opacity-20 p-3 rounded">
              <h4 className="text-yellow-400 font-medium mb-2">Warnings</h4>
              <ul className="space-y-1 text-sm text-yellow-300">
                {debugInfo.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
            <div className="bg-blue-900 bg-opacity-20 p-3 rounded">
              <h4 className="text-blue-400 font-medium mb-2">Recommendations</h4>
              <ul className="space-y-1 text-sm text-blue-300">
                {debugInfo.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Checks (only when expanded) */}
          {isExpanded && debugInfo.checks && (
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-white font-medium mb-2">Detailed Checks</h4>
              <pre className="text-xs text-gray-300 overflow-auto max-h-60">
                {JSON.stringify(debugInfo.checks, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-center py-4">
          No debug information available. Click "Run Debug" to analyze your stake.
        </div>
      )}
    </div>
  )
}

export default DebugPanel
