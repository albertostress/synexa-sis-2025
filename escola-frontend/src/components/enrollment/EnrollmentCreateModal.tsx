import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { EnrollmentCreateForm } from './EnrollmentCreateForm';

interface EnrollmentCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EnrollmentCreateModal: React.FC<EnrollmentCreateModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Nova Matrícula</DialogTitle>
          <DialogDescription>
            Formulário para criar nova matrícula com dados do estudante
          </DialogDescription>
        </DialogHeader>
        
        <EnrollmentCreateForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};