export const statuses = {
  needs_info: 'اطلاعات ناقص', awaiting_payment: 'بررسی پرداخت', preparing: 'در حال آماده‌سازی',
  ready_to_ship: 'آمادهٔ ارسال', shipped: 'ارسال‌شده', delivered: 'تحویل‌شده', cancelled: 'لغوشده',
};
export class AppError extends Error { constructor(message, status=400) { super(message); this.status = status; } }
export function digits(value='') {
  return String(value).replace(/[۰-۹]/g, x=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/[٠-٩]/g, x=>'٠١٢٣٤٥٦٧٨٩'.indexOf(x));
}
export function text(value, max=1000) { return String(value ?? '').trim().slice(0,max); }
export function phone(value) {
  let result=digits(value).replace(/[\s()\-]/g,'');
  if(result.startsWith('+98')) result='0'+result.slice(3);
  if(result.startsWith('0098')) result='0'+result.slice(4);
  if(result && !/^09\d{9}$/.test(result)) throw new AppError('شمارهٔ موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.');
  return result || null;
}
export function validateOrder(input) {
  const name=text(input.customerName,120);
  if(!name) throw new AppError('نام مشتری را وارد کنید.');
  if(!Array.isArray(input.items)||!input.items.length||input.items.length>30) throw new AppError('حداقل یک قلم سفارش لازم است.');
  const items=input.items.map(item=>{
    const productName=text(item.productName,200), quantity=Number(digits(item.quantity)), unitPrice=Number(digits(item.unitPrice).replace(/[,٬]/g,''));
    if(!productName || !Number.isInteger(quantity)||quantity<1||quantity>999||!Number.isSafeInteger(unitPrice)||unitPrice<0||unitPrice>1e12) throw new AppError('نام کالا، تعداد صحیح و قیمت معتبر به تومان را وارد کنید.');
    return {productName,quantity,unitPrice};
  });
  if(!Number.isSafeInteger(items.reduce((sum,i)=>sum+i.quantity*i.unitPrice,0))) throw new AppError('جمع مبلغ سفارش بیش از حد مجاز است.');
  const dueDate=text(input.dueDate,10)||null;
  if(dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)||!Number.isFinite(Date.parse(dueDate))||new Date(dueDate).toISOString().slice(0,10)!==dueDate)) throw new AppError('تاریخ تحویل معتبر نیست.');
  if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(input.requestKey||'')) throw new AppError('شناسهٔ ثبت معتبر نیست. دوباره تلاش کنید.');
  const address=text(input.address,2000), customerPhone=phone(input.phone);
  const receiptReported=Boolean(input.receiptReported);
  const missing=[];
  if(!address) missing.push('آدرس');
  if(!customerPhone) missing.push('موبایل');
  if(!dueDate) missing.push('موعد ارسال');
  if(items.some(i=>!i.unitPrice)) missing.push('قیمت');
  return { name, phone:customerPhone, handle:text(input.handle,120)||null,address:address||null,dueDate,items,sourceText:text(input.sourceText,16000),notes:text(input.notes,4000),receiptReported,missing,requestKey:input.requestKey };
}
export function nextAction(order, today) {
  if(order.status==='cancelled'||order.status==='delivered') return {label:'نیازی به اقدام ندارد',urgency:'none'};
  if(order.status==='shipped') return {label:'بررسی تحویل بسته',urgency:'normal'};
  const late=order.due_date && String(order.due_date).slice(0,10)<today;
  let label = order.status==='needs_info'?'تکمیل اطلاعات سفارش':order.payment_status!=='confirmed'?'بررسی و تأیید واریز':order.status==='ready_to_ship'?'ارسال بسته و ثبت کد رهگیری':'آماده‌سازی سفارش';
  return {label,urgency:late?'overdue':order.due_date===today?'today':order.status==='needs_info'||order.payment_status!=='confirmed'?'attention':'normal'};
}
export function allowedTransition(order,status,trackingCode) {
  const transitions={needs_info:['awaiting_payment','cancelled'],awaiting_payment:['preparing','cancelled'],preparing:['ready_to_ship','cancelled'],ready_to_ship:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[]};
  if(!transitions[order.status]?.includes(status)) throw new AppError('این تغییر وضعیت برای سفارش مجاز نیست.');
  if(['preparing','ready_to_ship','shipped','delivered'].includes(status)&&order.payment_status!=='confirmed') throw new AppError('ابتدا واریز را بررسی و تأیید کنید.');
  if(status==='shipped'&&!text(trackingCode)) throw new AppError('کد رهگیری یا شناسهٔ تحویل به پیک را وارد کنید.');
}
