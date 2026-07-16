import useAuthStore from '../store/authStore'

const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, logout, updateUser } = useAuthStore()
  
  const isAdmin = user?.role === 'admin_educmad'
  const isResponsable = user?.role === 'responsable_etab'
  
  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin,
    isResponsable,
    login,
    logout,
    updateUser
  }
}

export default useAuth