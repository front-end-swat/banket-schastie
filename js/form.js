document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('toast');

  if (!form) return;

  const showToast = (message, isError = false) => {
    toast.textContent = message;
    toast.style.background = isError ? '#c0392b' : '#1a1a1a';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();

    if (!name) {
      showToast('Пожалуйста, введите ваше имя', true);
      form.name.focus();
      return;
    }

    if (!phone) {
      showToast('Пожалуйста, введите номер телефона', true);
      form.phone.focus();
      return;
    }

    const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
    if (phoneClean.length < 10) {
      showToast('Пожалуйста, введите корректный номер телефона', true);
      form.phone.focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast('Спасибо! Мы свяжемся с вами в ближайшее время.');
        form.reset();
      } else {
        const err = await response.json();
        showToast(err.error || 'Ошибка при отправке. Попробуйте позже.', true);
      }
    } catch {
      showToast('Ошибка соединения с сервером.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
});
