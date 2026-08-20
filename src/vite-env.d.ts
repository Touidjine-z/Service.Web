/// <reference types="vite/client" />

/**
 * Variables d'environnement lues par le client (prefixe `VITE_`, donc
 * embarquees dans le bundle : jamais de secret ici sauf en developpement).
 * Voir `.env.example` et `scripts/domain-proxy.mjs`.
 */
interface ImportMetaEnv {
  /** Relais qui detient le PAT GoDaddy cote serveur. Mode recommande. */
  readonly VITE_DOMAIN_API_URL?: string
  /** Appel direct a GoDaddy, developpement uniquement : la cle serait publique. */
  readonly VITE_GODADDY_PAT?: string
  /** Point d'entree GoDaddy, si autre que l'API publique (bac a sable). */
  readonly VITE_GODADDY_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
