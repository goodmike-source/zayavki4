// Основные DOM элементы
const tableBody = document.getElementById("table-body");
const statusFilter = document.getElementById("status-filter");
const searchBox = document.getElementById("search-box");
const dateFilter = document.getElementById("date-filter");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const spanClose = document.querySelector(".close");
const scSelect = document.getElementById("sc-select");

// Данные по умолчанию
const defaultData = [
  {
    id: 1,
    date: new Date().toLocaleDateString("ru-RU"),
    client: "Иванов И.И.",
    product: "Шуруповёрт Deko",
    serviceId: "СЦ-001",
    status: "Принят",
    updateDate: new Date().toLocaleDateString("ru-RU"),
    comment: "Принят на складе",
    scAddress: "ул. Сервисная, 15",
    scPhone: "+79991112233",
    clientPhone: "+79998887766",
    manager: "Козяев В.С.",
    urgent: true,
    history: [],
    images: { product: "", serial: "", act: "" }
  }
];

// Сохранение/загрузка данных
function saveData(data) {
  localStorage.setItem("requestData", JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem("requestData");
  return saved ? JSON.parse(saved) : defaultData;
}

// Рендер таблицы
function renderTable(data) {
  tableBody.innerHTML = "";
  let draggedIndex = null;

  data.forEach((item, index) => {
    const row = document.createElement("tr");
    row.setAttribute("draggable", "true");
    row.dataset.index = index;
    
    // Drag & Drop
    row.addEventListener("dragstart", (e) => {
      draggedIndex = index;
      row.style.opacity = "0.4";
      e.dataTransfer.effectAllowed = "move";
    });
    
    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      row.style.borderTop = "2px solid var(--primary-color)";
    });
    
    row.addEventListener("dragleave", () => {
      row.style.borderTop = "";
    });
    
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.style.borderTop = "";
      if (draggedIndex !== null && draggedIndex !== index) {
        const draggedItem = data[draggedIndex];
        data.splice(draggedIndex, 1);
        data.splice(index, 0, draggedItem);
        saveData(data);
        renderTable(filterData(data));
      }
    });
    
    row.addEventListener("dragend", () => {
      row.style.opacity = "1";
    });

    // Форматирование даты для отображения
    const displayDate = formatDisplayDate(item.date);
    const displayUpdateDate = formatDisplayDate(item.updateDate);

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${displayDate}</td>
      <td>${item.client}</td>
      <td>${item.product}</td>
      <td>${item.serviceId}</td>
      <td><span class="status status-${item.status.toLowerCase().replace(/\s+/g, '-')}">${item.status}</span></td>
      <td>${displayUpdateDate}</td>
      <td>${item.comment || '-'}</td>
      <td class="actions-cell">
        <button class="details-btn" title="Детали"><i class="fas fa-eye"></i></button>
        <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
      </td>
    `;

    // Обработчики событий
    row.querySelector(".details-btn").onclick = () => openModal(item, data);
    row.querySelector(".delete-btn").onclick = () => {
      if (confirm("Удалить заявку?")) {
        data.splice(index, 1);
        saveData(data);
        renderTable(filterData(data));
      }
    };

    tableBody.appendChild(row);
  });
}

// Форматирование даты для отображения
function formatDisplayDate(dateString) {
  if (!dateString) return '-';
  
  // Попробуем разобрать дату в формате "дд.мм.гггг"
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${day}.${month}.${year}`;
  }
  
  // Попробуем разобрать дату в формате ISO (из input[type="date"])
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("ru-RU");
  }
  
  return dateString;
}

