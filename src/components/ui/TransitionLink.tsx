import React from 'react'
import { useTransition } from '../transitions/TransitionContext'

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  children: React.ReactNode
}

export function TransitionLink({ to, children, onClick, ...props }: TransitionLinkProps) {
  const { navigateWithTransition } = useTransition()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onClick?.(e)
    navigateWithTransition(to)
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
