export function voiceInputMarkup(prefix='inbox'){
 return `<section class="intake-image intake-voice"><p class="intake-image-title">یا فایل صوتی گفتگو را انتخاب کنید</p><div class="intake-file"><input id="${prefix}-voice" class="intake-file-input" type="file" accept="audio/*"><label class="button secondary small" for="${prefix}-voice">انتخاب فایل صوتی</label><span class="intake-file-name" id="${prefix}-voice-name">فایلی انتخاب نشده</span></div><p>روی همین دستگاه به متن تبدیل می‌شود؛ صدا جایی ارسال نمی‌شود.</p><div id="${prefix}-voice-status" role="status" class="field-hint"></div></section>`;
}
export function bindVoiceInput({prefix='inbox',send,target,onText=()=>{}}){
 const input=document.getElementById(prefix+'-voice'),status=document.getElementById(prefix+'-voice-status'),name=document.getElementById(prefix+'-voice-name');
 if(!input)return;
 const setName=value=>{if(name)name.textContent=value;};
 input.addEventListener('change',async()=>{
  const file=input.files[0];if(!file)return;
  setName(file.name);
  if(file.size>10*1024*1024){status.textContent='فایل صوتی باید کمتر از ۱۰ مگابایت باشد.';input.value='';setName('فایلی انتخاب نشده');return;}
  const before=target.value;input.disabled=true;status.textContent='در حال تبدیل صدا به متن…';
  try{
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
   const result=await send('/api/intake/voice',{audio:data});
   if(!document.contains(target))return;
   if(target.value!==before){status.textContent='متن هنگام پردازش تغییر کرد؛ دوباره تلاش کنید.';return;}
   target.value=(before?before+'\n\n':'')+result.text;target.dispatchEvent(new Event('input',{bubbles:true}));onText();status.textContent='متن صدا اضافه شد. نام‌ها و شماره‌ها را بررسی کنید.';
  }catch(error){status.textContent=error.message||'تبدیل صدا انجام نشد.';}
  finally{input.disabled=false;input.value='';setName('فایلی انتخاب نشده');}
 });
}
