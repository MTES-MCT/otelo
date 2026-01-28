import classNames from 'classnames'
import styles from './profile-image.module.css'

const computeInitials = (firstName: string | null, lastName: string | null) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }
  if (firstName) {
    return firstName.charAt(0)
  }
  if (lastName) {
    return lastName.charAt(0)
  }
  return ''
}

const fontSizeByPictureSize: Record<number, number> = {
  24: 10,
  32: 12,
  48: 18,
  96: 36,
  116: 42,
  128: 48,
}

const ProfileInitials = ({
  firstName,
  lastName,
  size,
  className,
}: {
  firstName: string | null
  lastName: string | null
  size: number
  className?: string
}) => (
  <div className={classNames(styles.container, className)}>
    <span
      className="fr-flex fr-align-items-center fr-justify-content-center fr-text-label--blue-ecume fr-width-full fr-height-full fr-text--medium"
      style={{ fontSize: fontSizeByPictureSize[size], backgroundColor: 'var(--blue-ecume-850-200)' }}
    >
      {computeInitials(firstName, lastName)}
    </span>
  </div>
)

export default ProfileInitials
