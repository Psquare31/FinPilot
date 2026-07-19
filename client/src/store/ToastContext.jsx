import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info") => {
      const id = ++seq;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 3200);
    },
    [remove]
  );

  const toast = {
    success: (m) => push(m, "ok"),
    error: (m) => push(m, "err"),
    info: (m) => push(m, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
