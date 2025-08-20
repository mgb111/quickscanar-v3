'use client'

import { useState } from 'react'
import { Upload, CheckCircle, X, AlertCircle } from 'lucide-react'

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setUploadStatus('')
      setUploadedUrl('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')
    setUploadStatus('')
    setUploadedUrl('')

    try {
      // Step 1: Get presigned URL
      setUploadStatus('Getting upload permission...')
      
      const presignedResponse = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type.startsWith('video/') ? 'video' : 'mind',
          contentType: file.type
        })
      })

      if (!presignedResponse.ok) {
        const err = await presignedResponse.json().catch(() => null)
        throw new Error(err?.error || 'Failed to get upload permission')
      }

      const presignedData = await presignedResponse.json()
      
      console.log('Presigned URL data:', presignedData)
      
      // Step 2: Upload directly to R2
      setUploadStatus('Uploading file directly to R2...')
      
      const uploadResponse = await fetch(presignedData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        console.error('Upload response:', uploadResponse.status, uploadResponse.statusText)
        throw new Error(`Failed to upload file directly to R2: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      setUploadStatus('Upload successful!')
      setUploadedUrl(presignedData.publicUrl)
      
      console.log('Upload successful! File available at:', presignedData.publicUrl)
      
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setError('')
    setUploadStatus('')
    setUploadedUrl('')
  }

  const checkR2Config = async () => {
    try {
      const response = await fetch('/api/upload/debug')
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
        console.log('R2 Configuration:', data)
      } else {
        throw new Error('Failed to get debug info')
      }
    } catch (err) {
      console.error('Debug check failed:', err)
      setError('Failed to check R2 configuration')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Test Direct Upload to R2
          </h1>
          
          {/* Debug Button */}
          <div className="text-center mb-6">
            <button
              onClick={checkR2Config}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Check R2 Configuration
            </button>
          </div>
          
          <div className="space-y-6">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (Video or .mind)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {file ? (
                  <div className="space-y-3">
                    <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
                    <p className="text-sm text-gray-900 font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={resetUpload}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <X className="h-4 w-4 inline mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                        Click to select file
                      </label>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports video files and .mind files
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      accept="video/*,.mind"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload File
                  </>
                )}
              </button>
            )}

            {/* Status Messages */}
            {uploadStatus && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-700">{uploadStatus}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {uploadedUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-700">Upload successful!</span>
                </div>
                <p className="text-sm text-green-600 mt-2 break-all">
                  File URL: {uploadedUrl}
                </p>
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">R2 Configuration:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>Environment:</strong></div>
                  <div>Account ID: {debugInfo.environment.CLOUDFLARE_ACCOUNT_ID}</div>
                  <div>Access Key: {debugInfo.environment.CLOUDFLARE_ACCESS_KEY_ID}</div>
                  <div>Secret Key: {debugInfo.environment.CLOUDFLARE_SECRET_ACCESS_KEY}</div>
                  <div>Bucket Name: {debugInfo.environment.CLOUDFLARE_R2_BUCKET_NAME}</div>
                  <div className="mt-2"><strong>Expected URLs:</strong></div>
                  <div>R2 Endpoint: {debugInfo.expectedUrls.r2Endpoint}</div>
                  <div>Public URL: {debugInfo.expectedUrls.publicUrl}</div>
                  <div>Bucket URL: {debugInfo.expectedUrls.bucketUrl}</div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">How this works:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Select a file (video or .mind)</li>
                <li>Click upload to get a presigned URL from Vercel</li>
                <li>File uploads directly to Cloudflare R2 (bypassing Vercel)</li>
                <li>No more 413 "Content Too Large" errors!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
