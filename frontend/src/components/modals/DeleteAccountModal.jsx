import React, { useState } from 'react'
import { X, Trash2, Loader2 } from 'lucide-react'

const DeleteAccountModal = ({ isOpen, onClose, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/settings/delete-account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message || "Account deleted successfully.")
        onDeleted()
      } else {
        alert(data.message || "Failed to delete account.")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Server error while deleting account.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-semibold mb-4 text-red-600 flex items-center gap-2">
          <Trash2 /> Delete Account
        </h3>

        <p className="mb-6 text-gray-700">This action is irreversible. All your data will be permanently removed.</p>

        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2 border rounded-md border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal
