"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ModalStockNotificationProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function ModalStockNotification({
  open,
  onClose,
  onAccept,
}: ModalStockNotificationProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 rounded-full p-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-4">
          ¡Solicitud Recibida!
        </h2>

        {/* Message */}
        <p className="text-center text-slate-600 mb-2 leading-relaxed">
          Cantidad no disponible en almacén por el momento.
        </p>
        <p className="text-center text-slate-600 mb-6 font-semibold text-orange-600">
          Tiempo estimado de espera para asignación: 24-48 horas
        </p>

        {/* Divider */}
        <div className="border-t border-slate-200 my-6"></div>

        {/* Info text */}
        <p className="text-sm text-slate-500 text-center mb-8">
          Tu solicitud se ha registrado como <span className="font-semibold text-slate-700">Pendiente</span> y será asignada cuando el stock sea repuesto.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