// Открытие модального окна
function openModal(item, data) {
  if (!item.history) item.history = [];
  if (!item.manager) item.manager = "";
  if (!item.urgent) item.urgent = false;
  if (!item.clientPhone) item.clientPhone = "";
  if (!item.scPhone) item.scPhone = "";
  if (!item.scAddress) item.scAddress = scSelect.value;

  // Преобразование даты для input[type="date"]
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  modalBody.innerHTML = `
    <div class="modal-section">
      <h3><i class="fas fa-info-circle"></i> Основное</h3>
      <div class="form-row">
        <label>
          Клиент:
          <input value="${item.client}" id="edit-client" />
        </label>
        <label>
          Товар:
          <input value="${item.product}" id="edit-product" />
        </label>
      </div>
      <div class="form-row">
        <label>
          Номер обращения:
          <input value="${item.serviceId}" id="edit-serviceId" />
        </label>
        <label>
          Дата заявки:
          <input type="date" value="${formatDateForInput(item.date)}" id="edit-date" />
        </label>
      </div>
      <label>
        Комментарий:
        <textarea id="edit-comment">${item.comment || ''}</textarea>
      </label>
      <div class="form-row">
        <label>
          Ответственный менеджер:
          <select id="edit-manager">
            <option value="">-- Не выбран --</option>
            <option ${item.manager === "Козяев В.С." ? "selected" : ""}>Козяев В.С.</option>
            <option ${item.manager === "Храменков И." ? "selected" : ""}>Храменков И.</option>
            <option ${item.manager === "Заболотский И." ? "selected" : ""}>Заболотский И.</option>
          </select>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="edit-urgent" ${item.urgent ? "checked" : ""}/>
          Срочная заявка
        </label>
      </div>
    </div>

    <div class="modal-section">
      <h3><i class="fas fa-phone"></i> Контакты</h3>
      <div class="form-row">
        <label>
          Адрес СЦ:
          <input value="${item.scAddress}" id="edit-scAddress" />
        </label>
        <label>
          Телефон СЦ:
          <input value="${item.scPhone}" id="edit-scPhone" />
        </label>
      </div>
      <div class="form-row">
        <label>
          Телефон клиента:
          <input value="${item.clientPhone}" id="edit-clientPhone" />
        </label>
        ${item.clientPhone ? `
          <div>
            <label>&nbsp;</label>
            <a href="tel:${item.clientPhone}" class="call-btn">
              <i class="fas fa-phone"></i> Позвонить
            </a>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="modal-section">
      <h3><i class="fas fa-images"></i> Фотографии</h3>
      <div class="image-upload">
        <div class="drop-zone" id="drop-zone">
          <p>Перетащите сюда файлы или кликните для выбора</p>
          <input type="file" id="file-input" multiple accept="image/*" style="display: none;">
        </div>
        <div class="image-preview" id="image-preview">
          ${item.images.product ? createImagePreview(item.images.product, 'product') : ''}
          ${item.images.serial ? createImagePreview(item.images.serial, 'serial') : ''}
          ${item.images.act ? createImagePreview(item.images.act, 'act') : ''}
        </div>
      </div>
    </div>

    <div class="modal-section">
      <h3><i class="fas fa-history"></i> История изменений</h3>
      <ul class="history-list">
        ${item.history.map(h => `<li>${h}</li>`).join("") || "<li>История изменений отсутствует</li>"}
      </ul>
    </div>

    <div class="modal-actions">
      <select id="edit-status" class="status-select">
        ${["Принят", "Отправлен", "На диагностике", "Готов к выдаче", "Требуется звонок", "Отказано"]
          .map(s => `<option value="${s}" ${item.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <button id="save-modal" class="primary-btn">
        <i class="fas fa-save"></i> Сохранить
      </button>
    </div>
  `;

  // Настройка drag & drop для изображений
  setupImageUpload(item, data);

  modal.style.display = "block";

  document.getElementById("save-modal").onclick = () => {
    saveModalChanges(item, data);
  };
}

// Создание превью изображения
function createImagePreview(src, type) {
  return `
    <div class="image-preview-item" data-type="${type}">
      <img src="${src}" alt="${type}">
      <button class="remove-img" data-type="${type}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

// Настройка загрузки изображений
function setupImageUpload(item, data) {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const imagePreview = document.getElementById("image-preview");

  // Обработка клика по drop-zone
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  // Обработка выбора файлов
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files, item, imagePreview);
  });

  // Обработка drag & drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropZone.classList.add('active');
  }

  function unhighlight() {
    dropZone.classList.remove('active');
  }

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files, item, imagePreview);
  });

  // Удаление изображений
  imagePreview.addEventListener("click", (e) => {
    if (e.target.closest(".remove-img")) {
      const type = e.target.closest(".remove-img").dataset.type;
      delete item.images[type];
      e.target.closest(".image-preview-item").remove();
    }
  });
}

// Обработка выбранных файлов
function handleFiles(files, item, imagePreview) {
  [...files].forEach(file => {
    if (!file.type.match('image.*')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      // Определяем тип изображения по имени файла
      let type = 'product';
      if (file.name.toLowerCase().includes('serial')) type = 'serial';
      if (file.name.toLowerCase().includes('act')) type = 'act';
      
      // Обновляем или добавляем превью
      const existingPreview = imagePreview.querySelector(`[data-type="${type}"]`);
      if (existingPreview) {
        existingPreview.querySelector('img').src = e.target.result;
      } else {
        imagePreview.insertAdjacentHTML('beforeend', createImagePreview(e.target.result, type));
      }
      
      // Сохраняем в объект item
      item.images[type] = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Сохранение изменений в модальном окне
function saveModalChanges(item, data) {
  const now = new Date().toLocaleString("ru-RU");

  const newData = {
    client: document.getElementById("edit-client").value,
    product: document.getElementById("edit-product").value,
    comment: document.getElementById("edit-comment").value,
    serviceId: document.getElementById("edit-serviceId").value,
    date: document.getElementById("edit-date").value,
    scAddress: document.getElementById("edit-scAddress").value,
    scPhone: document.getElementById("edit-scPhone").value,
    clientPhone: document.getElementById("edit-clientPhone").value,
    manager: document.getElementById("edit-manager").value,
    urgent: document.getElementById("edit-urgent").checked,
    status: document.getElementById("edit-status").value
  };

  // Проверяем изменения и обновляем историю
  for (let key in newData) {
    if (key === "date") {
      const formatted = formatDisplayDate(newData[key]);
      if (item.date !== formatted) {
        item.history.push(`[${now}] Изменена дата создания с ${item.date} на ${formatted}`);
        item.date = formatted;
      }
    } else if (item[key] !== newData[key]) {
      item.history.push(`[${now}] Изменено поле ${key}: "${item[key]}" → "${newData[key]}"`);
      item[key] = newData[key];
    }
  }

  // Обновляем дату изменения статуса, если он изменился
  if (item.status !== newData.status) {
    item.updateDate = new Date().toLocaleDateString("ru-RU");
  }

  saveData(data);
  renderTable(filterData(data));
  modal.style.display = "none";
}

// Фильтрация данных
function filterData(data) {
  const statusVal = statusFilter.value;
  const searchText = searchBox.value.toLowerCase();
  const dateVal = dateFilter.value;
  
  return data.filter(item => {
    const matchesStatus = !statusVal || item.status === statusVal;
    const matchesSearch = 
      item.client.toLowerCase().includes(searchText) || 
      item.product.toLowerCase().includes(searchText) ||
      item.serviceId.toLowerCase().includes(searchText);
    
    let matchesDate = true;
    if (dateVal) {
      const itemDate = new Date(item.date.split('.').reverse().join('-'));
      const filterDate = new Date(dateVal);
      matchesDate = itemDate.toDateString() === filterDate.toDateString();
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });
}

// Сортировка данных
function sortData(data, key, direction) {
  return [...data].sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    
    if (key === 'date' || key === 'updateDate') {
      valA = new Date(valA.split('.').reverse().join('-'));
      valB = new Date(valB.split('.').reverse().join('-'));
    }
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Закрытие модального окна
spanClose.onclick = () => modal.style.display = "none";
window.onclick = e => { 
  if (e.target === modal) modal.style.display = "none";
};

// Обработчики событий фильтров
statusFilter.onchange = () => renderTable(filterData(loadData()));
searchBox.oninput = () => renderTable(filterData(loadData()));
dateFilter.onchange = () => renderTable(filterData(loadData()));

// Сортировка по заголовкам таблицы
document.querySelectorAll('.sortable').forEach(header => {
  header.addEventListener('click', () => {
    const key = header.dataset.sort;
    const icon = header.querySelector('i');
    let direction = 'asc';
    
    if (icon.classList.contains('fa-sort-up')) {
      direction = 'desc';
      icon.classList.replace('fa-sort-up', 'fa-sort-down');
    } else if (icon.classList.contains('fa-sort-down')) {
      direction = 'asc';
      icon.classList.replace('fa-sort-down', 'fa-sort');
    } else {
      direction = 'asc';
      icon.classList.replace('fa-sort', 'fa-sort-up');
    }
    
    const data = sortData(filterData(loadData()), key, direction);
    renderTable(data);
  });
});

// Добавление новой заявки
document.getElementById("add-request-btn").onclick = () => {
  const client = document.getElementById("new-client").value.trim();
  const product = document.getElementById("new-product").value.trim();
  const serviceId = document.getElementById("new-service-id").value.trim();
  const comment = document.getElementById("new-comment").value.trim();
  const dateInput = document.getElementById("new-date").value;
  
  if (!client || !product) {
    alert("Заполните обязательные поля: Клиент и Товар");
    return;
  }
  
  const data = loadData();
  const now = new Date();
  const newId = data.length ? Math.max(...data.map(d => d.id)) + 1 : 1;
  
  // Форматируем дату
  let date;
  if (dateInput) {
    date = formatDisplayDate(dateInput);
  } else {
    date = now.toLocaleDateString("ru-RU");
  }
  
  const newItem = {
    id: newId,
    date,
    client,
    product,
    serviceId,
    status: "Принят",
    updateDate: date,
    comment,
    scAddress: scSelect.value,
    scPhone: "",
    clientPhone: "",
    manager: "",
    urgent: false,
    history: [`[${now.toLocaleString("ru-RU")}] Заявка создана`],
    images: { product: "", serial: "", act: "" }
  };
  
  data.push(newItem);
  saveData(data);
  renderTable(filterData(data));
  
  // Очистка формы
  document.getElementById("new-client").value = "";
  document.getElementById("new-product").value = "";
  document.getElementById("new-service-id").value = "";
  document.getElementById("new-comment").value = "";
  document.getElementById("new-date").value = "";
};

// Тёмная тема
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-theme");
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.onclick = () => {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
};

// Экспорт/импорт данных
document.getElementById("export-btn").onclick = () => {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `заявки_ресанта_${new Date().toLocaleDateString("ru-RU")}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

document.getElementById("import-btn").onclick = () => {
  document.getElementById("import-file").click();
};

document.getElementById("import-file").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      saveData(data);
      renderTable(filterData(data));
      alert(`Успешно загружено ${data.length} заявок`);
    } catch (err) {
      alert("Ошибка: файл имеет неверный формат");
    }
  };
  reader.readAsText(file);
};

// Инициализация
scSelect.value = scSelect.options[0].value;
renderTable(filterData(loadData()));
