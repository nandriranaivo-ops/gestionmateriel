// frontend/src/components/common/Avatar.jsx
import React, { useRef } from 'react'
import { Camera } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUserStore from '../../store/userStore'

const Avatar = ({ size = 'w-16 h-16', editable = false }) => {
  const { user } = useAuthStore()
  const { updatePhotoProfil } = useUserStore()
  const fileInputRef = useRef(null)

  // URL de la photo (ou fallback)
  const photoUrl = user?.photo_profil 
    ? `${import.meta.env.VITE_API_URL}/uploads/${user.photo_profil}`
    : '/default-avatar.png'

  const handleClick = () => {
    if (editable) fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validation (type, taille)
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 Mo')
      return
    }

    const formData = new FormData()
    formData.append('photo', file)

    try {
      await updatePhotoProfil(formData)
      // Le store doit mettre à jour l'utilisateur
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div
      className={`relative ${size} rounded-full overflow-hidden bg-gray-200 cursor-pointer group flex-shrink-0`}
      onClick={handleClick}
    >
      <img
        src={photoUrl}
        alt={user?.nom || 'Avatar'}
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = '/default-avatar.png' }}
      />
      {editable && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default Avatar