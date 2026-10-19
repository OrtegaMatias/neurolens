// Logo de la Universidad del Desarrollo, adaptado al tema oscuro
// (fondo transparente, texto claro y azul UDD aclarado). Original: public/udd-logo.png
export function LogoUDD({ className = "" }: { className?: string }) {
  return <img src="/udd-logo.png" alt="Universidad del Desarrollo" width={640} height={160} className={className} />;
}
