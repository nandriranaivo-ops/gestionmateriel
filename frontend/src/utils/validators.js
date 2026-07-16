export const validateEmail = (email) => {
  const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  const re = /^[0-9\s\/\+]+$/
  return re.test(phone)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

export const validateRequired = (value) => {
  return value !== undefined && value !== null && value.toString().trim() !== ''
}

export const validateNumber = (value) => {
  const num = parseInt(value)
  return !isNaN(num) && num >= 0
}

export const validatePositiveNumber = (value) => {
  const num = parseInt(value)
  return !isNaN(num) && num > 0
}

export const validateForm = (data, rules) => {
  const errors = {}
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    
    if (rule.required && !validateRequired(value)) {
      errors[field] = rule.requiredMessage || 'Ce champ est requis'
    } else if (rule.email && value && !validateEmail(value)) {
      errors[field] = rule.emailMessage || 'Email invalide'
    } else if (rule.phone && value && !validatePhone(value)) {
      errors[field] = rule.phoneMessage || 'Téléphone invalide'
    } else if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = rule.minLengthMessage || `Minimum ${rule.minLength} caractères`
    } else if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || 'Format invalide'
    }
  }
  
  return errors
}