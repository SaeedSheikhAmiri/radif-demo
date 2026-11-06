// Public demo only. No network, model server, real customer data or PostgreSQL.
import {extract} from './extract.mjs';
import {validateOrder,phone,nextAction,allowedTransition} from './domain.mjs';
const key='radif-public-demo-v1',id=()=>crypto.randomUUID();
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const day=offset=>new Date(Date.parse(today()+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);
function seed(){
 const products=[['صابون جو دوسر',120000],['صابون زغال',120000],['شامپو بار رزماری',150000],['ست سه‌تایی صابون',320000]].map(([name,price])=>({id:id(),name,price,active:true}));
 const customers=Array.from({length:6},(_,i)=>({id:id(),name:['سارا نمونه','مریم نمونه','نگار نمونه','آرزو نمونه','نیلوفر نمونه','بهاره نمونه'][i],phone:'0912000000'+(i+1),address:'تهران، نشانی ساختگی برای نمایش',handle:null}));
 const states=['awaiting_payment','preparing','ready_to_ship','needs_info','shipped','delivered','preparing'];
 const orders=states.map((status,i)=>{const c=customers[i===5?1:i===6?5:i],p=products[i%4],stamp=new Date().toISOString();return {id:id(),number:1001+i,customer_id:c.id,customer_name:c.name,phone:c.phone,handle:null,address:status==='needs_info'?null:c.address,due_date:day([0,0,-1,1,-2,-12,2][i]),status,payment_status:i===0?'receipt_reported':status==='needs_info'?'unconfirmed':'confirmed',payment_confirmed_at:null,tracking_code:['shipped','delivered'].includes(status)?'DEMO-123456':null,version:1,is_sample:true,request_key:id(),source_text:'اطلاعات کاملاً ساختگی برای دموی عمومی',notes:'',created_at:stamp,updated_at:stamp,items:[{id:id(),productName:p.name,quantity:2,unitPrice:p.price}],events:[{type:'sample_created',description:'سفارش ساختگی دمو',created_at:stamp}]};});
 return {products,customers,orders};
}
const demoLabels={order:'درخواست سفارش',payment:'اعلام پرداخت',tracking:'پیگیری و رهگیری',repeat:'خرید مجدد',complaint:'تأخیر یا نارضایتی',question:'پرسش دربارهٔ محصول',other:'نیازمند بررسی'};
// Same idea as the private rules triage, duplicated here because the real
// module imports the database-backed agent and cannot run in a static demo.
function demoTriage(body){
 const rules={order:/سفارش (?:بدم|بدهم|ثبت|جدید)|خرید (?:کنم|دارم)|عدد|تا /,payment:/واریز|فیش|پول|پرداخت/,tracking:/رهگیری|بسته|کی می.?رس|نرسیده|ارسال/,repeat:/قبلی|دوباره|همیشگی|همون|خرید مجدد/,complaint:/نرسیده|ناراضی|شکایت|تأخیر|جواب نمی|گم شده/,question:/قیمت|موجود|چنده/};
 const labels=Object.keys(rules).filter(name=>rules[name].test(body));
 if(!labels.length)labels.push('other');
 const priority=labels.includes('complaint')?'urgent':labels.includes('payment')||labels.includes('tracking')?'attention':'normal';
 const actions={order:'ثبت سفارش از همین متن',payment:'بررسی واریز و تأیید دستی',tracking:'بررسی وضعیت ارسال و کد رهگیری',repeat:'بررسی خرید قبلی همین مشتری',complaint:'پاسخ فوری و پیگیری',question:'پاسخ به پرسش محصول',other:'بررسی پیام'};
 return {labels,priority,evidence:[body.slice(0,160)],suggested_action:actions[labels[0]]||'بررسی پیام',engine:'rules'};
}
function seedInbox(){
 const stamp=new Date().toISOString();
 return [
  {id:id(),source:'instagram',external_id:'demo-message-1',sender_id:'demo-sender',body:'سلام، پول رو واریز کردم؛ لطفاً سفارشم رو پیگیری کنید و کد رهگیری بدید.',labels:['payment','tracking'],priority:'urgent',evidence:['سلام، پول رو واریز کردم؛ لطفاً سفارشم رو پیگیری کنید و کد رهگیری بدید.'],suggested_action:'بررسی واریز و تأیید دستی',triage_status:'completed',triage_engine:'rules',triage_error:null,reviewed:false,order_id:null,version:1,created_at:stamp,updated_at:stamp},
  {id:id(),source:'manual',external_id:null,sender_id:null,body:'همون صابون زغال قبلی رو دوباره می‌خوام. لطفاً کد رهگیری هم بدید.',labels:['repeat','order','tracking'],priority:'normal',evidence:['همون صابون زغال قبلی رو دوباره می‌خوام. لطفاً کد رهگیری هم بدید.'],suggested_action:'بررسی خرید قبلی همین مشتری',triage_status:'completed',triage_engine:'rules',triage_error:null,reviewed:false,order_id:null,version:1,created_at:stamp,updated_at:stamp},
 ];
}
let data;try{data=JSON.parse(sessionStorage.getItem(key));}catch{}if(!data?.orders)data=seed();if(!Array.isArray(data.inbox))data.inbox=seedInbox();
const demoAutomationLabels={autoDraftFromMessage:'اجرای خودکار دستیار وقتی پیام را باز می‌کنی',autoLinkMessage:'اتصال خودکار پیام به تنها سفارش باز همان شماره',suggestReply:'پیشنهاد پاسخ آماده برای پرسش قیمت و پیگیری',autoReorder:'دکمهٔ سفارش مجدد از سابقهٔ مشتری',reminders:'یادآور سفارش‌های عقب‌افتاده',dailyBriefing:'خلاصهٔ روز در صفحهٔ امروز',mergeDuplicates:'هشدار مشتری تکراری با شمارهٔ یکسان'};
const demoAutomationDefaults={autoDraftFromMessage:true,autoLinkMessage:false,suggestReply:true,autoReorder:true,reminders:true,reminderDays:2,dailyBriefing:true,mergeDuplicates:true,retentionDays:0};
if(!data.settings)data.settings={...demoAutomationDefaults};
const runs=new Map();
const persist=()=>{try{sessionStorage.setItem(key,JSON.stringify(data));}catch{}};
function view(order){return {...order,total:String(order.items.reduce((s,i)=>s+i.quantity*i.unitPrice,0)),action:nextAction(order,today())};}
function customers(){return data.customers.map(c=>{const orders=data.orders.filter(o=>o.customer_id===c.id);return {...c,order_count:orders.length,delivered_count:orders.filter(o=>o.status==='delivered').length,confirmed_order_value:String(orders.filter(o=>o.payment_status==='confirmed'&&o.status!=='cancelled').reduce((s,o)=>s+Number(view(o).total),0))};});}
function event(order,description){order.events.unshift({type:'demo_update',description,created_at:new Date().toISOString()});order.version++;order.updated_at=new Date().toISOString();}
function simulation(text,customerId){
 const draft=extract(text,data.products),c=data.customers.find(c=>customerId?c.id===customerId:c.phone===phone(draft.phone));
 if(c){draft.customerName=c.name;draft.phone=c.phone;}
 const history=data.orders.filter(o=>o.customer_id===c?.id),previous=history.find(o=>o.address),fulfilled=history.filter(o=>['shipped','delivered'].includes(o.status));
 const missing=[!draft.customerName?'نام':null,!draft.phone?'موبایل':null,!draft.address?'آدرس':null,!draft.dueDate?'موعد ارسال':null,!draft.items.length?'محصول':null].filter(Boolean);
 const customerQuestions=[!draft.address?'نشانی کامل ارسال را می‌فرستید؟':null,!draft.items.length?'کدام محصول و چند عدد می‌خواهید؟':null].filter(Boolean);
 return {...draft,engine:'demo_simulation',summary:'شبیه‌سازی نمایشی با قواعد ساده؛ مدل هوش مصنوعی اجرا نشده است.',warnings:['دموی عمومی: این نتیجه با قواعد ساده ساخته شده و نیازمند بررسی شماست.',...draft.warnings],missing,customerQuestions,sellerQuestions:!draft.dueDate?['موعد ارسال را با توجه به ظرفیت خود مشخص کنید.']:[],nextQuestion:customerQuestions[0]||'',previousAddress:previous?.address||null,historyOptions:fulfilled,requiresSellerApproval:true,trace:[{tool:'demo_catalog',label:'نمایش تطبیق با کاتالوگ نمونه',status:'done',detail:'شبیه‌سازی؛ بدون اجرای مدل'},{tool:'demo_history',label:'نمایش سابقهٔ نمونه',status:'done',detail:c?`${history.length} سفارش ساختگی`:'مشتری نمونه پیدا نشد'}]};
}
export async function demoApi(url,options={}){
 const method=options.method||'GET',input=options.body?JSON.parse(options.body):{},parts=url.split('/').filter(Boolean),recordId=parts[2];
 if(url==='/api/health')return {ok:true,mode:'public-demo',database:null};
 if(url==='/api/agent/status')return {available:true,enabled:true,provider:'demo_simulation'};
 if(url==='/api/agent/runs'&&method==='POST'){const duplicate=[...runs.values()].find(r=>r.requestKey===input.requestKey);if(duplicate)return duplicate;const run={id:id(),requestKey:input.requestKey,status:'completed',result:simulation(input.text,input.customerId),source:input.text};run.trace=run.result.trace;runs.set(run.id,run);return run;}
 if(url.startsWith('/api/agent/runs/')){const run=runs.get(parts[3]);if(!run)throw new Error('بررسی دمو پیدا نشد؛ دوباره امتحان کنید.');return run;}
 if(url==='/api/extract')return extract(input.text,data.products);
 if(url==='/api/products'){
  if(method==='POST'){if(!input.name?.trim()||!Number.isSafeInteger(input.price)||input.price<1)throw new Error('نام و قیمت معتبر وارد کنید.');let p=data.products.find(p=>p.name===input.name.trim());if(p)p.price=input.price;else{p={id:id(),name:input.name.trim(),price:input.price,active:true};data.products.push(p);}persist();return p;}
  return {products:structuredClone(data.products)};
 }
 if(url==='/api/customers')return {customers:customers()};
 if(parts[1]==='customers'){const c=customers().find(c=>c.id===recordId);if(!c)throw new Error('مشتری پیدا نشد.');return {customer:c,orders:data.orders.filter(o=>o.customer_id===c.id).map(view)};}
 if(url==='/api/orders'&&method==='GET')return {orders:data.orders.map(view),today:today()};
 if(url==='/api/orders'&&method==='POST'){
  const duplicate=data.orders.find(o=>o.request_key===input.requestKey);if(duplicate)return view(duplicate);
  const valid=validateOrder(input);if(input.agentRunId){const run=runs.get(input.agentRunId);if(!input.agentReviewed||!run||run.source!==input.sourceText)throw new Error('پیشنهاد دمو را دوباره بررسی و تأیید کنید.');}
  let c=valid.phone?data.customers.find(c=>c.phone===valid.phone):null;if(!c){c={id:id(),name:valid.name,phone:valid.phone,address:valid.address,handle:valid.handle};data.customers.push(c);}
  const stamp=new Date().toISOString(),order={id:id(),number:Math.max(1000,...data.orders.map(o=>o.number))+1,customer_id:c.id,customer_name:valid.name,phone:valid.phone,address:valid.address,handle:valid.handle,due_date:valid.dueDate,status:valid.missing.length?'needs_info':'awaiting_payment',payment_status:valid.receiptReported?'receipt_reported':'unconfirmed',payment_confirmed_at:null,tracking_code:null,version:1,is_sample:true,request_key:valid.requestKey,source_text:valid.sourceText,notes:valid.notes,created_at:stamp,updated_at:stamp,items:valid.items.map(i=>({...i,id:id()})),events:[{type:'demo_created',description:'ثبت آزمایشی در همین مرورگر',created_at:stamp}]};data.orders.unshift(order);persist();return view(order);
 }
 if(parts[1]==='orders'){
  const original=data.orders.find(o=>o.id===recordId);if(!original)throw new Error('سفارش پیدا نشد.');
  if(method==='GET')return structuredClone(view(original));
  const order=structuredClone(original);if(input.version!==order.version)throw new Error('اطلاعات تغییر کرده؛ سفارش را دوباره باز کنید.');
  if(input.operation==='confirm_payment'){if(['cancelled','delivered'].includes(order.status))throw new Error('این سفارش قابل تغییر نیست.');order.payment_status='confirmed';order.payment_confirmed_at=new Date().toISOString();event(order,'تأیید نمایشی پرداخت توسط بازدیدکننده؛ تراکنش بانکی واقعی نیست.');}
  else if(input.operation==='status'){allowedTransition(order,input.status,input.trackingCode);if(order.status==='needs_info'&&(!order.phone||!order.address||!order.due_date||order.items.some(i=>!i.unitPrice)))throw new Error('ابتدا اطلاعات سفارش را تکمیل کنید.');order.status=input.status;if(input.trackingCode)order.tracking_code=input.trackingCode.trim();event(order,'تغییر مرحلهٔ نمونه');}
  else if(input.operation==='edit'){
   if(['shipped','delivered','cancelled'].includes(order.status))throw new Error('ویرایش این مرحله مجاز نیست.');
   const items=order.items.map(i=>{const price=input.prices?.find(p=>p.id===i.id);if(order.payment_status==='confirmed'&&price&&Number(price.unitPrice)!==i.unitPrice)throw new Error('قیمت پس از تأیید پرداخت قابل تغییر نیست.');return {...i,unitPrice:price?price.unitPrice:i.unitPrice};});
   const v=validateOrder({customerName:order.customer_name,phone:input.phone,address:input.address,dueDate:input.dueDate,notes:input.notes,items,requestKey:order.request_key});order.phone=v.phone;order.address=v.address;order.due_date=v.dueDate;order.notes=v.notes;order.items=v.items.map((i,n)=>({...i,id:items[n].id}));if(order.status==='needs_info'&&!v.missing.length)order.status='awaiting_payment';event(order,'ویرایش اطلاعات نمونه');
  }else throw new Error('عملیات دمو پشتیبانی نمی‌شود.');
  Object.assign(original,order);persist();return view(original);
 }
 if(url==='/api/intake/status')return {ocr:{available:false,message:'خواندن عکس در دموی عمومی انجام نمی‌شود؛ متن را دستی وارد کنید.'},voice:{available:false,message:'تبدیل صدا در دموی عمومی نیست.'},instagram:{configured:false,message:'اتصال اینستاگرام در دموی عمومی شبیه‌سازی است و پیام واقعی دریافت نمی‌کند.',needs:['این دمو فقط برای بررسی رابط است']}};
 if(url==='/api/intake/image')throw new Error('خواندن عکس در دموی عمومی انجام نمی‌شود؛ متن گفتگو را دستی وارد کنید.');
 if(url==='/api/intake/voice')throw new Error('تبدیل صدا در دموی عمومی انجام نمی‌شود؛ متن گفتگو را دستی وارد کنید.');
 if(url==='/api/inbox'&&method==='GET')return {messages:[...data.inbox].sort((a,b)=>(a.priority==='urgent'?0:a.priority==='attention'?1:2)-(b.priority==='urgent'?0:b.priority==='attention'?1:2)),labels:demoLabels};
 if(url==='/api/inbox'&&method==='POST'){
  const body=String(input.text||'').trim();if(!body||body.length>12000)throw new Error('متن پیام باید بین ۱ تا ۱۲ هزار نویسه باشد.');
  const triage=demoTriage(body),row={id:id(),source:input.source==='image'?'image':'manual',external_id:null,sender_id:null,body,labels:triage.labels,priority:triage.priority,evidence:triage.evidence,suggested_action:triage.suggested_action,triage_status:'completed',triage_engine:'rules',triage_error:null,reviewed:false,order_id:null,version:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  data.inbox.unshift(row);persist();return row;
 }
 if(parts[1]==='inbox'){
  const row=data.inbox.find(m=>m.id===recordId);if(!row)throw new Error('پیام دمو پیدا نشد.');
  if(input.version!==row.version)throw new Error('پیام به‌روز شده است؛ فهرست را تازه کنید.');
  if(input.operation==='review'){
   const body=String(input.text||'').trim();if(!body)throw new Error('متن قابل بررسی نیست.');
   const triage=demoTriage(body);Object.assign(row,{body,reviewed:true,labels:triage.labels,priority:triage.priority,evidence:triage.evidence,suggested_action:triage.suggested_action,version:row.version+1,updated_at:new Date().toISOString()});persist();return structuredClone(row);
  }
  if(input.operation==='retry'){row.triage_status='completed';row.triage_error=null;row.version++;row.updated_at=new Date().toISOString();persist();return structuredClone(row);}
  throw new Error('عملیات پیام معتبر نیست.');
 }
 if(url==='/api/settings'){
  if(method==='PATCH'){data.settings={...data.settings,...input};persist();}
  return {settings:{...demoAutomationDefaults,...data.settings},defaults:demoAutomationDefaults,labels:demoAutomationLabels};
 }
 if(url==='/api/briefing'){
  const active=['awaiting_payment','preparing','ready_to_ship'],overdue=data.orders.filter(o=>active.includes(o.status)&&o.due_date&&o.due_date<today()).length;
  const awaiting=data.orders.filter(o=>o.status==='awaiting_payment').length,ready=data.orders.filter(o=>o.status==='ready_to_ship').length;
  const inbox=data.inbox.filter(m=>!m.order_id).length,parts=[];
  if(overdue)parts.push(`${overdue.toLocaleString('fa-IR')} سفارش از موعد گذشته`);
  if(awaiting)parts.push(`${awaiting.toLocaleString('fa-IR')} سفارش منتظر پرداخت`);
  if(ready)parts.push(`${ready.toLocaleString('fa-IR')} سفارش آمادهٔ ارسال`);
  if(inbox)parts.push(`${inbox.toLocaleString('fa-IR')} پیام بی‌سفارش در صندوق`);
  return {enabled:data.settings.dailyBriefing,overdue,awaiting,ready,inbox,text:parts.length?parts.join('، ')+'.':'همه‌چیز مرتب است؛ کاری پشت سر نمانده.'};
 }
 if(url==='/api/reminders'){
  const active=['awaiting_payment','preparing','ready_to_ship'];
  const list=data.orders.filter(o=>active.includes(o.status)&&o.due_date&&o.due_date<today()).map(o=>({id:o.id,number:o.number,status:o.status,customer_name:o.customer_name,due_date:o.due_date,label:'موعد ارسال گذشته',reason:'overdue'}));
  return {enabled:data.settings.reminders,days:data.settings.reminderDays,reminders:data.settings.reminders?list:[]};
 }
 if(url==='/api/customers/duplicates')return {enabled:data.settings.mergeDuplicates,duplicates:[]};
 if(parts[1]==='orders'&&parts[3]==='reorder'){
  const order=data.orders.find(o=>o.id===parts[2]);if(!order)throw new Error('سفارش پیدا نشد.');
  return {customerId:order.customer_id,customerName:order.customer_name,phone:order.phone,address:order.address||'',handle:order.handle||'',
   items:order.items.map(i=>{const product=data.products.find(p=>p.name===i.productName);return {productId:product?.id||null,name:i.productName,quantity:i.quantity,unitPrice:Number(product?.price??i.unitPrice)};})};
 }
 throw new Error('این بخش در دموی نمایشی موجود نیست.');
}
document.addEventListener('click',e=>{if(e.target.closest('[data-demo-reset]')&&confirm('اطلاعات همین دموی مرورگر به نمونه‌های اولیه برگردد؟')){sessionStorage.removeItem(key);location.hash='today';location.reload();}});
