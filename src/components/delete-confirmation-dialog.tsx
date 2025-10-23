'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  entityName: string
  entityType: 'customer' | 'project' | 'task'
  isLoading?: boolean
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  entityName,
  entityType,
  isLoading = false
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsDeleting(true)
      await onConfirm()
      toast.success(`${entityType === 'customer' ? 'Kunde' : entityType === 'project' ? 'Projekt' : 'Aufgabe'} erfolgreich gelöscht`)
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(`Fehler beim Löschen der ${entityType === 'customer' ? 'Kunden' : entityType === 'project' ? 'Projekts' : 'Aufgabe'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const getWarningText = () => {
    if (entityType === 'customer') {
      return 'Dieser Vorgang löscht den Kunden und ALLE verknüpften Daten dauerhaft:'
    } else if (entityType === 'project') {
      return 'Dieser Vorgang löscht das Projekt und ALLE verknüpften Daten dauerhaft:'
    } else {
      return 'Dieser Vorgang löscht die Aufgabe dauerhaft:'
    }
  }

  const getRelatedData = () => {
    if (entityType === 'customer') {
      return [
        '• Alle Adressen und Kontakte',
        '• Alle Projekte und deren Aufgaben',
        '• Alle Rechnungen und Angebote',
        '• Alle Assets und Tickets',
        '• Alle Aufträge und Aufgaben'
      ]
    } else if (entityType === 'project') {
      return [
        '• Alle Aufgaben und Tickets',
        '• Alle Rechnungen und Angebote',
        '• Alle Assets und Dokumente'
      ]
    } else {
      return [
        '• Alle Kommentare und Notizen',
        '• Alle Zeitaufzeichnungen',
        '• Alle Dateianhänge'
      ]
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p className="font-medium">{description}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                {getWarningText()}
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                {getRelatedData().map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-sm text-red-800 font-medium mt-3">
                ⚠️ Dieser Vorgang kann NICHT rückgängig gemacht werden!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Lösche...' : `Ja, ${entityName} löschen`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
