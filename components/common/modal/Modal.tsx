"use client";

import { X } from "lucide-react";
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
      <DialogContent className={cn("max-w-md rounded p-6", className)}>
        <DialogHeader className="items-center text-center sm:text-center">
          {onConfirm && (
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-full border-2",
                confirmVariant === "destructive"
                  ? "border-destructive text-destructive"
                  : "border-primary text-primary",
              )}
            >
              <X className="size-6" />
            </div>
          )}
          <DialogTitle className="text-[18px] sm:text-xl font-bold text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-[12px] sm:text-sm text-muted-foreground whitespace-pre-line">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}

        {onConfirm && (
          <DialogFooter className="flex-row justify-center gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              className="flex-1"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
