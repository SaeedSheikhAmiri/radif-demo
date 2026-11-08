const DESCRIPTIONS = {
  autoDraftFromMessage: 'وقتی از صندوق پیام‌ها کارت سفارش را باز می‌کنی، دستیار خودش شروع می‌کند. اگر خاموش باشد، خودت دکمهٔ بررسی را می‌زنی.',
  autoLinkMessage: 'اگر شمارهٔ دقیق مشتری در پیام باشد و آن مشتری فقط یک سفارش باز داشته باشد، پیام خودکار به آن سفارش وصل می‌شود. اگر مطمئن نباشد، وصل نمی‌کند.',
  suggestReply: 'برای پرسش قیمت و پیگیری، یک متن پاسخ آماده نشان داده می‌شود تا کپی کنی. هیچ پیامی ارسال نمی‌شود.',
  autoReorder: 'در جزئیات سفارش، دکمهٔ «سفارش مجدد» نمایش داده می‌شود که اقلام قبلی را با قیمت روز پر می‌کند.',
  reminders: 'سفارش‌هایی که موعدشان گذشته یا مدت‌ها در آماده‌سازی مانده‌اند، بالای صفحهٔ امروز فهرست می‌شوند.',
  dailyBriefing: 'یک خلاصهٔ یک‌خطی از وضعیت امروز بالای صفحه نشان داده می‌شود.',
  mergeDuplicates: 'اگر دو مشتری با یک شماره ثبت شده باشند، در صفحهٔ مشتری‌ها هشدار داده می‌شود.',
  autoReply: 'به پیام‌های پرسش و پیگیری، یک پاسخ کوتاه از کاتالوگ خودکار فرستاده می‌شود. فقط تا ۲۴ ساعت بعد از پیام مشتری و حداکثر یک بار در ساعت.',
};

const NUMBERS = {
  reminderDays: {label: 'چند روز در آماده‌سازی، عقب‌افتاده حساب شود؟', min: 1, max: 30},
  retentionDays: {label: 'پیام‌های بی‌سفارش بعد از چند روز پاک شوند؟ (۰ = هیچ‌وقت)', min: 0, max: 3650},
};

export function mountSettings({api, send, esc}) {
  const main = document.querySelector('#main');
  main.innerHTML = `<div class="page-heading"><div><h1>تنظیمات خودکارسازی</h1>
    <p class="subtitle">هر قابلیت را می‌توانی روشن یا خاموش کنی. چیزی که خاموش باشد، دستی می‌ماند.</p></div></div>
    <div class="notice">این تنظیمات فقط رفتار برنامه را عوض می‌کنند. ارسال پیام به مشتری و تأیید واریز در هر حالت دستی است.</div>
    <div id="settings-body"><div class="loading"><span class="spinner"></span>در حال خواندن تنظیمات…</div></div>`;

  const body = document.querySelector('#settings-body');
  const draw = ({settings, labels}) => {
    const toggles = Object.entries(DESCRIPTIONS).map(([key, description]) => `
      <label class="setting-row">
        <input type="checkbox" data-setting="${key}" ${settings[key] ? 'checked' : ''}>
        <span class="setting-text"><strong>${esc(labels[key] || key)}</strong><small>${esc(description)}</small></span>
      </label>`).join('');

    const numbers = Object.entries(NUMBERS).map(([key, meta]) => `
      <label class="field setting-number">
        <span>${esc(meta.label)}</span>
        <input type="number" min="${meta.min}" max="${meta.max}" value="${settings[key]}" data-setting="${key}" inputmode="numeric">
      </label>`).join('');

    body.innerHTML = `<section class="panel settings-panel">${toggles}</section>
      <section class="panel settings-panel">${numbers}</section>`;
  };

  const load = () => api('/api/settings').then(draw);
  load().catch(error => { body.textContent = error.message; });

  body.addEventListener('change', async event => {
    const input = event.target.closest('[data-setting]');
    if (!input) return;
    const key = input.dataset.setting;
    const value = input.type === 'checkbox' ? input.checked : Number(input.value);
    input.disabled = true;
    try {
      const result = await send('/api/settings', {[key]: value}, 'PATCH');
      draw(result);
    } catch (error) {
      body.insertAdjacentHTML('afterbegin', `<p class="form-error">${esc(error.message)}</p>`);
      input.disabled = false;
    }
  });
}
