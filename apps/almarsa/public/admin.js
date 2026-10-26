const app = document.querySelector('#app');
// Locally the admin is served by Node (3000) and the customer menu by Vite (5174).
// In production the built menu and admin are served together from the same origin.
const API_PREFIX = '/almarsa';
const customerMenuUrl = `${API_PREFIX}/`;

function apiPath(url) {
  if (url.startsWith(API_PREFIX)) return url;
  return `${API_PREFIX}${url.startsWith('/') ? url : `/${url}`}`;
}

let menu = [];
let feedback = [];
let settings = { dollarRate: 90000 };
let page = 'overview';
let notice = '';
let filter = '';
let categoryFilter = '';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

async function api(url, method = 'GET', data) {
  const response = await fetch(apiPath(url), {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    credentials: 'same-origin',
    body: data ? JSON.stringify(data) : undefined,
  });

  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(value.error || 'Request failed');
  return value;
}

function flash(message, error = false) {
  notice = `${error ? '⚠' : '✓'} ${message}`;
  render();
}

function formatPrice(price, currency = 'USD') {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return '';

  if (currency === 'LBP') {
    const formatted = `LBP ${Math.round(amount).toLocaleString('en-US')}`;
    if (settings?.dollarRate > 0) {
      const approx = amount / settings.dollarRate;
      return `${formatted} (~$${approx.toFixed(2)})`;
    }
    return formatted;
  }

  return `$${amount.toFixed(2)}`;
}

function feedbackContact(entry) {
  return entry.contact || entry.email || '';
}

function login() {
  app.innerHTML = `
    <div class="panel login">
      <img src="/marsah-logo.png" onerror="this.style.display='none'" alt="">
      <p class="eyebrow">Ocean-inspired management</p>
      <h1>Al Marsa Admin</h1>
      <p class="muted">Sign in to manage the menu and customer feedback.</p>
      <form id="login">
        <label class="field">
          Administrator password
          <input type="password" name="password" minlength="12" autocomplete="current-password" required>
        </label>
        <button class="primary" type="submit">Sign in →</button>
        <p id="login-error" style="color:#b33"></p>
      </form>
    </div>
  `;

  document.querySelector('#login').onsubmit = async (event) => {
    event.preventDefault();
    try {
      await api('/api/admin/login', 'POST', { password: event.target.password.value });
      await refresh();
    } catch (error) {
      document.querySelector('#login-error').textContent = error.message;
    }
  };
}

async function refresh() {
  try {
    [menu, feedback, settings] = await Promise.all([
      api('/api/admin/menu'),
      api('/api/admin/feedback'),
      api('/api/admin/settings').catch(() => ({ dollarRate: 90000 })),
    ]);
    settings = { dollarRate: 90000, ...settings };
    render();
  } catch (error) {
    if (error.message.includes('login') || error.message.includes('required')) {
      login();
      return;
    }
    app.innerHTML = `<div class="panel login">${esc(error.message)}</div>`;
  }
}

function navigation() {
  const items = [
    ['overview', '◈ Overview'],
    ['categories', '▤ Categories'],
    ['dishes', '◉ Menu Items'],
    ['feedback', '☆ Feedback'],
    ['account', '⚙ Settings'],
  ];

  return `
    <aside class="side">
      <div class="brand">
        <img src="/marsah-logo.png" onerror="this.style.display='none'" alt="">
        <div>AL MARSA<small>RESTAURANT ADMIN</small></div>
      </div>
      <div class="nav">
        ${items.map(([id, label]) => `<button data-page="${id}" class="${page === id ? 'selected' : ''}">${label}</button>`).join('')}
      </div>
      <div class="side-bottom"><button class="secondary" id="logout">Log out</button></div>
    </aside>
  `;
}

function rows() {
  return menu.flatMap((category) =>
    category.dishes.map((dish) => ({ ...dish, categoryId: category.id, categoryName: category.name })),
  );
}

