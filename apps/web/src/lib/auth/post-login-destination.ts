type PostLoginUser =
  | {
      hasAccess?: boolean | null
      role?: string | null
      type?: string | null
    }
  | undefined

export const postLoginDestination = (user: PostLoginUser): string => {
  if (user && !user.hasAccess && user.role !== 'ADMIN') {
    return '/unauthorized'
  }

  // Sans type d'utilisateur renseigné, le tableau de bord ouvre la modale de choix.
  return user?.type ? '/tableaux-de-bord' : '/tableaux-de-bord?selectType'
}
