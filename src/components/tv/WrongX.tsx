'use client'

interface WrongXProps {
  show: boolean
}

export default function WrongX({ show }: WrongXProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="strike-x text-red-600 text-[300px] font-bold leading-none drop-shadow-2xl">
        X
      </div>

      <style jsx>{`
        @keyframes strike-appear {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .strike-x {
          animation: strike-appear 0.5s ease-out forwards;
          text-shadow: 0 0 60px rgba(255, 0, 0, 0.8);
        }
      `}</style>
    </div>
  )
}
