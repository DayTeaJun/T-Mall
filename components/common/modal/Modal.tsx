"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  onConfirm,
  confirmText = "확인",
  cancelText = "취소",
  confirmVariant = "destructive",
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-w-md rounded-2xl p-4", className)}>
        <DialogHeader>
          <DialogTitle className="text-[18px] sm:text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-[12px] sm:text-sm text-gray-600 whitespace-pre-line">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}

        {onConfirm && (
          <DialogFooter className="flex-row justify-end">
            <Button variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm}>
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
