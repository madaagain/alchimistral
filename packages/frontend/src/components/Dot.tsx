interface DotProps {
  color: string
  pulse?: boolean
  size?: number
}

export default function Dot({ color, pulse, size = 6 }: DotProps) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {pulse && (
        <div
          className="absolute rounded-full animate-[pulse-dot_1.6s_ease-in-out_infinite]"
          style={{
            inset: -3,
            background: color,
            opacity: 0.25,
          }}
        />
      )}
      <div
        className="rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </div>
  )
}
