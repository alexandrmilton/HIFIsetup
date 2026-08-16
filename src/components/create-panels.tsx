import Link from "next/link";

/** Desktop-only teaser panels mirroring the two steps of the create flow.
 *  Hidden on mobile — there the flow is reached through the create button. */
export function CreatePanels() {
  return (
    <aside className="create-panels" aria-label="Створення сетапу">
      <div className="create-panel">
        <div className="create-panel-head"><p className="eyebrow">Додати компонент</p></div>
        <div className="wizard-steps wizard-steps-mini">
          <span className="wizard-step active"><b>1</b><em>Пошук</em></span>
          <span className="wizard-step-line" />
          <span className="wizard-step"><b>2</b><em>Деталі</em></span>
          <span className="wizard-step-line" />
          <span className="wizard-step"><b>3</b><em>Додано</em></span>
        </div>
        <p className="create-panel-hint">Почніть вводити назву компонента</p>
        <div className="fake-search">🔍 Marantz PM…</div>
        <div className="fake-results">
          {[["Marantz", "PM7000N"], ["Marantz", "PM8006"], ["Marantz", "PM6007"]].map(([brand, model]) => (
            <div className="fake-result" key={model}>
              <span className="component-thumb" />
              <span><b>{brand} {model}</b><small>Інтегральний підсилювач</small></span>
            </div>
          ))}
        </div>
        <p className="create-panel-note">Не знайшли компонент? Додайте його вручну — з позначкою Handmade або Custom order.</p>
      </div>

      <div className="create-panel">
        <div className="create-panel-head"><p className="eyebrow">Створити свій сетап</p></div>
        <div className="wizard-steps wizard-steps-mini">
          <span className="wizard-step active"><b>1</b><em>Інформація</em></span>
          <span className="wizard-step-line" />
          <span className="wizard-step"><b>2</b><em>Компоненти</em></span>
          <span className="wizard-step-line" />
          <span className="wizard-step"><b>3</b><em>Публікація</em></span>
        </div>
        <div className="fake-dropzone"><span>🖼</span><b>Додайте фото вашого сетапу</b><small>Перетягніть або натисніть для завантаження</small></div>
        <p className="create-panel-hint">Назва сетапу</p>
        <div className="fake-input">Наприклад: Віниловий сетап у вітальні</div>
        <p className="create-panel-hint">Видимість</p>
        <div className="fake-input">🌐 Публічний</div>
        <div className="setup-tags">{["Класика", "Вініл", "Стрімінг", "Хай-енд"].map((tag) => <span className="setup-tag" key={tag}>{tag}</span>)}</div>
        <Link className="button button-dark create-panel-cta" href="/create">Далі: Додати компоненти <span>→</span></Link>
      </div>
    </aside>
  );
}
