// Lightbox for gallery
function initSiteJS(){
  // Mark the document as JS-enabled so CSS can safely hide/show JS-driven elements
  try{ document.documentElement.classList.add('js'); }catch(e){}
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
  if(lbClose && typeof lbClose.addEventListener === 'function'){
    lbClose.addEventListener('click', closeLB);
  }
  if(lightbox && typeof lightbox.addEventListener === 'function'){
    lightbox.addEventListener('click', (e)=>{
      if(e.target === lightbox) closeLB();
    });
  }
  // Only bind Escape handler when lightbox exists
  if(typeof document.addEventListener === 'function' && lightbox){
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeLB(); });
  }

  // Booking form handling (optional AJAX submit to Formspree)
  const form = document.getElementById('booking-form');
  const msg = document.getElementById('form-msg');
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const header = document.querySelector('.site-header');
  if(menuToggle && header){
    menuToggle.addEventListener('click', ()=>{
      header.classList.toggle('nav-open');
    });
  }

  // Reveal-on-scroll for subtle entrance animations
  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if(revealEls && revealEls.length){
    // If IntersectionObserver is supported, use it to reveal elements when they enter viewport.
    if('IntersectionObserver' in window){
      const obs = new IntersectionObserver((entries, o)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            e.target.classList.add('revealed');
            o.unobserve(e.target);
          }
        });
      },{threshold:0.12});
      revealEls.forEach(el=>obs.observe(el));
    } else {
      // Fallback: reveal immediately if observer not available
      revealEls.forEach(el=>el.classList.add('revealed'));
    }

    // Safety: if for any reason elements remain hidden (observer blocked, CSS issues,
    // or slow execution), reveal them after 1s so the page doesn't stay blank.
    setTimeout(()=>{
      revealEls.forEach(el=>{
        if(!el.classList.contains('revealed')) el.classList.add('revealed');
      });
    }, 1000);
  }
  if(form){
    form.addEventListener('submit', async (ev)=>{
      const action = form.getAttribute('action');

      // If using Formspree, our own endpoint, or any relative action, do an AJAX submit for better UX
      if(action){
        // Only intercept if it's a remote Formspree or our own API (relative path starting with /)
        const shouldAjax = action.includes('formspree') || action.startsWith('/');
        if(shouldAjax){
          ev.preventDefault();
          msg.textContent = 'Sending...';
          const data = new FormData(form);
          try{
            const res = await fetch(action, {method:'POST', body: data, headers:{'Accept':'application/json'}});
            if(res.ok){
              // Redirect to a success page so users see a clear confirmation
              window.location.href = 'booking-success.html';
            } else {
              // Try to parse JSON error, otherwise use status text
              let text = 'Submission failed — try again.';
              try{ const json = await res.json(); if(json && json.error) text = json.error; }catch(e){}
              // Redirect to failure page (could show message there later)
              window.location.href = 'booking-failure.html';
              console.error('Form submission error', text);
            }
          }catch(err){
            // On network/server error, redirect to failure page
            window.location.href = 'booking-failure.html';
            console.error('Submit error', err);
          }
        }
      }
    });
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initSiteJS);
} else {
  // DOM already ready
  initSiteJS();
}
