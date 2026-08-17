/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** EmailJS service id — the mail service connected in the EmailJS dashboard. */
  readonly VITE_EMAILJS_SERVICE_ID?: string
  /** EmailJS template id — the template the contact form's fields are mapped into. */
  readonly VITE_EMAILJS_TEMPLATE_ID?: string
  /** EmailJS public key. Safe to ship in the bundle; lock the domain in the dashboard. */
  readonly VITE_EMAILJS_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
