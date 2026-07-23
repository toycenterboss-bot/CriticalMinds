// Базовые UI-компоненты из прототипа: Btn, Tag, Card.
import React from 'react'
import { C, fonts } from '../tokens.js'

export const Btn = ({ children, onClick, variant = 'primary', disabled, small, type }) => (
  <button
    type={type || 'button'}
    onClick={onClick}
    disabled={disabled}
    className={variant === 'ghost' ? 'btn-ghost' : 'btn-primary'}
    style={{
      fontFamily: fonts.sans, fontWeight: 600,
      fontSize: small ? 13 : 15,
      padding: small ? '8px 14px' : '12px 20px',
      borderRadius: 10,
      border: variant === 'ghost' ? `1.5px solid ${C.ink}` : 'none',
      background: disabled ? C.grid : variant === 'ghost' ? 'transparent' : C.teal,
      color: variant === 'ghost' ? C.ink : disabled ? C.inkSoft : C.white,
      cursor: disabled ? 'default' : 'pointer',
    }}
  >
    {children}
  </button>
)

export const Tag = ({ children, color = C.tealSoft, text = C.teal }) => (
  <span
    style={{
      fontFamily: fonts.mono, fontSize: 11, fontWeight: 600,
      letterSpacing: '.04em', background: color, color: text,
      padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase',
    }}
  >
    {children}
  </span>
)

export const Card = ({ children, style }) => (
  <div
    style={{
      background: C.white, border: `1px solid ${C.grid}`,
      borderRadius: 14, padding: 20,
      boxShadow: '0 1px 3px rgba(24,36,32,.05)',
      ...style,
    }}
  >
    {children}
  </div>
)
