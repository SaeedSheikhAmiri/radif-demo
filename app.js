import {demoApi} from './demo-api.js';
import {setupAgentUI} from './agent-ui.js';
import {imageInputMarkup,bindImageInput} from './image-input.js';
import {mountInbox} from './inbox-ui.js';
import {mountSettings} from './settings-ui.js';
const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>[...root.querySelectorAll(q)];
const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const fa=value=>new Intl.NumberFormat('fa-IR').format(Number(value||0));
const amount=value=>`${fa(value)} <small>تومان</small>`;
const digits=value=>String(value??'').replace(/[۰-۹]/g,x=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/[٠-٩]/g,x=>'٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/[,٬]/g,'');
const names={needs_info:'اطلاعات ناقص',awaiting_payment:'بررسی پرداخت',preparing:'در حال آماده‌سازی',ready_to_ship:'آمادهٔ ارسال',shipped:'ارسال‌شده',delivered:'تحویل‌شده',cancelled:'لغوشده'};
const paths={
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 box:'<path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 10v9M3 8l9 5 9-5M7.5 5.5l9 5"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
 tag:'<path d="m20 13-7 7a2 2 0 0 1-3 0L2 12V2h10l8 8a2 2 0 0 1 0 3Z"/><circle cx="7" cy="7" r="1"/>',
 store:'<path d="M3 10v11h18V10M2 4h20l-2 6a3 3 0 0 1-5 0 3 3 0 0 1-6 0 3 3 0 0 1-5 0L2 4ZM9 21v-7h6v7"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1v4m-2-2h4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 arrow:'<path d="M19 12H5m6-6-6 6 6 6"/>',
 x:'<path d="m6 6 12 12M6 18 18 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
 search:'<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
 alert:'<path d="m12 3 10 18H2L12 3Zm0 6v4m0 4h.01"/>',
 wallet:'<path d="M20 8V5H5a3 3 0 0 1 0-6"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M21 11h-5v5h5m-3-2.5h.01"/>',
 document:'<path d="M14 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-7-7Zm0 0v7h7M7 13h10M7 17h7"/>',
 copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 truck:'<path d="M1 3h13v13H1V3Zm13 5h4l4 4v4h-8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/>',
 leaf:'<path d="M20 3C8 1 2 8 5 15s15 7 15-12ZM4 21l11-11"/>',
 edit:'<path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-3 3 5 5"/>',
 refresh:'<path d="M20 7a9 9 0 1 0 1 9M20 2v6h-6"/>',
 inbox:'<path d="m3 3-2 12v6h22v-6L21 3H3Zm-2 12h6l2 3h6l2-3h6"/>',
 settings:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.box}</svg>`;
function icons(root=document){$$('[data-icon]',root).forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const state={orders:[],products:[],customers:[],today:'',view:'today',tab:'all',query:'',filter:'all',detail:null,draftKey:null,installPrompt:null};
state.settings={};
let toastTimer;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4000);}
const api=demoApi;
const send=(url,data,method='POST')=>api(url,{method,body:JSON.stringify(data)});
const active=o=>!['shipped','delivered','cancelled'].includes(o.status);
const actionable=o=>active(o)&&o.action.urgency!=='normal';
function dateLabel(value,short=false){
 if(!value)return 'موعد مشخص نیست';
 try{return new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',day:'numeric',month:short?'numeric':'long',...(short?{year:'numeric'}:{})}).format(new Date(String(value).slice(0,10)+'T12:00:00Z'));}catch{return 'تاریخ نامشخص';}
}
function timeLabel(value){return new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
function dueLabel(order){if(order.due_date===state.today)return 'امروز';if(order.action.urgency==='overdue')return `${dateLabel(order.due_date)} · گذشته`;return dateLabel(order.due_date);}
const badge=o=>`<span class="badge ${esc(o.status)}">${names[o.status]}</span>`;
async function refresh(){
 const [data,products,customers]=await Promise.all([api('/api/orders'),api('/api/products'),api('/api/customers')]);
 // Loaded here, not at module scope: the public demo replaces api with a const,
 // which would be in the temporal dead zone at import time.
 try{state.settings=(await api('/api/settings')).settings||{};}catch{state.settings={};}
 state.orders=data.orders;state.today=data.today;state.products=products.products;state.customers=customers.customers;
 $('#connection').innerHTML='<i></i>دموی نمایشی · دادهٔ مرورگر';$('#connection').classList.remove('failed');
 $('#nav-count').textContent=fa(state.orders.filter(actionable).length);
}
function heading(title,subtitle,action=true){return `<div class="page-heading"><div><div class="heading-meta">${icon('calendar')}${new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long'}).format(new Date())}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action?`<button class="button" data-action="new">${icon('plus')}سفارش جدید</button>`:''}</div>`;}
function sampleNote(){return state.orders.some(o=>o.is_sample)?`<div class="sample-note">${icon('document')}<span>سفارش‌های دارای برچسب «نمونه» فقط برای آشنایی با برنامه‌اند.</span><button data-action="help">روش کار ردیف</button></div>`:'';}
function stat(label,value,note,ico,color=''){const filter={box:'open',wallet:'payment',clock:'overdue',truck:'shipped'}[ico]||'all';return `<a class="stat stat-link" href="#orders?filter=${filter}" aria-label="مشاهدهٔ ${label}"><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon(ico)}</span></div><div class="stat-value">${fa(value)}</div><div class="stat-note ${color==='red'?'red':''}">${note}</div></a>`;}
function empty(title='فعلاً سفارشی اینجا نیست',description='با ثبت یک سفارش، وضعیت و کار بعدی آن را همین‌جا ببینید.',action=true){return `<div class="empty"><div class="empty-icon">${icon('inbox')}</div><h3>${title}</h3><p>${description}</p>${action?`<button class="button small" data-action="new">${icon('plus')}ثبت سفارش جدید</button>`:''}</div>`;}
function table(orders){return `<div class="order-head"><span>مشتری و سفارش</span><span>محصول</span><span>وضعیت</span><span>موعد ارسال</span><span></span></div><div id="order-rows">${rows(orders)}</div>`;}
function rows(orders){return orders.length?orders.map(o=>`<div class="order-row" role="link" tabindex="0" data-order="${o.id}" aria-label="مشاهدهٔ سفارش ${esc(o.customer_name)}"><div class="order-person"><input type="checkbox" class="row-pick" data-pick="${o.id}" aria-label="انتخاب سفارش ${esc(o.customer_name)}"><span class="avatar">${esc(o.customer_name[0])}</span><div><strong>${esc(o.customer_name)}</strong><small>سفارش #${fa(o.number)}${o.is_sample?'<span class="sample-pill">نمونه</span>':''}</small></div></div><div class="order-item">${esc(o.items[0]?.productName||'کالا')}<small>${fa(o.items.reduce((sum,i)=>sum+i.quantity,0))} عدد${o.items.length>1?` · ${fa(o.items.length)} قلم`:''}</small></div><div class="order-status">${badge(o)}</div><div class="order-due due ${o.action.urgency==='overdue'?'late':''}">${dueLabel(o)}</div><span class="row-arrow">${icon('arrow')}</span></div>`).join(''):empty('همه‌چیز در این بخش ردیف است','سفارشی با این شرایط پیدا نشد.',false);}
function sorted(orders){const score={overdue:0,today:1,attention:2,normal:3,none:4};return [...orders].sort((a,b)=>(score[a.action.urgency]-score[b.action.urgency])||String(a.due_date||'9999').localeCompare(b.due_date||'9999')||Number(b.number)-Number(a.number));}
function todayOrders(){let list=state.orders.filter(actionable);if(state.tab==='overdue')list=list.filter(o=>o.action.urgency==='overdue');if(state.tab==='payment')list=list.filter(o=>o.payment_status!=='confirmed');if(state.tab==='info')list=list.filter(o=>o.status==='needs_info');return sorted(list);}
function renderToday(){
 const open=state.orders.filter(active),late=open.filter(o=>o.action.urgency==='overdue'),pending=open.filter(o=>o.payment_status!=='confirmed'),shipped=state.orders.filter(o=>o.status==='shipped');
 const focus=sorted(state.orders.filter(actionable)).slice(0,3);
 return `${heading('امروز، همه‌چیز ردیفه.','سفارش‌هایی که به توجه شما نیاز دارند، یک‌جا ببینید.')}${sampleNote()}
 <section class="stats" aria-label="خلاصهٔ سفارش‌ها">${stat('سفارش‌های باز',open.length,'هنوز به مرحلهٔ ارسال نرسیده‌اند','box','teal')}${stat('نیازمند بررسی واریز',pending.length,'تأیید نهایی پرداخت با شماست','wallet','amber')}${stat('موعد ارسال گذشته',late.length,'برای این سفارش‌ها اقدام کنید','clock','red')}${stat('در مسیر تحویل',shipped.length,'ارسال شده‌اند و منتظر تحویل‌اند','truck')}</section>
 <div class="main-grid"><section class="panel"><div class="panel-header"><div><h2>سفارش‌های نیازمند توجه</h2><p>از مهم‌ترین کار شروع کنید؛ هر سفارش یک قدم بعدی دارد.</p></div><a class="text-button" href="#orders">همهٔ سفارش‌ها ${icon('arrow')}</a></div><div class="tabs" role="tablist" aria-label="فیلتر کارهای امروز">${[['all','همه',state.orders.filter(actionable).length],['overdue','موعد گذشته',late.length],['payment','پرداخت',pending.length],['info','اطلاعات ناقص',open.filter(o=>o.status==='needs_info').length]].map(([key,label,count])=>`<button class="tab ${state.tab===key?'active':''}" role="tab" aria-selected="${state.tab===key}" data-tab="${key}">${label}<b>${fa(count)}</b></button>`).join('')}</div>${table(todayOrders())}</section>
 <aside class="side-panels"><section class="focus-panel"><div class="focus-title">${icon('spark')}از اینجا شروع کنید</div><p class="muted">کارهای کوچک، برای خیال راحت‌تر</p>${focus.length?focus.map((o,i)=>`<div class="focus-task"><span class="focus-dot ${o.action.urgency==='overdue'?'red':i===2?'teal':''}">${icon(o.action.urgency==='overdue'?'alert':o.payment_status!=='confirmed'?'wallet':'document')}</span><button data-order="${o.id}"><strong>${esc(o.action.label)}</strong><small>${esc(o.customer_name)} · سفارش #${fa(o.number)}</small></button></div>`).join(''):'<div class="focus-task"><span class="focus-dot teal">'+icon('check')+'</span><div><strong>کار فوری‌ای باقی نمانده</strong><small>سفارش‌های دیگر را در فهرست کامل ببینید.</small></div></div>'}</section><section class="flow-card">${icon('document')}<h3>گفتگو را به سفارش تبدیل کنید</h3><p>به‌جای دوباره‌نویسی، متن گفتگو را وارد کنید. اطلاعات را بررسی کنید و سفارش را ثبت کنید.</p><button class="text-button" data-action="new">شروع یک سفارش ${icon('arrow')}</button><div class="workflow"><span>${icon('document')}گفتگو</span><span>${icon('check')}بازبینی</span><span>${icon('box')}سفارش</span></div></section></aside></div>`;
}
function filteredOrders(){let list=state.orders;if(state.filter==='open')list=list.filter(active);else if(state.filter==='payment')list=list.filter(o=>active(o)&&o.payment_status!=='confirmed');else if(state.filter==='overdue')list=list.filter(o=>active(o)&&o.action.urgency==='overdue');else if(state.filter!=='all')list=list.filter(o=>o.status===state.filter);const q=digits(state.query.toLowerCase().trim());if(q)list=list.filter(o=>digits([o.customer_name,o.phone,o.handle,o.number,...o.items.map(i=>i.productName)].join(' ').toLowerCase()).includes(q));return sorted(list);}
function renderOrders(){return `${heading('سفارش‌ها','از اولین پیام تا تحویل؛ هر سفارش با یک وضعیت روشن.')}${sampleNote()}<section class="panel"><div class="toolbar"><label class="search">${icon('search')}<input id="order-search" type="search" aria-label="جستجوی سفارش" placeholder="نام مشتری، شماره یا محصول…" value="${esc(state.query)}"></label><select id="order-filter" class="filter-select" aria-label="فیلتر وضعیت سفارش"><option value="all">همهٔ وضعیت‌ها</option>${Object.entries({open:'سفارش‌های باز',payment:'نیازمند بررسی واریز',overdue:'موعد ارسال گذشته',...names}).map(([key,name])=>`<option value="${key}" ${state.filter===key?'selected':''}>${name}</option>`).join('')}</select></div>${table(filteredOrders())}</section>`;}
function renderCustomers(){return `${heading('مشتری‌ها','سابقه‌ای که کمک می‌کند هر بار از اول شروع نکنید.')}<p class="page-summary">${fa(state.customers.length)} مشتری ثبت‌شده · اتصال سفارش‌های یک مشتری بر اساس شمارهٔ موبایل یکسان انجام می‌شود.</p><div class="customer-grid">${state.customers.map(c=>`<button class="customer-card" data-customer="${c.id}"><div class="order-person"><span class="avatar">${esc(c.name[0])}</span><div><strong>${esc(c.name)}</strong><small class="ltr">${esc(c.phone||'بدون شماره')}</small></div></div><div class="customer-facts"><span><b>${fa(c.order_count)}</b>سفارش ثبت‌شده</span><span><b>${fa(c.delivered_count)}</b>تحویل‌شده</span><span><b>${fa(c.confirmed_order_value)}</b>ارزش سفارش‌های تأییدپرداخت‌شده · تومان</span></div></button>`).join('')||empty('هنوز مشتری‌ای ثبت نشده','با ثبت اولین سفارش، سابقهٔ مشتری هم ساخته می‌شود.')}</div>`;}
function renderProducts(){return `${heading('محصول‌ها','نام و قیمت‌های پیشنهادی برای ساخت سریع‌تر کارت سفارش.',false)}<div class="notice" style="margin-bottom:20px">تغییر قیمت محصول روی سفارش‌های قبلاً ثبت‌شده اثر ندارد. قیمت همهٔ سفارش‌ها به تومان است.</div><div class="product-grid">${state.products.map(p=>`<article class="product-card"><div class="product-art">${icon('leaf')}</div><h3>${esc(p.name)}</h3><div class="price">${amount(p.price)}</div><button class="button secondary small" data-edit-product="${p.id}">${icon('edit')}ویرایش قیمت</button></article>`).join('')}</div><section class="panel" style="margin-top:22px"><div class="panel-header"><h2>افزودن یا به‌روزرسانی محصول</h2></div><form id="product-form" class="product-form"><div class="field"><label for="product-name">نام محصول</label><input id="product-name" name="name" required maxlength="200" placeholder="مثلاً صابون جو دوسر"></div><div class="field"><label for="product-price">قیمت هر عدد · تومان</label><input id="product-price" name="price" required inputmode="numeric" placeholder="۱۲۰٬۰۰۰"></div><button class="button" type="submit">${icon('plus')}ذخیرهٔ محصول</button><div id="product-error" class="form-error" role="alert" style="width:100%"></div></form></section>`;}
function render(){
 const titles={today:'کارهای امروز',orders:'همهٔ سفارش‌ها',customers:'مشتری‌ها',products:'محصول‌ها',inbox:'صندوق پیام‌ها',settings:'تنظیمات'};
 $('#breadcrumb').textContent=titles[state.view];
 $$('[data-nav]').forEach(el=>{el.classList.toggle('active',el.dataset.nav===state.view);if(el.dataset.nav===state.view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 if(state.view==='inbox'){mountInbox({api,send,esc,icon,isCurrent:()=>state.view==='inbox',onDraft:row=>{openEditor();$('#source-text').value=row.body;const form=$('#order-form');form.dataset.inboxMessageId=row.id;form.dataset.inboxVersion=row.version;form.dataset.inboxSource=row.body;toast('متن پیام در کارت قرار گرفت؛ پیشنهاد دستیار یا استخراج را اجرا و کارت را بررسی کنید.');if(state.settings.autoDraftFromMessage)setTimeout(()=>$('#agent-button')?.click(),350);}});return;}
 if(state.view==='settings'){mountSettings({api,send,esc,icon});return;}
 $('#main').innerHTML=({today:renderToday,orders:renderOrders,customers:renderCustomers,products:renderProducts}[state.view]||renderToday)();icons($('#main'));
 if(state.view==='today')void enhanceToday();
 if(state.view==='customers')void enhanceCustomers();
}
async function enhanceToday(){
 try{
  const [brief,rem]=await Promise.all([api('/api/briefing'),api('/api/reminders')]);
  const main=$('#main');if(state.view!=='today'||!main.querySelector('.page-heading'))return;
  const heading=main.querySelector('.page-heading');
  let html='';
  if(brief.enabled)html+=`<div class="notice briefing">${esc(brief.text)}</div>`;
  if(rem.enabled&&rem.reminders.length){
   const rows=rem.reminders.slice(0,6).map(o=>`<button class="subtle-button" data-order="${o.id}"><strong>${esc(o.customer_name)}</strong> · سفارش #${fa(o.number)} — ${esc(o.label)}</button>`).join('');
   html+=`<section class="panel reminders-panel"><div class="panel-header"><h2>یادآور</h2><p>${fa(rem.reminders.length)} سفارش نیاز به بررسی</p></div><div class="drawer-body reminders-list">${rows}</div></section>`;
  }
  html+=`<section class="panel ask-panel"><div class="panel-header"><h2>بپرس</h2><p>دربارهٔ سفارش‌های خودت</p></div><div class="drawer-body"><form id="ask-form" class="ask-form"><input id="ask-question" maxlength="500" placeholder="مثلاً چند سفارش آمادهٔ ارسال دارم؟" aria-label="پرسش"><button class="button small" type="submit">بپرس</button></form><div id="ask-answer" class="notice" hidden></div></div></section>`;
  if(html)heading.insertAdjacentHTML('afterend',html);
  const askForm=$('#ask-form');
  if(askForm)askForm.addEventListener('submit',async event=>{
   event.preventDefault();
   const input=$('#ask-question'),box=$('#ask-answer'),button=askForm.querySelector('button');
   const question=input.value.trim();
   if(!question)return;
   button.disabled=true;box.hidden=false;box.textContent='در حال بررسی…';
   try{const result=await send('/api/ask',{question});box.textContent=result.answer||'پاسخی پیدا نشد.';}
   catch(error){box.textContent=error.message;}
   finally{button.disabled=false;}
  });
 }catch{}
}
async function enhanceCustomers(){
 try{
  const {enabled,duplicates}=await api('/api/customers/duplicates');
  if(!enabled||!duplicates.length||state.view!=='customers')return;
  const heading=$('#main').querySelector('.page-heading');if(!heading)return;
  const text=duplicates.slice(0,5).map(d=>`${esc(d.phone)} → ${esc((d.names||[]).join('، '))}`).join(' | ');
  heading.insertAdjacentHTML('afterend',`<div class="notice">شمارهٔ تکراری: ${text}. پیش از ثبت سفارش تازه، یک مشتری را انتخاب کنید.</div>`);
 }catch{}
}
function prefillReorder(draft){
 openEditor();
 $('#customer-name').value=draft.customerName||'';
 $('#customer-phone').value=draft.phone||'';
 $('#customer-address').value=draft.address||'';
 $('#customer-handle').value=draft.handle||'';
 const html=(draft.items||[]).map(i=>itemRow({productName:i.name,quantity:i.quantity,unitPrice:i.unitPrice})).join('');
 if(html)$('#item-rows').innerHTML=html;
 updateTotal();
 toast('اقلام سفارش قبلی با قیمت روز وارد شد؛ بررسی و ثبت کن.');
}
state.picked=new Set();
function bulkBar(){
 let bar=document.querySelector('#bulk-bar');
 if(!bar){
  bar=document.createElement('div');
  bar.id='bulk-bar';bar.className='bulk-bar';bar.hidden=true;
  bar.innerHTML=`<span id="bulk-count"></span><select id="bulk-status">${Object.entries(names).map(([key,label])=>`<option value="${key}">${esc(label)}</option>`).join('')}</select><button class="button small" id="bulk-apply">اعمال</button><button class="text-button" id="bulk-clear">لغو انتخاب</button>`;
  document.body.append(bar);
  bar.querySelector('#bulk-apply').addEventListener('click',applyBulk);
  bar.querySelector('#bulk-clear').addEventListener('click',()=>{state.picked.clear();$$('.row-pick').forEach(c=>{c.checked=false;});bulkBar();});
 }
 bar.hidden=state.picked.size===0;
 if(state.picked.size)bar.querySelector('#bulk-count').textContent=`${fa(state.picked.size)} سفارش انتخاب شده`;
 return bar;
}
async function applyBulk(){
 const status=document.querySelector('#bulk-status').value;
 const items=[...state.picked].map(id=>{const order=state.orders.find(o=>o.id===id);return {id,version:order?.version};}).filter(i=>Number.isInteger(i.version));
 if(!items.length)return;
 try{
  const result=await send('/api/orders/bulk',{operation:'status',status,items});
  toast(`${fa(result.done)} سفارش تغییر کرد${result.failed?`، ${fa(result.failed)} ناموفق`:''}.`);
  state.picked.clear();
  await refresh();render();
 }catch(error){toast(error.message);}
}
function itemRow(item={}){const key=crypto.randomUUID();return `<div class="item-row"><div class="field"><label for="product-${key}">محصول</label><input id="product-${key}" name="productName" list="catalog" required maxlength="200" placeholder="نام محصول" value="${esc(item.productName||'')}"></div><div class="field"><label for="quantity-${key}">تعداد</label><input id="quantity-${key}" name="quantity" inputmode="numeric" required aria-label="تعداد کالا" value="${esc(item.quantity??1)}"></div><div class="field"><label for="price-${key}">قیمت واحد · تومان</label><input id="price-${key}" name="unitPrice" inputmode="numeric" required aria-label="قیمت واحد به تومان" value="${esc(item.unitPrice??'')}"></div><button class="icon-button" type="button" data-action="remove-item" aria-label="حذف قلم">${icon('x')}</button></div>`;}
function openEditor(){
 state.draftKey=crypto.randomUUID();
 $('#editor-content').innerHTML=`<div class="editor-layout"><section class="source-pane"><div class="section-caption"><span class="step-number">۱</span><h3>متن گفتگو را وارد کنید</h3></div><p>فقط بخش مربوط به این سفارش را کپی کنید.</p><label class="field"><span class="field-hint">متن اصلی گفتگو</span><textarea id="source-text" maxlength="12000" placeholder="نام: سارا احمدی&#10;دو تا صابون جو دوسر می‌خوام…&#10;موبایل: ۰۹۱۲…&#10;آدرس: تهران…"></textarea></label><button class="button" id="extract-button" type="button">${icon('spark')}ساخت پیش‌نویس سفارش</button><button class="example-link" type="button" data-action="example">یک متن نمونه امتحان کنید</button><p class="source-help">استخراج اولیه با قواعد محلی انجام می‌شود و ممکن است ناقص باشد. هیچ واریزی خودکار تأیید نمی‌شود.</p><div id="extract-error" class="form-error" role="alert"></div><div id="extraction-warnings" hidden></div></section><section class="review-pane"><div class="section-caption"><span class="step-number">۲</span><h3>کارت را بررسی و تأیید کنید</h3></div><form id="order-form"><div class="form-grid"><div class="field"><label for="customer-name">نام مشتری <span class="muted">*</span></label><input id="customer-name" name="customerName" required maxlength="120" autocomplete="name" placeholder="نام و نام خانوادگی"></div><div class="field"><label for="customer-phone">موبایل مشتری</label><input id="customer-phone" name="phone" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="09…"></div><div class="field"><label for="customer-handle">شناسهٔ پیج</label><input id="customer-handle" name="handle" dir="ltr" placeholder="@username" maxlength="120"></div><div class="field"><label for="order-date">موعد ارسال</label><input id="order-date" name="dueDate" type="date"><span class="field-hint">انتخابگر تاریخ دستگاه؛ نمایش فهرست شمسی است.</span></div><div class="field full"><label for="customer-address">نشانی ارسال</label><textarea id="customer-address" name="address" rows="2" maxlength="2000" placeholder="شهر، نشانی کامل و کد پستی"></textarea><div id="history-hint"></div></div></div><div class="item-section"><div class="item-header"><h3>اقلام سفارش</h3><button class="text-button" type="button" data-action="add-item">${icon('plus')}افزودن قلم</button></div><datalist id="catalog">${state.products.map(p=>`<option value="${esc(p.name)}"></option>`).join('')}</datalist><div id="item-rows">${itemRow()}</div><div class="form-total"><span>جمع اقلام</span><strong id="draft-total">۰ تومان</strong></div></div><div class="field"><label for="order-notes">یادداشت سفارش</label><input id="order-notes" name="notes" placeholder="نکتهٔ خاص یا هماهنگی با مشتری" maxlength="4000"></div><label class="checkbox"><input type="checkbox" name="receiptReported">مشتری اعلام کرده واریز کرده یا فیش فرستاده است؛ هنوز بررسی نکرده‌ام.</label><label class="checkbox"><input type="checkbox" name="reviewed" required>اطلاعات این کارت و قیمت‌ها را بررسی کرده‌ام.</label><div id="order-error" class="form-error" role="alert"></div><div class="editor-bottom"><p>اطلاعات ناقص هم قابل ثبت است؛ برای تکمیل آن‌ها یادآوری می‌بینید.</p><button class="button" type="submit">${icon('check')}تأیید و ثبت سفارش</button></div></form></section></div>`;
 setupAgentUI({api,send,icon,esc,state,itemRow,toast,historyHint,updateTotal});
 $('#extract-button').insertAdjacentHTML('beforebegin',imageInputMarkup('order'));
 bindImageInput({send,target:$('#source-text')});
 $('#editor').showModal();setTimeout(()=>$('#source-text').focus(),30);
}
function updateTotal(){const total=$$('#item-rows .item-row').reduce((sum,row)=>sum+(Number(digits($('[name=quantity]',row).value))||0)*(Number(digits($('[name=unitPrice]',row).value))||0),0);$('#draft-total').textContent=`${fa(total)} تومان`;}
async function extractDraft(){
 const button=$('#extract-button');button.disabled=true;button.textContent='در حال ساخت پیش‌نویس…';$('#extract-error').textContent='';
 try{
  const data=await send('/api/extract',{text:$('#source-text').value});
  for(const key of ['customerName','phone','handle','address','dueDate'])$('#order-form').elements[key].value=data[key]||'';
  $('#order-form').elements.receiptReported.checked=data.receiptReported;
  $('#order-form').elements.reviewed.checked=false;
  $('#item-rows').innerHTML=(data.items.length?data.items:[{}]).map(itemRow).join('');
  const warnings=$('#extraction-warnings');warnings.hidden=!data.warnings.length;warnings.className='warnings';warnings.innerHTML=`<ul>${data.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`;
  updateTotal();historyHint();toast('پیش‌نویس آماده است؛ اطلاعات را بررسی کنید.');
 }catch(error){$('#extract-error').textContent=error.message;}
 finally{button.disabled=false;button.innerHTML=icon('document')+'استخراج ساده بدون مدل';}
}
function historyHint(){
 let value=digits($('#customer-phone').value).replace(/[\s-]/g,'').replace(/^\+98/,'0');
 const customer=state.customers.find(c=>c.phone===value);
 $('#history-hint').innerHTML=customer?`<button class="history-link" type="button" data-use-customer="${customer.id}">سابقهٔ ${esc(customer.name)} پیدا شد · ${fa(customer.order_count)} سفارش<br>برای استفاده از نشانی آخرین سفارش، اینجا بزنید و آن را بررسی کنید.</button>`:'';
}
async function saveDraft(event){
 event.preventDefault();const form=event.target,button=$('[type=submit]',form);button.disabled=true;$('#order-error').textContent='';
 const formData=Object.fromEntries(new FormData(form));
 const items=$$('#item-rows .item-row').map(row=>({productName:$('[name=productName]',row).value,quantity:digits($('[name=quantity]',row).value),unitPrice:digits($('[name=unitPrice]',row).value)}));
 try{
  if(form.dataset.inboxMessageId&&form.dataset.inboxSource!==$('#source-text').value.trim())throw new Error('متن پیام تغییر کرده؛ از صندوق پیام‌ها متن جدید را دوباره بررسی و تأیید کنید.');
  const order=await send('/api/orders',{...formData,sourceText:$('#source-text').value.trim(),items,receiptReported:form.elements.receiptReported.checked,requestKey:state.draftKey,agentRunId:form.dataset.agentRunId||null,agentReviewed:form.elements.reviewed.checked,inboxMessageId:form.dataset.inboxMessageId||null,inboxVersion:Number(form.dataset.inboxVersion),inboxReviewed:form.elements.reviewed.checked});
  $('#editor').close();await refresh();render();location.hash=`orders/${order.id}`;toast('سفارش ثبت شد؛ قدم بعدی را ببینید.');
 }catch(error){$('#order-error').textContent=error.message;$('#order-error').scrollIntoView({block:'nearest'});}
 finally{button.disabled=false;}
}
function renderDetail(order){
 state.detail=order;
 const payment={unconfirmed:'هنوز بررسی نشده',receipt_reported:'اعلام پرداخت مشتری؛ بررسی نشده',confirmed:'تأییدشده توسط فروشنده'};
 const missing=[!order.phone?'موبایل':null,!order.address?'آدرس':null,!order.due_date?'موعد ارسال':null,order.items.some(i=>!Number(i.unitPrice))?'قیمت':null].filter(Boolean);
 let controls='';
 if(!['cancelled','delivered'].includes(order.status)&&order.payment_status!=='confirmed')controls+=`<label class="checkbox"><input id="payment-reviewed" type="checkbox">واریز را در حساب بانکی بررسی کرده‌ام و مبلغ درست است.</label><button class="button" data-action="confirm-payment" disabled>${icon('check')}تأیید واریز توسط من</button>`;
 if(order.status==='needs_info')controls+=`<button class="button secondary" data-action="show-edit">${icon('edit')}تکمیل اطلاعات سفارش</button>`;
 if(order.status==='awaiting_payment'&&order.payment_status==='confirmed')controls+=`<button class="button" data-next-status="preparing">${icon('box')}شروع آماده‌سازی</button>`;
 if(order.status==='preparing')controls+=`<button class="button" data-next-status="ready_to_ship">${icon('check')}آمادهٔ ارسال است</button>`;
 if(order.status==='ready_to_ship')controls+=`<div class="field"><label for="tracking-input">کد رهگیری یا شناسهٔ تحویل به پیک</label><input id="tracking-input" dir="ltr" maxlength="120" placeholder="شناسه را بعد از ارسال وارد کنید"></div><button class="button" data-next-status="shipped">${icon('truck')}ثبت ارسال و کد رهگیری</button>`;
 if(order.status==='shipped')controls+=`<button class="button" data-next-status="delivered">${icon('check')}تحویل مشتری شد</button>`;
 const reply=order.tracking_code?`سلام ${order.customer_name} عزیز، سفارش شمارهٔ ${fa(order.number)} ارسال شده است.\nکد رهگیری: ${order.tracking_code}\nممنون از همراهی شما.`:'';
 $('#detail-content').innerHTML=`<div class="modal-header"><div><span class="eyebrow">سفارش #${fa(order.number)} ${order.is_sample?'· نمونه':''}</span><h2>${esc(order.customer_name)}</h2><p class="detail-subtitle">${badge(order)}</p></div><button class="icon-button" data-close="detail" aria-label="بستن جزئیات سفارش">${icon('x')}</button></div><div class="drawer-body"><div class="detail-action"><strong>${esc(order.action.label)}</strong><p>${missing.length?'اطلاعات موردنیاز: '+missing.join('، '):order.action.urgency==='overdue'?'موعد توافق‌شده گذشته است؛ وضعیت سفارش را بررسی کنید.':'اطلاعات را بررسی کنید و مرحلهٔ بعد را ثبت کنید.'}</p></div><dl class="detail-meta"><div><dt>شمارهٔ موبایل</dt><dd class="ltr">${esc(order.phone||'ثبت نشده')}</dd></div><div><dt>موعد ارسال</dt><dd>${dateLabel(order.due_date)}</dd></div><div><dt>وضعیت پرداخت</dt><dd>${payment[order.payment_status]}</dd></div><div><dt>شناسهٔ پیج</dt><dd class="ltr">${esc(order.handle||'ثبت نشده')}</dd></div><div class="full"><dt>نشانی همین سفارش</dt><dd>${esc(order.address||'هنوز ثبت نشده')}</dd></div>${order.notes?`<div class="full"><dt>یادداشت</dt><dd>${esc(order.notes)}</dd></div>`:''}</dl><table class="detail-items"><thead><tr><th>محصول</th><th>تعداد</th><th>مبلغ · تومان</th></tr></thead><tbody>${order.items.map(i=>`<tr><td>${esc(i.productName)}</td><td>${fa(i.quantity)}</td><td>${fa(Number(i.unitPrice)*i.quantity)}</td></tr>`).join('')}</tbody></table><div class="form-total"><span>جمع اقلام سفارش</span><strong>${amount(order.total)}</strong></div><p class="field-hint">هزینهٔ ارسال در این مبلغ لحاظ نشده است.</p><div class="detail-controls">${controls}<div id="detail-error" class="form-error" role="alert"></div></div>${reply?`<section class="detail-section"><h3>پیام آمادهٔ اطلاع‌رسانی</h3><div class="reply-text" id="reply-text">${esc(reply)}</div><button class="button secondary small" data-action="copy-reply">${icon('copy')}کپی پیام برای مشتری</button><p class="field-hint" style="margin-top:8px">این پیام خودکار ارسال نمی‌شود.</p></section>`:''}<section id="edit-section" class="detail-section" hidden><h3>ویرایش اطلاعات همین سفارش</h3><form id="edit-order-form" class="edit-grid"><div class="field"><label for="edit-phone">موبایل</label><input id="edit-phone" name="phone" inputmode="tel" dir="ltr" value="${esc(order.phone||'')}"></div><div class="field"><label for="edit-address">نشانی</label><textarea id="edit-address" name="address" rows="2">${esc(order.address||'')}</textarea></div><div class="field"><label for="edit-date">موعد ارسال</label><input id="edit-date" name="dueDate" type="date" value="${esc(order.due_date||'')}"></div>${order.items.map(i=>`<div class="field"><label>${esc(i.productName)} · قیمت واحد به تومان</label><input data-item-price="${i.id}" inputmode="numeric" value="${esc(i.unitPrice)}"></div>`).join('')}<div class="field"><label for="edit-notes">یادداشت</label><input id="edit-notes" name="notes" value="${esc(order.notes)}"></div><button class="button" type="submit">ذخیرهٔ تغییرات</button><div id="edit-error" class="form-error" role="alert"></div></form></section><section class="detail-section"><h3>تاریخچهٔ سفارش</h3><ul class="timeline">${order.events.map(e=>`<li>${esc(e.description)}<small>${timeLabel(e.created_at)}</small></li>`).join('')}</ul></section><section class="detail-section"><details><summary class="details-summary">متن اصلی ثبت سفارش</summary><div class="source-text">${esc(order.source_text||'این سفارش به‌صورت دستی ثبت شده است.')}</div></details></section><div class="detail-section" style="display:flex;justify-content:space-between"><button class="subtle-button" data-action="reorder" data-reorder="${order.id}">${icon("document")}سفارش مجدد</button>${!['shipped','delivered','cancelled'].includes(order.status)?`<button class="subtle-button" data-action="show-edit">${icon('edit')}ویرایش اطلاعات</button><button class="subtle-button" data-action="cancel-order">لغو سفارش</button>`:''}<button class="subtle-button" data-customer="${order.customer_id}">سابقهٔ مشتری</button></div><div id="cancel-section" class="notice" hidden><p>این سفارش لغو شود؟ اطلاعات و سابقهٔ آن باقی می‌ماند. اگر وجهی دریافت شده، بازگشت وجه را جداگانه پیگیری کنید.</p><button class="button danger small" data-next-status="cancelled" style="margin-top:10px">بله، سفارش لغو شود</button></div></div>`;
}
async function openOrder(id){
 const dialog=$('#detail');if(!dialog.open)dialog.showModal();$('#detail-content').innerHTML='<div class="loading"><span class="spinner"></span>دریافت سفارش…</div>';
 try{renderDetail(await api(`/api/orders/${id}`));}catch(error){$('#detail-content').innerHTML=`<div class="modal-header"><h2>سفارش باز نشد</h2><button class="icon-button" data-close="detail" aria-label="بستن">${icon('x')}</button></div><div class="drawer-body"><p class="form-error">${esc(error.message)}</p></div>`;}
}
async function mutateDetail(data,errorId='detail-error'){
 const order=state.detail;if(!order)return;
 const errorBox=$('#'+errorId);if(errorBox)errorBox.textContent='';
 const buttons=$$('button', $('#detail-content'));buttons.forEach(b=>b.disabled=true);
 try{
  const updated=await send(`/api/orders/${order.id}`,{...data,version:order.version},'PATCH');
  await refresh();render();renderDetail(updated);toast('تغییرات سفارش ذخیره شد.');
 }catch(error){if(errorBox)errorBox.textContent=error.message;toast(error.message);}
 finally{buttons.forEach(b=>b.disabled=false);}
}
async function openCustomer(id){
 const dialog=$('#detail');if(!dialog.open)dialog.showModal();$('#detail-content').innerHTML='<div class="loading"><span class="spinner"></span>دریافت سابقه…</div>';
 try{
  const {customer,orders}=await api(`/api/customers/${id}`);state.detail=null;
  $('#detail-content').innerHTML=`<div class="modal-header"><div><span class="eyebrow">سابقهٔ مشتری</span><h2>${esc(customer.name)}</h2></div><button class="icon-button" data-close="detail" aria-label="بستن سابقه">${icon('x')}</button></div><div class="drawer-body"><p class="muted ltr">${esc(customer.phone||'بدون شمارهٔ ثبت‌شده')}</p><p class="subtitle">${fa(orders.length)} سفارش ثبت‌شده؛ هر سفارش با اطلاعات و قیمت زمان ثبت خودش.</p><div style="margin-top:20px">${orders.map(o=>`<button class="customer-card" style="width:100%;margin-bottom:12px" data-order="${o.id}"><div style="display:flex;justify-content:space-between"><strong>سفارش #${fa(o.number)}</strong>${badge(o)}</div><p class="subtitle">${o.items.map(i=>`${fa(i.quantity)} عدد ${esc(i.productName)}`).join('، ')}</p><p style="margin-top:9px;color:var(--teal)">${amount(o.total)}</p></button>`).join('')}</div><div class="notice">آدرس سفارش قبلی را قبل از استفادهٔ دوباره از مشتری تأیید بگیرید.</div></div>`;
 }catch(error){$('#detail-content').innerHTML=`<div class="drawer-body"><p class="form-error">${esc(error.message)}</p><button class="button secondary" data-close="detail">بستن</button></div>`;}
}
async function route(){
 const [routePath,query='']=location.hash.slice(1).split('?'),[view,id]=routePath.split('/');state.view=['orders','customers','products','inbox','settings'].includes(view)?view:'today';if(state.view==='orders'){const filter=new URLSearchParams(query).get('filter');state.filter=['all','open','payment','overdue',...Object.keys(names)].includes(filter)?filter:'all';state.query='';}render();
 if(id&&/^[\da-f-]{36}$/i.test(id)){if(state.view==='orders')await openOrder(id);else if(state.view==='customers')await openCustomer(id);}else if($('#detail').open)$('#detail').close();
}
document.addEventListener('click',async event=>{
 const close=event.target.closest('[data-close]');if(close){$('#'+close.dataset.close).close();return;}
 if(event.target.closest('[data-pick]'))return;
 const orderLink=event.target.closest('[data-order]');if(orderLink){const id=orderLink.dataset.order;if(location.hash===`#orders/${id}`)await openOrder(id);else location.hash=`orders/${id}`;return;}
 const customerLink=event.target.closest('[data-customer]');if(customerLink){location.hash=`customers/${customerLink.dataset.customer}`;return;}
 const tab=event.target.closest('[data-tab]');if(tab){state.tab=tab.dataset.tab;render();return;}
 const status=event.target.closest('[data-next-status]');if(status){await mutateDetail({operation:'status',status:status.dataset.nextStatus,trackingCode:$('#tracking-input')?.value});return;}
 const editProduct=event.target.closest('[data-edit-product]');if(editProduct){const p=state.products.find(p=>p.id===editProduct.dataset.editProduct);$('#product-name').value=p.name;$('#product-price').value=p.price;$('#product-form').scrollIntoView({behavior:'smooth',block:'center'});$('#product-price').focus();return;}
 const reuse=event.target.closest('[data-use-customer]');if(reuse){
  const orders=state.orders.filter(o=>o.customer_id===reuse.dataset.useCustomer&&o.address);const previous=orders[0];
  if(previous){$('#customer-address').value=previous.address;toast('نشانی قبلی وارد شد؛ درستی آن را از مشتری تأیید بگیرید.');}else toast('نشانی قبلی ثبت نشده است.');return;
 }
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='new')openEditor();
 if(action==='help')$('#help').showModal();
 if(action==='example'){$('#source-text').value='نام: سارا احمدی\nدو تا صابون جو دوسر می‌خوام.\nموبایل: ۰۹۱۲۰۰۰۰۰۰۱\nآدرس: تهران، نشانی نمونه برای نمایش\nپول رو فرستادم؛ فردا می‌فرستید؟';$('#source-text').focus();}
 if(action==='add-item'){$('#item-rows').insertAdjacentHTML('beforeend',itemRow());$$('#item-rows .item-row').at(-1).querySelector('input').focus();}
 if(action==='remove-item'){if($$('#item-rows .item-row').length>1){event.target.closest('.item-row').remove();updateTotal();}else toast('هر سفارش باید حداقل یک قلم داشته باشد.');}
 if(action==='confirm-payment')await mutateDetail({operation:'confirm_payment'});
 if(action==='reorder'){try{const draft=await api(`/api/orders/${event.target.closest('[data-reorder]').dataset.reorder}/reorder`);prefillReorder(draft);}catch(error){toast(error.message);}}
 if(action==='show-edit'){$('#edit-section').hidden=false;$('#edit-section').scrollIntoView({behavior:'smooth',block:'start'});}
 if(action==='cancel-order'){$('#cancel-section').hidden=false;$('#cancel-section').scrollIntoView({block:'nearest'});}
 if(action==='copy-reply'){try{await navigator.clipboard.writeText($('#reply-text').textContent);toast('پیام کپی شد؛ می‌توانید برای مشتری بفرستید.');}catch{toast('کپی خودکار ممکن نشد؛ متن پیام را انتخاب و کپی کنید.');}}
 if(event.target.closest('#extract-button'))await extractDraft();
});
document.addEventListener('keydown',event=>{const row=event.target.closest('.order-row');if(row&&(event.key==='Enter'||event.key===' ')){event.preventDefault();location.hash=`orders/${row.dataset.order}`;}});
document.addEventListener('input',event=>{
 if(event.target.id==='order-search'){state.query=event.target.value;$('#order-rows').innerHTML=rows(filteredOrders());}
 if(event.target.closest('#item-rows'))updateTotal();
 if(event.target.id==='customer-phone')historyHint();
});
document.addEventListener('change',event=>{
 if(event.target.classList?.contains('row-pick')){const id=event.target.dataset.pick;if(event.target.checked)state.picked.add(id);else state.picked.delete(id);bulkBar();return;}
 if(event.target.id==='order-filter'){state.filter=event.target.value;$('#order-rows').innerHTML=rows(filteredOrders());}
 if(event.target.id==='payment-reviewed')$('[data-action=confirm-payment]').disabled=!event.target.checked;
 if(event.target.name==='productName'){
  const product=state.products.find(p=>p.name===event.target.value);if(product){$('[name=unitPrice]',event.target.closest('.item-row')).value=product.price;updateTotal();}
 }
});
document.addEventListener('submit',async event=>{
 if(event.target.id==='order-form')return saveDraft(event);
 if(event.target.id==='edit-order-form'){event.preventDefault();const data=Object.fromEntries(new FormData(event.target));await mutateDetail({operation:'edit',...data,phone:digits(data.phone),prices:$$('[data-item-price]',event.target).map(input=>({id:input.dataset.itemPrice,unitPrice:digits(input.value)}))},'edit-error');}
 if(event.target.id==='product-form'){
  event.preventDefault();const form=event.target,button=$('[type=submit]',form);button.disabled=true;$('#product-error').textContent='';
  try{await send('/api/products',{name:form.elements.name.value,price:Number(digits(form.elements.price.value))});await refresh();render();toast('محصول ذخیره شد.');}
  catch(error){$('#product-error').textContent=error.message;}finally{button.disabled=false;}
 }
});
$('#detail').addEventListener('close',()=>{if(location.hash.includes('/'))history.replaceState(null,'',`#${state.view}`);state.detail=null;});
window.addEventListener('hashchange',route);
window.addEventListener('offline',()=>{$('#offline').hidden=false;});
window.addEventListener('online',async()=>{$('#offline').hidden=true;try{await refresh();render();toast('ارتباط دوباره برقرار شد.');}catch{toast('سرور هنوز در دسترس نیست.');}});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.installPrompt=event;$('#install-button').hidden=false;});
$('#install-button').addEventListener('click',async()=>{await state.installPrompt?.prompt();state.installPrompt=null;$('#install-button').hidden=true;});
icons();
try{await refresh();await route();}catch(error){$('#connection').classList.add('failed');$('#connection').innerHTML='<i></i>ارتباط برقرار نیست';$('#main').innerHTML=`${heading('اتصال به میز کار برقرار نشد','اطلاعات شما حذف نشده؛ سرور و پایگاه داده را بررسی کنید.',false)}<div class="panel empty"><p>${esc(error.message)}</p><button class="button" id="retry">${icon('refresh')}تلاش دوباره</button></div>`;$('#retry').addEventListener('click',()=>location.reload());}
