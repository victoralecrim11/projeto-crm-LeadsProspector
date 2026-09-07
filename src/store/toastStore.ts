import { create } from "zustand";
type Toast = { id: string; message: string; type: "success" | "error" };
export const useToastStore = create<{
  toasts: Toast[];
  dismiss: (id: string) => void;
  show: (message: string, type?: Toast["type"]) => void;
}>((set, get) => ({
  toasts: [],
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  show: (message, type = "success") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, type }] }));
    setTimeout(() => get().dismiss(id), 6500);
  },
}));
export const toast = (message: string, type: Toast["type"] = "success") =>
  useToastStore.getState().show(message, type);
