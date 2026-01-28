import classNames from 'classnames'
import styles from './RedAsterisk.module.css'

export const RedAsterisk = ({ className }: { className?: string }) => <span className={classNames(styles.redAsterisk, className)}>*</span>
