import {digits, text} from './domain.mjs';
// Deliberately conservative local parsing: uncertain fields stay empty, and payment is never confirmed.
export function extract(source,catalog=[]) {
  const original=text(source,16000), normalized=digits(original).replace(/ي/g,'ی').replace(/ك/g,'ک');
  const evidence={};
  const result={customerName:'',phone:'',handle:'',address:'',dueDate:'',items:[],receiptReported:false,evidence,warnings:[],engine:'local_rules'};
  const field=(pattern,key)=>{const match=normalized.match(pattern);if(match){result[key]=match[1].trim();evidence[key]=match[0];}};
  field(/(?:نام(?: مشتری)?|مشتری)\s*[:：]\s*([^\n]+)/,'customerName');
  field(/(?:^|\s)((?:\+98|0098|0)9[\d\s-]{9,16})(?=\s|$|[،,])/,'phone');
  if(result.phone) result.phone=result.phone.replace(/[\s-]/g,'');
  field(/(@[a-zA-Z0-9_.]+)/,'handle');
  field(/(?:آدرس|نشانی)\s*[:：]\s*([^\n]+)/,'address');
  if(/هم[او]ن (?:آدرس|قبلی)|آدرس(?:م|ش)?\s*[:：]?\s*هم[او]ن/.test(normalized)) {result.address='';result.warnings.push('آدرس قبلی به‌صورت خودکار انتخاب نمی‌شود؛ آن را از سابقه بررسی کنید.');}
  result.receiptReported=/(?:واریز کردم|واریز شد|پول(?: رو| را)? (?:فرستادم|ریختم)|فیش (?:فرستادم|واریز)|عکس فیش)/.test(normalized)&&!/(?:واریز نکردم|واریز نشده|پول نریختم|فیش نفرستادم)/.test(normalized);
  const quantityWords={'یک':1,'یه':1,'دو':2,'سه':3,'چهار':4,'پنج':5,'شش':6,'هفت':7,'هشت':8,'نه':9,'ده':10};
  for(const product of catalog) {
    const label=product.name.replace(/ي/g,'ی').replace(/ك/g,'ک');
    const position=normalized.indexOf(label);
    if(position<0) continue;
    const prefix=normalized.slice(Math.max(0,position-20),position);
    const match=prefix.match(/(\d{1,3}|یک|یه|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)\s*(?:تا|عدد|بسته)?\s*$/);
    const quantity=match?(quantityWords[match[1]]||Number(match[1])):1;
    result.items.push({productName:product.name,quantity,unitPrice:Number(product.price),evidence:normalized.slice(Math.max(0,position-12),position+label.length),priceSource:'catalog'});
    if(!match) result.warnings.push(`تعداد «${product.name}» مشخص نبود؛ مقدار ۱ پیشنهادی است و باید بررسی شود.`);
  }
  if(!result.items.length) result.warnings.push('کالا از فهرست محصولات شناسایی نشد؛ نام و قیمت را وارد کنید.');
  if(result.items.length) result.warnings.push('قیمت از فهرست محصولات خوانده شده است؛ تخفیف یا تغییر قیمت را بررسی کنید.');
  if(result.receiptReported) result.warnings.push('مشتری اعلام پرداخت کرده است؛ تأیید بانکی انجام نشده است.');
  if(/فردا|امروز|پس.?فردا|هفته|تحویل|ارسال/.test(normalized)) result.warnings.push('موعد ارسال را خودتان مشخص کنید؛ تاریخ از متن حدس زده نمی‌شود.');
  return result;
}
