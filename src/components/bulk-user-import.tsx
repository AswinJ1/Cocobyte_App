"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Download,
  FileSpreadsheet,
  Copy,
  FileDown,
  Mail,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface BulkImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    email: string
    error: string
  }>
  users: Array<{
    email: string
    password: string
    name: string
    uid: string  // Add this
  }>
}

interface BulkUserImportProps {
  onSuccess?: () => void
}

export default function BulkUserImport({ onSuccess }: BulkUserImportProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [credentialsSaved, setCredentialsSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const csvContent = `name,email,college,hostelName,roomNumber,wifiusername,wifiPassword,hostelLocation,contactNumber,gender
John Doe,john@example.com,MIT,Hostel A,101,wifi_john,pass123,https://maps.google.com,1234567890,male
Jane Smith,jane@example.com,Stanford,Hostel B,202,wifi_jane,pass456,https://maps.google.com,0987654321,female
Bob Johnson,bob@example.com,Harvard,Hostel C,303,wifi_bob,pass789,https://maps.google.com,1122334455,male`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadPasswordsCSV = () => {
    if (!result?.users || result.users.length === 0) return

    const csvContent = `Name,Email,UID,Password,Login URL\n${result.users.map(u => 
      `"${u.name}","${u.email}","${u.uid}","${u.password}","${window.location.origin}/login"`
    ).join('\n')}`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user_credentials_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    setCredentialsSaved(true)
  }

  const copyPassword = (password: string, index: number) => {
    navigator.clipboard.writeText(password)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAllCredentials = () => {
    if (!result?.users) return

    const text = result.users.map(u => 
      `Name: ${u.name}\nEmail: ${u.email}\nUID: ${u.uid}\nPassword: ${u.password}\nLogin: ${window.location.origin}/login\n`
    ).join('\n---\n\n')

    navigator.clipboard.writeText(text)
    setCredentialsSaved(true)
  }

  const printCredentials = () => {
    if (!result?.users) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>User Credentials - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .credential-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; margin-left: 10px; }
          .password { 
            font-family: monospace; 
            background: #f5f5f5; 
            padding: 5px 10px; 
            border-radius: 4px;
            font-size: 14px;
          }
          .uid {
            font-family: monospace;
            background: #e3f2fd;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>User Credentials - Generated on ${new Date().toLocaleString()}</h1>
        <div class="warning">
          <strong>⚠️ IMPORTANT:</strong> These credentials are shown only once. Keep this document secure and share individually with users.
        </div>
        ${result.users.map((u, i) => `
          <div class="credential-card">
            <h3>User ${i + 1}</h3>
            <p><span class="label">Name:</span><span class="value">${u.name}</span></p>
            <p><span class="label">Email:</span><span class="value">${u.email}</span></p>
            <p><span class="label">UID:</span><span class="value uid">${u.uid}</span></p>
            <p><span class="label">Password:</span><span class="value password">${u.password}</span></p>
            <p><span class="label">Login URL:</span><span class="value">${window.location.origin}/login</span></p>
          </div>
        `).join('')}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    setCredentialsSaved(true)
  }

  const handleFinish = () => {
    if (!credentialsSaved && result?.users && result.users.length > 0) {
      const confirmed = confirm(
        "⚠️ WARNING: You haven't downloaded or printed the credentials yet!\n\n" +
        "These passwords cannot be recovered once you close this dialog.\n\n" +
        "Are you sure you want to continue without saving?"
      )
      if (!confirmed) return
    }

    setResult(null)
    setCredentialsSaved(false)
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setIsUploading(true)
    setError(null)
    setResult(null)
    setUploadProgress(0)
    setCredentialsSaved(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/users/bulk-import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setUploadProgress(100)
        // REMOVED: Auto-reload functionality
        // User must manually click "Finish" button
      } else {
        setError(data.error || 'Failed to import users')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('An error occurred while uploading the file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Upload CSV</strong> with name, email, college columns</li>
              <li><strong>Random secure passwords</strong> generated automatically</li>
              <li><strong>Download credentials</strong> before closing this dialog</li>
              <li><strong>Share credentials</strong> individually with each user</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Download Template Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={downloadTemplate}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download Sample CSV
        </Button>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="csv-file" className="text-base font-medium">
          Upload CSV File
        </Label>
        <Input
          ref={fileInputRef}
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isUploading || (result !== null)}
          className="cursor-pointer"
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Importing users...</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Successfully Created</div>
                <div className="text-2xl font-bold mt-1">{result.success}</div>
              </AlertDescription>
            </Alert>

            {result.failed > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Failed</div>
                  <div className="text-2xl font-bold mt-1">{result.failed}</div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Generated Passwords */}
          {result.users.length > 0 && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-bold text-amber-900 dark:text-amber-100 text-lg">
                      ⚠️ IMPORTANT: Save These Credentials Now!
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Passwords are generated randomly and <strong>cannot be recovered</strong>. 
                      Download or print these credentials before clicking "Finish".
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={downloadPasswordsCSV}
                      className="gap-2"
                      variant={credentialsSaved ? "outline" : "default"}
                    >
                      <FileDown className="h-4 w-4" />
                      {credentialsSaved ? "Downloaded ✓" : "Download CSV"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={printCredentials}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Print Credentials
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyAllCredentials}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="gap-2 ml-auto"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPasswords ? 'Hide' : 'Show'} Passwords
                    </Button>
                  </div>
                  
                  {/* Credentials Table */}
                  <div className="max-h-96 overflow-y-auto border rounded-md bg-white dark:bg-gray-900">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>UID</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.users.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell className="font-mono text-sm font-bold text-blue-600">
                              {user.uid}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {showPasswords ? user.password : '••••••••••••'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyPassword(user.password, index)}
                                className="h-8 w-8 p-0"
                                title="Copy password"
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Sharing Instructions */}
                  <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      📧 How to share credentials with users:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                      <li>Download the CSV file or print the credentials</li>
                      <li>Send credentials individually via email or secure channel</li>
                      <li>Advise users to change their password after first login</li>
                      <li>Login URL: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">{window.location.origin}/login</code></li>
                    </ol>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Details */}
          {result.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Import Errors:</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.errors.map((err, index) => (
                    <div key={index} className="text-sm border-l-2 border-red-500 pl-2">
                      <div className="font-medium">Row {err.row}: {err.email}</div>
                      <div className="text-red-600 dark:text-red-400">{err.error}</div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Finish Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={handleFinish}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finish & Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}