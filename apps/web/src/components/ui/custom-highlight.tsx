import cn from 'classnames'
import { ReactNode } from 'react'
import styles from './custom-highlight.module.scss'

interface Props {
  boldText?: boolean
  children: ReactNode
  classes?: string[]
  iconId?: string
  originalLeftBorder?: boolean
  size?: 'lg' | 'md' | 'sm'
}

const CustomHighlight: React.FC<Props> = ({
  boldText = false,
  children,
  classes,
  iconId = 'ri-information-line',
  originalLeftBorder = true,
  size = 'md',
}) => {
  return (
    <div
      className={cn('fr-highlight', styles['highlight--override'], ...(classes || []), {
        [styles['highlight--left-border']]: !originalLeftBorder,
      })}
    >
      <span className={cn(iconId, styles['highlight__icon'])} aria-hidden />
      <div
        className={cn({
          'fr-text--bold': boldText,
          'fr-text--lg': size === 'lg',
          'fr-text--md': size === 'md',
          'fr-text--sm': size === 'sm',
        })}
      >
        {children}
      </div>
    </div>
  )
}

export default CustomHighlight
