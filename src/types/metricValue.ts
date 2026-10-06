/** Un valor calculado puede incluir estimaciones; null indica que aún no está disponible. */
export type MetricValue =
  | { readonly value: number; readonly estimated: boolean }
  | { readonly value: null; readonly estimated: false }
