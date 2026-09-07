import React from "react";
import { useToastStore } from "../../store/toastStore";
export function ToastViewport() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[200] space-y-2 sm:max-w-md"
      aria-label="Avisos"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          className={
            "p-4 rounded-xl shadow-xl text-white flex gap-4 justify-between " +
            (t.type === "error" ? "bg-rose-800" : "bg-emerald-800")
          }
        >
          <span>{t.message}</span>
          <button aria-label="Fechar aviso" onClick={() => dismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
