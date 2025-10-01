'use client'

import { useState } from 'react'
import { signInWithGitHub } from '@/lib/auth/actions'

export default function TestAuthPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    setStatus('Testing GitHub OAuth...')
    
    try {
      const result = await signInWithGitHub()
      
      setStatus(JSON.stringify(result, null, 2))
      
      if (result.url) {
        setStatus('Got OAuth URL! Redirecting in 2 seconds...')
        setTimeout(() => {
          window.location.href = result.url!
        }, 2000)
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message || JSON.stringify(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4">GitHub OAuth Test</h1>
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 mb-4"
        >
          {loading ? 'Testing...' : 'Test GitHub OAuth'}
        </button>

        {status && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">Status:</h2>
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <p className="text-sm">Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p className="text-sm">Site URL: {process.env.NEXT_PUBLIC_SITE_URL}</p>
          <p className="text-sm">Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
        </div>
      </div>
    </div>
  )
}
