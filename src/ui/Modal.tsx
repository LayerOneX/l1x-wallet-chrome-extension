import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Modal;
