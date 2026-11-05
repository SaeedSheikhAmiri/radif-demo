// Agent suggestions are draft-only; this module has no order-save or payment-confirm capability.
export function setupAgentUI({api,send,icon,esc,state,itemRow,toast,historyHint,updateTotal}){
 const $=selector=>document.querySelector(selector),source=$('#source-text'),pane=source.closest('.source-pane');
 let lastRequest=null,lastResult=null,agentRunId=null,generation=0;
 const wrapper=document.createElement('div');wrapper.className='agent-tools';
 wrapper.innerHTML=`<div class="agent-intro"><span>${icon('spark')}شبیه‌سازی دستیار · بدون مدل</span><small id="agent-connection">آماده‌سازی شبیه‌ساز…</small></div><label for="agent-customer">مشتری را می‌شناسید؟ <small>اختیاری</small></label><select id="agent-customer"><option value="">شناسایی از شمارهٔ داخل گفتگو</option>${state.customers.map(c=>`<option value="${c.id}">${esc(c.name)}${c.phone?' · '+esc(c.phone):''}</option>`).join('')}</select><button type="button" class="button" id="agent-button" disabled>${icon('spark')}بررسی گفتگو و سابقه</button><p class="field-hint">نمونهٔ نمایشی از تطبیق کاتالوگ و سابقه؛ خروجی را بررسی کنید.</p><div id="agent-progress" aria-live="polite" hidden></div><div id="agent-result" hidden></div>`;
 $('#extract-button').before(wrapper);$('#extract-button').className='button secondary';$('#extract-button').innerHTML=icon('document')+'استخراج ساده بدون مدل';
 pane.querySelector('.source-help').textContent='این بخش صرفاً شبیه‌سازی با قواعد ساده است و مدل هوش مصنوعی اجرا نمی‌شود. سفارش یا پیامی خودکار ثبت و ارسال نمی‌شود. اگر مدل در دسترس نبود، استخراج ساده یا ورود دستی را انتخاب کنید.';
 const button=$('#agent-button'),connection=$('#agent-connection'),progress=$('#agent-progress'),resultBox=$('#agent-result');
 api('/api/agent/status').then(status=>{if(!document.contains(wrapper))return;button.disabled=!status.available;connection.textContent=status.available?'شبیه‌ساز دمو آماده است':'شبیه‌ساز در دسترس نیست';connection.className=status.available?'agent-ready':'';}).catch(()=>{connection.textContent='بررسی اتصال انجام نشد؛ ثبت دستی ممکن است.';});
 const formSnapshot=()=>[...new FormData($('#order-form'))].map(([k,v])=>`${k}:${v}`).join('|');
 function traceView(trace){return `<ol class="agent-trace">${trace.map(step=>`<li class="${esc(step.status)}"><span>${icon(step.status==='done'?'check':step.status==='rejected'?'alert':'clock')}</span><div>${esc(step.label)}${step.detail?`<small>${esc(step.detail)}</small>`:''}</div></li>`).join('')}</ol>`;}
 function apply(result,runId){
  const form=$('#order-form');for(const key of ['customerName','phone','handle','address','dueDate'])form.elements[key].value=result[key]||'';
  form.elements.receiptReported.checked=result.receiptReported;form.elements.reviewed.checked=false;
  $('#item-rows').innerHTML=(result.items.length?result.items:[{}]).map(itemRow).join('');
  const warnings=$('#extraction-warnings');warnings.hidden=!result.warnings.length;warnings.className='warnings';warnings.innerHTML=`<ul>${result.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`;
  agentRunId=runId;form.dataset.agentRunId=runId;updateTotal();historyHint();
 }
 function showResult(result,runId,autoApply){
  lastResult=result;resultBox.hidden=false;resultBox.className='agent-result';
  pane.classList.add('has-agent-result');
  progress.innerHTML=`<details><summary>مراحل بررسی دستیار · ${result.trace.filter(s=>s.status==='done').length} اقدام انجام‌شده</summary>${traceView(result.trace)}</details>`;
  resultBox.innerHTML=`<div class="agent-result-heading">${icon('check')}بررسی دستیار تمام شد</div><p>${esc(result.summary)}</p><p class="agent-caption">موارد نامشخص در زمان بررسی:</p><div class="agent-missing">${result.missing.length?result.missing.map(m=>`<span>${esc(m)}</span>`).join(''):'<span class="complete">اطلاعات اصلی مشخص است</span>'}</div>${!autoApply?'<button class="button secondary small" type="button" id="apply-agent-result">قرار دادن پیشنهاد در کارت</button>':''}${result.customerQuestions?.length?`<h4>سؤال‌های پیشنهادی برای مشتری</h4><ul class="agent-questions">${result.customerQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul><button type="button" class="button secondary small" id="copy-agent-question">${icon('copy')}کپی سؤال بعدی</button>`:''}${result.sellerQuestions?.length?`<h4>تصمیم موردنیاز فروشنده</h4><ul class="agent-questions">${result.sellerQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>`:''}${result.previousAddress?`<div class="agent-previous"><strong>نشانی سفارش قبلی</strong><p>${esc(result.previousAddress)}</p><button type="button" class="text-button" id="use-agent-address">نشانی را بررسی کردم؛ در کارت قرار بده</button></div>`:''}${result.historyOptions?.length?`<details class="agent-history"><summary>خریدهای قبلی برای انتخاب شما</summary>${result.historyOptions.map(o=>`<button type="button" class="agent-history-option" data-agent-history="${o.id}"><strong>سفارش #${esc(o.number)}</strong><span>${o.items.map(i=>`${esc(i.quantity)} عدد ${esc(i.productName)}`).join('، ')}</span><small>انتخاب این اقلام با قیمت فعلی</small></button>`).join('')}</details>`:''}<label for="agent-followup">اطلاعات تازه یا پاسخ تکمیلی</label><textarea id="agent-followup" rows="2" placeholder="مثلاً مشتری گفت: دو عدد صابون جو دوسر و نشانی جدید…"></textarea><button type="button" class="button small" id="agent-continue">${icon('spark')}ادامهٔ بررسی با این اطلاعات</button><p class="field-hint">این سؤال‌ها فقط پیش‌نویس‌اند و برای مشتری ارسال نشده‌اند.</p>`;
  if(autoApply)apply(result,runId);
  $('#apply-agent-result')?.addEventListener('click',()=>{apply(result,runId);$('#apply-agent-result').remove();toast('پیشنهاد در کارت قرار گرفت؛ آن را بازبینی کنید.');});
  $('#copy-agent-question')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.nextQuestion);toast('سؤال کپی شد؛ ارسال آن با شماست.');}catch{toast('متن سؤال را انتخاب و کپی کنید.');}});
  $('#use-agent-address')?.addEventListener('click',()=>{$('#customer-address').value=result.previousAddress;$('#order-form').elements.reviewed.checked=false;toast('نشانی قبلی در کارت قرار گرفت؛ تأیید مشتری لازم است.');});
  resultBox.querySelectorAll('[data-agent-history]').forEach(el=>el.addEventListener('click',()=>{
   const order=result.historyOptions.find(o=>o.id===el.dataset.agentHistory),items=order.items.map(i=>{const product=state.products.find(p=>p.name===i.productName);return {...i,unitPrice:product?.price||''};});
   $('#item-rows').innerHTML=items.map(itemRow).join('');$('#order-form').elements.reviewed.checked=false;updateTotal();toast('اقلام خرید قبلی با قیمت فعلی وارد شدند؛ بررسی کنید.');
  }));
  $('#agent-continue')?.addEventListener('click',()=>{const answer=$('#agent-followup').value.trim();if(!answer){toast('ابتدا اطلاعات تکمیلی را بنویسید.');return;}source.value+='\n\nپاسخ تکمیلی فروشنده یا مشتری:\n'+answer;delete $('#order-form').dataset.agentRunId;void run();});
 }
 async function run(){
  const input=source.value.trim();if(!input){$('#extract-error').textContent='ابتدا متن گفتگو را وارد کنید.';source.focus();return;}
  const token=++generation,fingerprint=JSON.stringify([input,$('#agent-customer').value]),before=formSnapshot();
  if(!lastRequest||lastRequest.fingerprint!==fingerprint)lastRequest={fingerprint,key:crypto.randomUUID()};
  button.disabled=true;$('#extract-button').disabled=true;button.innerHTML='<span class="spinner"></span>دستیار در حال بررسی است…';$('#extract-error').textContent='';progress.hidden=false;progress.className='agent-progress';progress.innerHTML='<p>شبیه‌ساز در حال آماده‌کردن نمونه است…</p>';resultBox.hidden=true;delete $('#order-form').dataset.agentRunId;
  try{
   const started=await send('/api/agent/runs',{text:input,customerId:$('#agent-customer').value||null,requestKey:lastRequest.key});
   for(let attempt=0;attempt<220;attempt++){
    if(token!==generation||!document.contains(wrapper)||!$('#editor').open)return;
    const runResult=await api('/api/agent/runs/'+started.id);
    progress.innerHTML=`<p>${runResult.status==='running'?'بررسی در حال انجام است؛ هنوز سفارشی ثبت نشده.':'مراحل انجام‌شده'}</p>${traceView(runResult.trace||[])}`;
    if(runResult.status==='failed'){lastRequest=null;throw new Error(runResult.error||'بررسی انجام نشد.');}
    if(runResult.status==='completed'){
     if(source.value.trim()!==input||$('#agent-customer').value!==(JSON.parse(fingerprint)[1])){lastRequest=null;throw new Error('متن یا انتخاب مشتری هنگام بررسی تغییر کرد؛ برای اطلاعات جدید دوباره بررسی کنید.');}
     showResult(runResult.result,runResult.id,formSnapshot()===before);toast('پیشنهاد دستیار آماده است؛ کارت را بررسی کنید.');return;
    }
    await new Promise(resolve=>setTimeout(resolve,1200));
   }
   throw new Error('بررسی طول کشیده است؛ دوباره همین درخواست را بررسی کنید.');
  }catch(error){if(document.contains(wrapper))$('#extract-error').textContent=error.message;}
  finally{if(document.contains(wrapper)){button.disabled=false;$('#extract-button').disabled=false;button.innerHTML=icon('spark')+'بررسی گفتگو و سابقه';}}
 }
 button.addEventListener('click',run);
 const invalidate=()=>{delete $('#order-form').dataset.agentRunId;resultBox.hidden=true;};
 source.addEventListener('input',invalidate);
 $('#agent-customer').addEventListener('change',invalidate);
 pane.querySelector('[data-action=example]')?.addEventListener('click',()=>{invalidate();$('#agent-customer').value='';});
 $('#extract-button').addEventListener('click',()=>{generation++;delete $('#order-form').dataset.agentRunId;});
}
