// Lightbox for gallery
document.addEventListener('DOMContentLoaded', function(){
  const grid = document.querySelector('.grid');
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-close');

  if(grid){
    grid.addEventListener('click', (e)=>{
      const img = e.target.closest('img');
      if(!img) return;
      // Prefer a large source if available via data-large (so srcset can serve smaller images on page)
      const large = img.dataset.large || img.src;
      lbImg.src = large;
      lbImg.alt = img.alt || '';
      lbCaption.textContent = img.alt || '';
      lightbox.setAttribute('aria-hidden','false');
    });
  }
  function closeLB(){
    lightbox.setAttribute('aria-hidden','true');
    lbImg.src = '';
  }
  lbClose.addEventListener('click', closeLB);
  lightbox.addEventListener('click', (e)=>{
    if(e.target === lightbox) closeLB();
  });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeLB(); });

  // Booking form handling (optional AJAX submit to Formspree)
  const form = document.getElementById('booking-form');
  const msg = document.getElementById('form-msg');
  if(form){
    form.addEventListener('submit', async (ev)=>{
      // Determine if user wants to test the submit using httpbin.org (for local testing)
      const testCheckbox = document.getElementById('test-submit');
      const isTest = testCheckbox && testCheckbox.checked;
      const action = form.getAttribute('action');
      // If test mode, intercept and POST to httpbin.org for a visible response
      if(isTest){
        ev.preventDefault();
        msg.textContent = 'Sending (test)...';
        const data = new FormData(form);
        try{
          const res = await fetch('https://httpbin.org/post', {method:'POST', body: data});
          const text = await res.text();
          msg.textContent = 'Test submit complete — see console for response.';
          console.log('httpbin response', text);
        }catch(err){
          msg.textContent = 'Network error during test submit.';
        }
        return;
      }

      // If using Formspree (or other online endpoint) do an AJAX submit for better UX
      if(action && action.includes('formspree')){
        ev.preventDefault();
        msg.textContent = 'Sending...';
        const data = new FormData(form);
        try{
          const res = await fetch(action, {method:'POST', body: data, headers:{'Accept':'application/json'}});
          if(res.ok){
            msg.textContent = 'Thanks — booking request sent.';
            form.reset();
          } else {
            const json = await res.json();
            msg.textContent = (json && json.error) ? json.error : 'Submission failed — try again.';
          }
        }catch(err){
          msg.textContent = 'Network error — try again later.';
        }
      }
    });
  }
});
