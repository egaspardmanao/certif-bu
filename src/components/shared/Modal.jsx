import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size] ?? 'max-w-lg'
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`card w-full ${maxW} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-xl text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
