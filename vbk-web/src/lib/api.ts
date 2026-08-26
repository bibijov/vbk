import { auth } from "@/lib/firebase";

/**
 * Poziv API rute sa Firebase ID tokenom u zaglavlju.
 * Baca Error sa porukom sa servera, tako da je pozivalac prikaže korisniku.
 */
export async function authedFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Niste prijavljeni.");

  const token = await user.getIdToken();
  const res = await fetch(path, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Zahtev nije uspeo.");
  return data as T;
}
