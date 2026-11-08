// First-visit tour: a spotlight walks the seller through the main sections.
const KEY = 'radeefe-tour-v1';

const steps = [
  {welcome: true, title: 'به ردیفه خوش آمدی', text: 'این یک نمایش کوتاه است: در چند قدم می‌بینی هر بخش چه کاری می‌کند. هر وقت خواستی رد کن.'},
  {target: '.brand', title: 'این ردیفه', text: 'دستیار سفارش‌های توست. کارش این است که گفتگوهای اینستاگرام را به سفارش مرتب تبدیل کند.'},
  {target: 'nav.nav a[data-nav="today"]', title: 'کارهای امروز', text: 'هر روز صبح اینجا می‌بینی چه سفارشی به تو نیاز دارد: پرداخت، ارسال یا اطلاعات ناقص.'},
  {target: 'nav.nav a[data-nav="orders"]', title: 'همهٔ سفارش‌ها', text: 'همهٔ سفارش‌ها با وضعیت روشن. روی هر کارت بزنی، جزئیات و قدم بعدی‌اش باز می‌شود.'},
  {target: 'nav.nav a[data-nav="inbox"]', title: 'صندوق پیام‌ها', text: 'متن دایرکت را اینجا می‌گذاری. ردیفه محصول و تعداد را می‌فهمد و پیش‌نویس سفارش می‌سازد.'},
  {target: 'nav.nav a[data-nav="products"]', title: 'محصول‌ها', text: 'قیمت‌ها اینجاست. هر تغییری در قیمت، از همین‌جا روی سفارش‌های بعدی اثر می‌گذارد.'},
  {target: 'nav.nav a[data-nav="settings"]', title: 'تنظیمات', text: 'اینترنت و هوش مصنوعی، تصمیم‌های خودکار و پاسخ‌های آماده. هر کلید را خودت روشن یا خاموش می‌کنی.'},
];

function element(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  return wrapper.firstElementChild;
}

export function resetTour() {
  localStorage.removeItem(KEY);
}

export function startTour({force = false} = {}) {
  if (!force && localStorage.getItem(KEY)) return;
  document.querySelector('.tour-root')?.remove();

  const root = element(`<div class="tour-root" role="dialog" aria-modal="true" aria-label="آموزش ردیفه">
    <div class="tour-spot" aria-hidden="true"></div>
    <div class="tour-card" tabindex="-1">
      <span class="tour-step"></span>
      <h3 class="tour-title"></h3>
      <p class="tour-text"></p>
      <div class="tour-actions">
        <button class="button small tour-next" type="button">بعدی</button>
        <button class="text-button tour-skip" type="button">رد کردن</button>
      </div>
    </div>
  </div>`);
  document.body.append(root);

  const spot = root.querySelector('.tour-spot');
  const card = root.querySelector('.tour-card');
  const title = root.querySelector('.tour-title');
  const text = root.querySelector('.tour-text');
  const stepLabel = root.querySelector('.tour-step');
  const next = root.querySelector('.tour-next');
  let index = 0;

  const finish = () => {
    localStorage.setItem(KEY, '1');
    root.classList.add('closing');
    setTimeout(() => root.remove(), 220);
    document.removeEventListener('keydown', onKey);
  };

  function show(position) {
    index = Math.max(0, Math.min(steps.length - 1, position));
    const step = steps[index];
    const target = document.querySelector(step.target);
    title.textContent = step.title;
    text.textContent = step.text;
    stepLabel.textContent = `${index + 1} از ${steps.length}`;
    next.textContent = index === steps.length - 1 ? 'تمام' : 'بعدی';
    if (step.welcome) next.textContent = 'شروع';
    if (!target && !step.welcome) { show(index + 1); return; }
    if (!target || step.welcome) {
      spot.style.opacity = '0';
      root.classList.add('welcome');
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
      card.style.top = '50%'; card.style.left = '50%'; card.style.transform = 'translate(-50%,-50%)';
      next.textContent = 'شروع';
      card.focus({preventScroll: true});
      return;
    }
    spot.style.opacity = '1';
    root.classList.remove('welcome');
    card.style.transform = 'none';
    target.scrollIntoView({block: 'center', behavior: 'smooth'});
    const box = target.getBoundingClientRect();
    const pad = 8;
    spot.style.width = `${box.width + pad * 2}px`;
    spot.style.height = `${box.height + pad * 2}px`;
    spot.style.transform = `translate(${box.left - pad}px, ${box.top - pad}px)`;
    const cardWidth = 304;
    const cardHeight = card.offsetHeight || 190;
    const leftSpace = box.left;
    const rightSpace = window.innerWidth - box.right;
    let left;
    card.classList.remove('arrow-right', 'arrow-left');
    if (leftSpace > cardWidth + 24) { left = box.left - cardWidth - 22; card.classList.add('arrow-right'); }
    else if (rightSpace > cardWidth + 24) { left = box.right + 22; card.classList.add('arrow-left'); }
    else left = Math.max(16, (window.innerWidth - cardWidth) / 2);
    const top = Math.min(window.innerHeight - cardHeight - 16, Math.max(16, box.top + box.height / 2 - cardHeight / 2));
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
    card.style.transform = 'none';
    card.classList.remove('pop');
    void card.offsetWidth;
    card.classList.add('pop');
    card.focus({preventScroll: true});
  }

  function onKey(event) {
    if (event.key === 'Escape') finish();
    if (event.key === 'ArrowLeft') show(index + 1);
    if (event.key === 'ArrowRight') show(index - 1);
  }

  next.addEventListener('click', () => (index === steps.length - 1 ? finish() : show(index + 1)));
  root.querySelector('.tour-skip').addEventListener('click', finish);
  document.addEventListener('keydown', onKey);
  show(0);
}