function overview() {
  const items = rows();
  const cards = [
    ['Menu items', items.length],
    ['Categories', menu.length],
    ['Feedback messages', feedback.length],
    ['New feedback', feedback.filter((entry) => entry.status === 'new').length],
  ];

  return `
    <div class="grid">
      ${cards.map(([label, value]) => `<div class="card"><span class="muted">${label}</span><div class="metric">${value}</div></div>`).join('')}
    </div>

    <div class="panel">
      <div class="headerline"><h2>Quick actions</h2></div>
      <div class="actions">
        <button class="primary" data-open="dish">+ Add dish</button>
        <button class="secondary" data-open="category">+ Add category</button>
        <button class="secondary" data-page="feedback">View feedback</button>
        <a href="${customerMenuUrl}" target="_blank" rel="noopener noreferrer">Open customer menu ↗</a>
      </div>
    </div>

    <div class="panel">
      <h2>Latest feedback</h2>
      ${feedback.slice(0, 4).map((entry) => `
        <div class="feedback">
          <strong>${esc(entry.name || 'Anonymous')}</strong>
          <span class="pill ${esc(entry.status)}">${esc(entry.status)}</span>
          ${feedbackContact(entry) ? `<p><small>${esc(feedbackContact(entry))}</small></p>` : ''}
          <p>${esc(entry.message)}</p>
        </div>
      `).join('') || '<p class="empty">No feedback received yet.</p>'}
    </div>
  `;
}

