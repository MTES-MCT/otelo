export function anonymizeEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain) {
    return email
  }

  // If local part is too short, just show first and last character
  if (localPart.length <= 4) {
    if (localPart.length <= 2) {
      return `${localPart}@${domain}`
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`
  }

  const firstThree = localPart.substring(0, 2)
  const lastThree = localPart.substring(localPart.length - 2)
  const asterisks = '*'.repeat(localPart.length - 4)

  return `${firstThree}${asterisks}${lastThree}@${domain}`
}
