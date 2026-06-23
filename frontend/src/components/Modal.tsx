function Modal({ onClose, children }: { onClose: () => void, children: React.ReactNode }) {
    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-xl p-6 w-full max-w-md shadow-lg"
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}

export default Modal