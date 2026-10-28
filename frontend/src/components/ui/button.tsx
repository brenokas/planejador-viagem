import type { ButtonHTMLAttributes } from 'react'
import { buttonClass, type ButtonVariant } from './button-class'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />
}
