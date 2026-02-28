import { T } from '../styles/tokens'

interface TagProps {
  children: React.ReactNode
  color?: string
}

export default function Tag({ children, color }: TagProps) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 7.5,
        fontWeight: 600,
        letterSpacing: 0.8,
        color: color || T.t3,
        border: `1px solid ${color ? color + '33' : T.bdr2}`,
        padding: '1px 5px',
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  )
}
