import { getInitiales } from '../../lib/utils'

export default function Avatar({ consultant, size = 'md', onClick }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  }
  if (consultant?.photo_url) {
    return (
      <img
        src={consultant.photo_url}
        alt={`${consultant.prenom} ${consultant.nom}`}
        className={`${sizes[size]} rounded-full object-cover ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        onClick={onClick}
      />
    )
  }
  return (
    <div
      className={`avatar ${sizes[size]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      {getInitiales(consultant?.prenom, consultant?.nom)}
    </div>
  )
}
