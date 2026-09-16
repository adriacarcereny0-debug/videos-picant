/**
 * La página de acceso vive en su propio grupo de rutas a propósito.
 *
 * Dentro de `app/admin/` heredaría el layout del panel, que exige estar
 * autenticado y redirige aquí: la puerta se redirigía a sí misma en bucle.
 */
export default function AdminGateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
