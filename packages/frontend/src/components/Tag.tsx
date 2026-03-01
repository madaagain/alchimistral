import { useTheme } from '../hooks/useTheme'

interface TagProps {
  children: React.ReactNode
  color?: string
}

export default function Tag({ children, color }: TagProps) {
  const { theme } = useTheme()
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 7.5,
        fontWeight: 600,
        letterSpacing: 0.8,
        color: color || theme.t3,
        border: `1px solid ${color ? color + '33' : theme.bdr2}`,
        padding: '1px 5px',
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  )
}