function categories() {
  return `
    <div class="panel">
      <div class="headerline">
        <h2>All categories</h2>
        <button class="primary" data-open="category">+ New category</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Category</th><th>Order</th><th>Items</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${menu.map((category) => `
              <tr>
                <td><strong>${esc(category.name)}</strong></td>
                <td>${category.order || 0}</td>
                <td>${category.dishes.length}</td>
                <td>
                  <div class="actions">
                    <button class="secondary tiny" data-edit-cat="${esc(category.id)}">Edit</button>
                    <button class="danger tiny" data-del-cat="${esc(category.id)}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function dishes() {
  const list = rows().filter((dish) => {
    const haystack = `${dish.name} ${dish.description || ''} ${dish.descriptionEn || ''} ${dish.descriptionAr || ''}`.toLowerCase();
    return (!categoryFilter || dish.categoryId === categoryFilter) && (!filter || haystack.includes(filter.toLowerCase()));
  });

  return `
    <div class="panel">
      <div class="headerline">
        <h2>Menu items (${rows().length})</h2>
        <button class="primary" data-open="dish">+ New dish</button>
      </div>

      <div class="actions">
        <input class="filter" id="search" placeholder="Search dishes..." value="${esc(filter)}">
        <select id="catfilter" class="filter">
          <option value="">All categories</option>
          ${menu.map((category) => `<option value="${esc(category.id)}" ${categoryFilter === category.id ? 'selected' : ''}>${esc(category.name)}</option>`).join('')}
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Dish</th><th>Category</th><th>Price</th><th>Visible</th><th>Manage</th></tr>
          </thead>
          <tbody>
            ${list.map((dish) => `
              <tr>
                <td>
                  <span class="thumb">${dish.image ? `<img src="${esc(dish.image)}" alt="">` : ''}<strong>${esc(dish.name)}</strong></span>
                </td>
                <td>${esc(dish.categoryName)}</td>
                <td>${esc(formatPrice(dish.price, dish.currency))}</td>
                <td><span class="pill">${dish.available === false ? 'Hidden' : 'Visible'}</span></td>
                <td>
                  <div class="actions">
                    <button class="secondary tiny" data-edit-dish="${esc(dish.id)}">Edit</button>
                    <button class="danger tiny" data-del-dish="${esc(dish.id)}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function feedbackPage() {
  const list = feedback.filter((entry) => !filter || entry.status === filter);
  return `
    <div class="panel">
      <div class="headerline">
        <h2>Customer feedback (${feedback.length})</h2>
        <select id="feedbackfilter" class="filter">
          <option value="">All statuses</option>
          ${['new', 'read', 'resolved'].map((status) => `<option ${filter === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </div>

      ${list.map((entry) => `
        <article class="feedback">
          <div class="feedback-top">
            <div>
              <strong>${esc(entry.name || 'Anonymous')}</strong>
              <span class="stars">${'★'.repeat(entry.rating)}${'☆'.repeat(5 - entry.rating)}</span>
              <span class="pill ${esc(entry.status)}">${esc(entry.status)}</span>
            </div>
            <small class="muted">${esc(new Date(entry.createdAt).toLocaleString())}</small>
          </div>
          ${feedbackContact(entry) ? `<small>${esc(feedbackContact(entry))}</small>` : ''}
          ${entry.occasion ? `<small> · ${esc(entry.occasion)}</small>` : ''}
          <p>${esc(entry.message)}</p>
          <div class="actions">
            <button class="secondary tiny" data-status="${esc(entry.id)}:read">Mark read</button>
            <button class="primary tiny" data-status="${esc(entry.id)}:resolved">Resolve</button>
            <button class="secondary tiny" data-status="${esc(entry.id)}:new">Mark new</button>
            <button class="danger tiny" data-del-feedback="${esc(entry.id)}">Delete</button>
          </div>
        </article>
      `).join('') || '<p class="empty">No messages in this view.</p>'}
    </div>
  `;
}

function account() {
  return `
    <div class="panel">
      <h2>Admin security</h2>
      <p class="muted">Change the administrator password. All existing admin sessions will be signed out after saving.</p>
      <form id="password-settings" class="formgrid">
        <label class="field wide">Current password<input name="currentPassword" type="password" required autocomplete="current-password"></label>
        <label class="field">New password<input name="newPassword" type="password" minlength="12" maxlength="256" required autocomplete="new-password"></label>
        <label class="field">Confirm new password<input name="confirmation" type="password" minlength="12" maxlength="256" required autocomplete="new-password"></label>
        <div class="actions wide"><button class="primary" type="submit">Change password</button></div>
        <p id="password-error" class="wide" role="status"></p>
      </form>
    </div>

    <div class="panel">
      <h2>Pricing settings</h2>
      <p class="muted">Set the current dollar rate used for menu management.</p>
      <form id="rate-settings" class="formgrid">
        <label class="field wide">Dollar rate (LBP per 1 USD)
          <input name="dollarRate" type="number" min="1" step="1" required value="${esc(settings?.dollarRate ?? 90000)}">
        </label>
        <div class="actions wide"><button class="primary" type="submit">Save dollar rate</button></div>
        <p id="rate-error" class="wide" role="status"></p>
      </form>
    </div>
  `;
}

function render() {
  const titles = {
    overview: 'Dashboard Overview',
    categories: 'Categories',
    dishes: 'Menu Management',
    feedback: 'Feedback Management',
    account: 'Account Settings',
  };

  app.innerHTML = `
    <div class="layout">
      ${navigation()}
      <main class="main">
        <div class="top">
          <div>
            <p class="eyebrow">Al Marsa / Restaurant management</p>
            <h1>${titles[page]}</h1>
          </div>
          <a href="${customerMenuUrl}" target="_blank" rel="noopener noreferrer">Customer menu ↗</a>
        </div>

        ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
        ${({ overview, categories, dishes, feedback: feedbackPage, account })[page]()}
      </main>
    </div>
    <dialog id="editor"></dialog>
  `;

  attach();
}

function dialogForm(type, id) {
  const dialog = document.querySelector('#editor');
  const category = menu.find((item) => item.id === id);
  const dish = rows().find((item) => item.id === id);
  const value = type === 'category' ? category : dish;

  const body = type === 'dish'
    ? `
      <label class="field">Name<input name="name" maxlength="120" required value="${esc(value?.name || '')}"></label>
      <label class="field">Price amount<input name="price" type="number" min="0" max="1000000000" step="0.01" required value="${esc(value?.price ?? 0)}"></label>
      <label class="field">Currency<select name="currency"><option value="USD" ${(value?.currency || 'USD') === 'USD' ? 'selected' : ''}>USD ($)</option><option value="LBP" ${value?.currency === 'LBP' ? 'selected' : ''}>LBP (ل.ل)</option></select></label>
      <label class="field">Visibility<select name="available"><option value="true" ${value?.available !== false ? 'selected' : ''}>Visible</option><option value="false" ${value?.available === false ? 'selected' : ''}>Hidden</option></select></label>
      <label class="field wide">Description (English)<textarea name="descriptionEn" maxlength="1500">${esc(value?.descriptionEn || value?.description || '')}</textarea></label>
      <label class="field wide">Description (Arabic)<textarea name="descriptionAr" maxlength="1500">${esc(value?.descriptionAr || '')}</textarea></label>
      <label class="field">Category<select name="categoryId">${menu.map((item) => `<option value="${esc(item.id)}" ${(value?.categoryId || menu[0]?.id) === item.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label>
      <label class="field">Display order<input type="number" name="order" value="${esc(value?.order ?? rows().length)}"></label>
      <label class="field wide">Dish image URL<input name="image" id="imageurl" value="${esc(value?.image || '')}"></label>
      <label class="field wide">Or upload dish image (PNG/JPEG/WebP, max 5 MB)<input type="file" id="uploadfile" accept="image/png,image/jpeg,image/webp"></label>
    `
    : `
      <label class="field wide">Name<input name="name" maxlength="120" required value="${esc(value?.name || '')}"></label>
      <label class="field">Icon (optional)<input name="icon" maxlength="8" value="${esc(value?.icon || '')}"></label>
      <label class="field">Display order<input type="number" name="order" value="${esc(value?.order ?? menu.length)}"></label>
    `;

  dialog.innerHTML = `
    <h2>${value ? 'Edit' : 'Add'} ${type === 'category' ? 'category' : 'menu item'}</h2>
    <form id="editform">
      <div class="formgrid">${body}</div>
      <div class="actions">
        <button class="primary" type="submit">Save changes</button>
        <button class="secondary" type="button" id="cancel">Cancel</button>
      </div>
      <p id="modal-error" style="color:#a33"></p>
    </form>
  `;

  dialog.showModal();
  document.querySelector('#cancel').onclick = () => dialog.close();

  document.querySelector('#editform').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());
    data.order = Number(data.order || 0);

    if (type === 'dish') {
      data.price = Number(data.price || 0);
      data.available = data.available === 'true';

      const upload = document.querySelector('#uploadfile')?.files?.[0];
      if (upload) {
        if (upload.size > 5 * 1024 * 1024) {
          document.querySelector('#modal-error').textContent = 'Upload a PNG, JPEG or WebP image below 5 MB.';
          return;
        }
        data.image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Could not read image file.'));
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(upload);
        }).catch((error) => {
          document.querySelector('#modal-error').textContent = error.message;
          return null;
        });
        if (!data.image) return;

        try {
          const uploaded = await api('/api/admin/upload', 'POST', { data: data.image });
          data.image = uploaded.url;
        } catch (error) {
          document.querySelector('#modal-error').textContent = error.message;
          return;
        }
      }
    }

    try {
      const url = type === 'category'
        ? (value ? `/api/admin/categories/${value.id}` : '/api/admin/categories')
        : (value ? `/api/admin/dishes/${value.id}` : '/api/admin/dishes');
      const method = value ? 'PATCH' : 'POST';
      await api(url, method, data);
      dialog.close();
      notice = 'Changes saved successfully';
      await refresh();
    } catch (error) {
      document.querySelector('#modal-error').textContent = error.message;
    }
  };
}

