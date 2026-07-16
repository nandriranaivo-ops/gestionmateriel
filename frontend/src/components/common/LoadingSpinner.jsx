import React from 'react'

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  // Tailles disponibles
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  // Le spinner avec votre logo (dans public)
  const spinner = (
    <div className="flex justify-center items-center">
      <img
        src="/logo.png"   // chemin direct dans public
        alt="Chargement..."
        className={`${sizeClasses[size]} animate-spin object-contain`}
        style={{animationDuration: '2s'}}
      />
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner