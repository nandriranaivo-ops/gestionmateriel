import React, { useState, useEffect, useRef } from 'react'
import useAuthStore from '../store/authStore'
import useEtablissementStore from '../store/etablissementStore'
import toast from 'react-hot-toast'
import { User, Mail, Building2, Shield, Save, Edit2, Lock, Camera } from 'lucide-react'

const Profile = () => {
  const { user, updateProfile, updatePassword, updatePhotoProfil, isLoading } = useAuthStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()

  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    email: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      await loadEtablissements()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        email: user.email || ''
      })
    }
  }, [user])

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin_educmad': return 'Admin EDUCMAD'
      case 'responsable_etab': return "Responsable d'établissement"
      default: return role
    }
  }

  const getRoleIcon = () => {
    if (user?.role === 'admin_educmad') return <Shield size={20} className="text-purple-500" />
    return <Building2 size={20} className="text-blue-500" />
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('photo', file)

    try {
      await updatePhotoProfil(formData)
      // Le store est mis à jour automatiquement, le composant se re-render
      toast.success('Photo de profil mise à jour avec succès')
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour de la photo')
    } finally {
      setUploading(false)
      e.target.value = '' // Réinitialiser l'input
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      await updateProfile(formData)
      toast.success('Profil mis à jour avec succès')
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      toast.success('Mot de passe modifié avec succès')
      setIsChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ✅ Construction de l'URL de la photo de profil (mise à jour dynamique)
  // Dans Profile.jsx, remplacer la construction de photoUrl par :
  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000'
  const photoUrl = user?.photo_profil && user.photo_profil !== 'default-avatar.png'
    ? `${baseUrl}/uploads/${user.photo_profil}`
    : '/default-avatar.png'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  const etablissementUser = user?.id_etab
    ? etablissements.find(e => e.id_etab === user.id_etab)
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mon profil</h1>
        <p className="text-gray-500">Gérer vos informations personnelles</p>
      </div>

      {/* Carte d'identité avec Avatar cliquable */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-8 text-white">
          <div className="flex items-center gap-4">
            {/* Avatar cliquable */}
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden bg-white cursor-pointer group flex-shrink-0"
              onClick={handleAvatarClick}
            >
              <img
                src={photoUrl}
                alt={user?.nom || 'Avatar'}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/default-avatar.png' }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.nom}</h2>
              <p className="text-primary-100">{getRoleLabel(user?.role)}</p>
              <p className="text-primary-200 text-sm">Cliquez sur la photo pour la modifier</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User size={20} />
              Informations personnelles
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm"
              >
                <Edit2 size={16} />
                Modifier
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={18} />
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      nom: user?.nom || '',
                      email: user?.email || ''
                    })
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Nom complet</p>
                  <p className="font-medium">{user?.nom}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getRoleIcon()}
                <div>
                  <p className="text-xs text-gray-500">Rôle</p>
                  <p className="font-medium">{getRoleLabel(user?.role)}</p>
                </div>
              </div>
              {etablissementUser && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Établissement</p>
                    <p className="font-medium">{etablissementUser.nom}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Changement de mot de passe */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Lock size={20} />
            Sécurité
          </h3>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm"
            >
              <Edit2 size={16} />
              Changer le mot de passe
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Changement...' : 'Changer le mot de passe'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Lock size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Dernière modification : {user?.password_last_changed ? new Date(user.password_last_changed).toLocaleDateString() : 'Jamais'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile