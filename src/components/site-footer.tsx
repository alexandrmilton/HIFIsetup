import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <Image src="/logo.png" alt="HiFiSetup" width={2172} height={724} />
          <p>Спільнота, де аудіофіли діляться своїми сетапами, знаходять компоненти та надихаються чужими системами.</p>
        </div>
        <nav className="footer-links" aria-label="Навігація у підвалі">
          <div>
            <h4>Сайт</h4>
            <Link href="/">Головна</Link>
            <Link href="/#setups">Сетапи</Link>
            <Link href="/create">Створити сетап</Link>
          </div>
          <div>
            <h4>Акаунт</h4>
            <Link href="/login">Увійти</Link>
            <Link href="/profile">Профіль</Link>
          </div>
          <div>
            <h4>Розробникам</h4>
            <a href="/api/public/setups">Публічний API</a>
            <a href="https://github.com/alexandrmilton/HIFIsetup" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </nav>
      </div>
      <div className="shell footer-bottom">
        <p>© 2026 HiFiSetup. Створено у 2026 році в Україні. Усі права захищено.</p>
        <p className="footer-note">Назви брендів і моделей належать їхнім власникам.</p>
      </div>
    </footer>
  );
}
