export function imageInputMarkup(prefix='order'){return `<section class="intake-image"><p class="intake-image-title">یا عکس گفتگوی مشتری را انتخاب کنید</p><div class="intake-file"><input id="${prefix}-image" class="intake-file-input" type="file" accept="image/png,image/jpeg"><label class="button secondary small" for="${prefix}-image">انتخاب عکس</label><span class="intake-file-name" id="${prefix}-image-name">فایلی انتخاب نشده</span></div><p>PNG یا JPEG تا ۶ مگابایت؛ فقط ناحیهٔ گفتگو را بفرستید. متن خوانده‌شده را قبل از ثبت بررسی کنید.</p><div id="${prefix}-image-status" role="status" class="field-hint"></div></section>`;}
export function bindImageInput({prefix='order',send,target,onText=()=>{}}){
 const input=document.getElementById(prefix+'-image'),status=document.getElementById(prefix+'-image-status'),name=document.getElementById(prefix+'-image-name');
 if(!input)return;
 const setName=value=>{if(name)name.textContent=value;};
 input.addEventListener('change',async()=>{
  const file=input.files[0];if(!file)return;
  setName(file.name);
  if(!['image/png','image/jpeg'].includes(file.type)||file.size>6*1024*1024){status.textContent='فقط PNG یا JPEG تا ۶ مگابایت انتخاب کنید.';input.value='';setName('فایلی انتخاب نشده');return;}
  const before=target.value;input.disabled=true;status.textContent='در حال خواندن متن عکس روی همین دستگاه…';
  try{
   const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
   const result=await send('/api/intake/image',{image});
   if(!document.contains(target))return;
   if(target.value!==before){status.textContent='متن هنگام پردازش تغییر کرد؛ برای جلوگیری از جایگزینی، عکس را دوباره انتخاب کنید.';return;}
   target.value=(before?before+'\n\n':'')+result.text;target.dispatchEvent(new Event('input',{bubbles:true}));onText();status.textContent='متن عکس اضافه شد. نام‌ها، شماره‌ها و مبلغ‌ها را بررسی و اصلاح کنید.';
  }catch(error){status.textContent=error.message||'خواندن عکس انجام نشد.';}
  finally{input.disabled=false;input.value='';setName('فایلی انتخاب نشده');}
 });
}
