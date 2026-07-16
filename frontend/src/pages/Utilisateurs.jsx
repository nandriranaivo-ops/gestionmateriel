import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'
import useEtablissementStore from '../store/etablissementStore'
import { Plus, Edit, Trash2, Search, Shield, User, Building2 } from 'lucide-react'

const Utilisateurs = () => {
  const { user } = useAuthStore()
  const { utilisateurs, loadUtilisateurs, addUtilisateur, updateUtilisateur, deleteUtilisateur, isLoading } = useUserStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    role: 'responsable_etab',
    id_etab: '',
    password: '',
    confirmPassword: ''
  })

  const isAdmin = user?.role === 'admin_educmad'

  // ✅ Base URL pour les photos (sans /api)
  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000'

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadUtilisateurs()
      await loadEtablissements()
      setLoading(false)
    }
    init()
  }, [])

  const utilisateursList = Array.isArray(utilisateurs) ? utilisateurs : []
  const etablissementsList = Array.isArray(etablissements) ? etablissements : []

  // ✅ Récupérer les établissements qui n'ont pas encore de RI (ou celui de l'utilisateur en cours d'édition)
  const getEtablissementsDisponibles = () => {
    const riEtabIds = utilisateursList
      .filter(u => u.role === 'responsable_etab' && u.id_etab)
      .map(u => u.id_etab)

    return etablissementsList.filter(etab => {
      if (editingUser && editingUser.id_etab === etab.id_etab) {
        return true
      }
      return !riEtabIds.includes(etab.id_etab)
    })
  }

  // ✅ Automatisation du nom et email lors du choix de l'établissement
  useEffect(() => {
    if (!editingUser && formData.role === 'responsable_etab' && formData.id_etab) {
      const selectedEtab = etablissementsList.find(e => e.id_etab === parseInt(formData.id_etab))
      if (selectedEtab) {
        setFormData(prev => ({
          ...prev,
          nom: selectedEtab.nom_responsable_info || '',
          email: selectedEtab.email_responsable_info || ''
        }))
      }
    }
  }, [formData.id_etab, formData.role, editingUser, etablissementsList])

  const filteredUsers = utilisateursList.filter(u => {
    const matchSearch = u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = !filterRole || u.role === filterRole
    return matchSearch && matchRole
  })

  const handleOpenModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit)
      setFormData({
        nom: userToEdit.nom || '',
        email: userToEdit.email || '',
        role: userToEdit.role || 'responsable_etab',
        id_etab: userToEdit.id_etab || '',
        password: '',
        confirmPassword: ''
      })
    } else {
      setEditingUser(null)
      setFormData({
        nom: '',
        email: '',
        role: 'responsable_etab',
        id_etab: '',
        password: '',
        confirmPassword: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nom || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!editingUser && !formData.password) {
      alert('Veuillez saisir un mot de passe')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.role === 'responsable_etab' && !formData.id_etab) {
      alert('Veuillez sélectionner un établissement')
      return
    }

    if (formData.role === 'responsable_etab' && formData.id_etab) {
      const existingRI = utilisateursList.find(
        u => u.role === 'responsable_etab' &&
          u.id_etab === parseInt(formData.id_etab) &&
          (!editingUser || u.id_user !== editingUser.id_user)
      )
      if (existingRI) {
        alert('Cet établissement a déjà un responsable informatique')
        return
      }
    }

    try {
      if (editingUser) {
        const updateData = {
          nom: formData.nom,
          email: formData.email,
          role: formData.role,
          id_etab: formData.role === 'responsable_etab' ? parseInt(formData.id_etab) : null
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        await updateUtilisateur(editingUser.id_user, updateData)
        alert('Utilisateur modifié avec succès')
      } else {
        await addUtilisateur({
          nom: formData.nom,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          id_etab: formData.role === 'responsable_etab' ? parseInt(formData.id_etab) : null
        })
        alert('Utilisateur ajouté avec succès')
      }
      setShowModal(false)
      setEditingUser(null)
      setFormData({
        nom: '',
        email: '',
        role: 'responsable_etab',
        id_etab: '',
        password: '',
        confirmPassword: ''
      })
    } catch (error) {
      alert(error.message || 'Erreur lors de l\'opération')
    }
  }

  const handleDelete = async (id, nom) => {
    if (window.confirm(`Supprimer l'utilisateur "${nom}" ?`)) {
      try {
        await deleteUtilisateur(id)
        alert('Utilisateur supprimé avec succès')
      } catch (error) {
        alert(error.message || 'Erreur lors de la suppression')
      }
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin_educmad': return 'Admin EDUCMAD'
      case 'responsable_etab': return 'Responsable établissement'
      default: return role
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin_educmad': return <Shield size={16} className="text-purple-500" />
      case 'responsable_etab': return <Building2 size={16} className="text-blue-500" />
      default: return <User size={16} className="text-gray-500" />
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin_educmad': return 'bg-purple-100 text-purple-700'
      case 'responsable_etab': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // ✅ Fonction pour afficher l'avatar avec photo ou initiales
  // frontend/src/pages/Utilisateurs.jsx

  // ✅ Fonction renderAvatar modifiée avec indicateur de statut
  const renderAvatar = (user) => {
    const photoUrl = user.photo_profil && user.photo_profil !== 'default-avatar.png'
      ? `${baseUrl}/uploads/${user.photo_profil}`
      : null

    return (
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={user.nom || 'Utilisateur'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.textContent = user.nom?.charAt(0)?.toUpperCase() || 'U'
              }}
            />
          ) : (
            <span className="text-gray-600 font-medium text-sm">
              {user.nom?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        {/* ✅ Indicateur de statut en ligne */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${user.est_en_ligne ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Accès non autorisé</h2>
        <p className="text-red-600">Seul l'admin EDUCMAD peut gérer les utilisateurs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
          <p className="text-gray-500">Gestion des utilisateurs de la plateforme</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les rôles</option>
            <option value="admin_educmad">Admin EDUCMAD</option>
            <option value="responsable_etab">Responsable établissement</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Établissement</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id_user} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {renderAvatar(u)}
                        <span className="text-sm font-medium text-gray-900">{u.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                        {getRoleIcon(u.role)} {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.id_etab ? etablissementsList.find(e => e.id_etab === u.id_etab)?.nom || '-' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleOpenModal(u)}
                        className="text-blue-500 hover:text-blue-700 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id_user, u.nom)}
                        className="text-red-500 hover:text-red-700"
                        disabled={u.id_user === user?.id_user}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, id_etab: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="responsable_etab">Responsable établissement</option>
                  <option value="admin_educmad">Admin EDUCMAD</option>
                </select>
              </div>
              {formData.role === 'responsable_etab' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Établissement *</label>
                  <select
                    value={formData.id_etab}
                    onChange={(e) => setFormData({ ...formData, id_etab: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Sélectionner un établissement</option>
                    {getEtablissementsDisponibles().map(etab => (
                      <option key={etab.id_etab} value={etab.id_etab}>{etab.nom}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingUser
                      ? 'Vous pouvez conserver l\'établissement actuel ou en choisir un autre (sans RI).'
                      : 'Seuls les établissements sans responsable informatique sont affichés.'}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required={!editingUser}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Ajouter')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Utilisateurs