function bindSettings() {
  const passwordForm = document.querySelector('#password-settings');
  if (passwordForm) {
    passwordForm.onsubmit = async (event) => {
      event.preventDefault();
      const message = document.querySelector('#password-error');
      const values = Object.fromEntries(new FormData(passwordForm).entries());
      if (values.newPassword !== values.confirmation) {
        message.textContent = 'New passwords do not match';
        return;
      }
      if (!confirm('Change admin password and sign out all sessions?')) return;
      try {
        await api('/api/admin/password', 'POST', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        alert('Password updated. Please sign in again.');
        login();
      } catch (error) {
        message.textContent = error.message;
      }
    };
  }

  const rateForm = document.querySelector('#rate-settings');
  if (rateForm) {
    rateForm.onsubmit = async (event) => {
      event.preventDefault();
      const message = document.querySelector('#rate-error');
      message.textContent = '';
      try {
        const values = Object.fromEntries(new FormData(rateForm).entries());
        settings = await api('/api/admin/settings', 'PATCH', { dollarRate: Number(values.dollarRate) });
        flash('Dollar rate updated');
      } catch (error) {
        message.textContent = error.message;
      }
    };
  }
}

function attach() {
  bindSettings();

  document.querySelectorAll('[data-page]').forEach((button) => {
    button.onclick = () => {
      page = button.dataset.page;
      filter = '';
      categoryFilter = '';
      render();
    };
  });

  document.querySelector('#logout').onclick = async () => {
    await api('/api/admin/logout', 'POST');
    login();
  };

  document.querySelectorAll('[data-open]').forEach((button) => {
    button.onclick = () => dialogForm(button.dataset.open);
  });

  document.querySelectorAll('[data-edit-cat]').forEach((button) => {
    button.onclick = () => dialogForm('category', button.dataset.editCat);
  });

  document.querySelectorAll('[data-edit-dish]').forEach((button) => {
    button.onclick = () => dialogForm('dish', button.dataset.editDish);
  });

  document.querySelectorAll('[data-del-cat]').forEach((button) => {
    button.onclick = () => remove(`/api/admin/categories/${button.dataset.delCat}`, 'category');
  });

  document.querySelectorAll('[data-del-dish]').forEach((button) => {
    button.onclick = () => remove(`/api/admin/dishes/${button.dataset.delDish}`, 'dish');
  });

  document.querySelectorAll('[data-del-feedback]').forEach((button) => {
    button.onclick = () => remove(`/api/admin/feedback/${button.dataset.delFeedback}`, 'feedback');
  });

  document.querySelectorAll('[data-status]').forEach((button) => {
    button.onclick = async () => {
      try {
        const [id, status] = button.dataset.status.split(':');
        await api(`/api/admin/feedback/${id}`, 'PATCH', { status });
        await refresh();
      } catch (error) {
        flash(error.message, true);
      }
    };
  });

  const search = document.querySelector('#search');
  if (search) {
    search.oninput = (event) => {
      filter = event.target.value;
      const start = event.target.selectionStart;
      render();
      const next = document.querySelector('#search');
      next.focus();
      next.setSelectionRange(start, start);
    };
  }

  const categorySelect = document.querySelector('#catfilter');
  if (categorySelect) {
    categorySelect.onchange = (event) => {
      categoryFilter = event.target.value;
      render();
    };
  }

  const feedbackFilter = document.querySelector('#feedbackfilter');
  if (feedbackFilter) {
    feedbackFilter.onchange = (event) => {
      filter = event.target.value;
      render();
    };
  }
}

async function remove(url, what) {
  if (!confirm(`Delete this ${what}? This cannot be undone.`)) return;
  try {
    await api(url, 'DELETE');
    notice = `${what} deleted`;
    await refresh();
  } catch (error) {
    flash(error.message, true);
  }
}

refresh();
