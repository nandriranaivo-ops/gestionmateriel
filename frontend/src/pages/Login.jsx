import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useEtablissementStore from '../store/etablissementStore'

const Login = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const { etablissements, loadEtablissementsPublic } = useEtablissementStore()

  const [role, setRole] = useState('responsable_etab')  // ✅ Changé
  const [etablissementId, setEtablissementId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    loadEtablissementsPublic()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!role) {
      toast.error('Veuillez sélectionner votre rôle')
      return
    }

    // ✅ Corrigé: comparer avec 'responsable_etab'
    if (role === 'responsable_etab' && !etablissementId) {
      toast.error('Veuillez sélectionner votre établissement')
      return
    }

    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    try {
      const userData = await login(email, password, role, etablissementId)
      console.log('Connexion réussie:', userData)
      toast.success('Connexion réussie')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const demoAccounts = [
    {
      role: 'admin_educmad',
      email: 'admin@educmad.mg',
      password: 'admin123',
      label: 'Admin EDUCMAD'
    },
    {
      role: 'responsable_etab',
      email: 'responsable@lycee-a.mg',
      password: 'resp123',
      etablissement: 1,
      label: 'RI - Lycée Ambanitsena'
    }
  ]

  const fillDemoAccount = (account) => {
    setRole(account.role)
    if (account.etablissement) setEtablissementId(account.etablissement.toString())
    setEmail(account.email)
    setPassword(account.password)
  }
  console.log('Établissements dans Login:', etablissements)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-red-800 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-green p-8 text-white flex flex-col justify-center items-center">
          <div className="text-center">
            <img src='src/assets/educmad.png' alt="Logo" style={{ width: '400px', height: 'auto' }} />
          </div>
        </div>

        <div className="md:w-1/2 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion</h2>
          <p className="text-gray-500 mb-6">Accédez à votre espace de travail</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">👤 Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="responsable_etab">Responsable Établissement</option>
                <option value="admin_educmad">Admin EDUCMAD</option>
              </select>
            </div>

            {/* ✅ Corrigé: vérifier 'responsable_etab' */}
            {role === 'responsable_etab' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🏫 Établissement</label>
                <select
                  value={etablissementId}
                  onChange={(e) => setEtablissementId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Sélectionnez votre établissement</option>
                  {etablissements && etablissements.map(etab => (
                    <option key={etab.id_etab} value={etab.id_etab.toString()}>
                      {etab.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📧 Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@educmad.mg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🔒 Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Connexion...' : 'SE CONNECTER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login