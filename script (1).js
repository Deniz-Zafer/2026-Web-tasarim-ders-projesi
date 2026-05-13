// ─────────────────────────────────────────────
//  To-Do List  |  jQuery 3 + Bootstrap 5
//  Features: LocalStorage | Dark Mode | Progress Bar | Priority | Search | Filter | Edit | Smart Date
// ─────────────────────────────────────────────

let taskIdCounter = 0;
let tasks = [];
let currentFilter = 'all';
let currentSearch = '';

/* ══════════════════════════════════
   LOCAL STORAGE
══════════════════════════════════ */
function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('todoTasks');
    if (!saved) return;
    tasks = JSON.parse(saved);
    if (tasks.length > 0) {
        taskIdCounter = Math.max(...tasks.map(t => t.id)) + 1;
    }
    refreshList();
}

/* ══════════════════════════════════
   DARK MODE
══════════════════════════════════ */
function toggleDarkMode() {
    $('body').toggleClass('dark-mode');
    const isDark = $('body').hasClass('dark-mode');
    localStorage.setItem('darkMode', isDark ? '1' : '0');
    $('#darkToggleBtn').html(isDark ? '☀️ Açık Mod' : '🌙 Koyu Mod');
}

function loadDarkMode() {
    if (localStorage.getItem('darkMode') === '1') {
        $('body').addClass('dark-mode');
        $('#darkToggleBtn').html('☀️ Açık Mod');
    }
}

/* ══════════════════════════════════
   PROGRESS BAR
══════════════════════════════════ */
function updateProgress() {
    const total = tasks.length;
    const done  = tasks.filter(t => t.done).length;
    const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

    const $bar = $('#progressBar');
    $bar.css('width', pct + '%').attr('aria-valuenow', pct);
    $('#progressText').text(done + ' / ' + total + ' görev tamamlandı');
    $('#progressPct').text(pct + '%');

    $bar.removeClass('bg-low bg-mid bg-high');
    if (pct <= 30) $bar.addClass('bg-low');
    else if (pct <= 70) $bar.addClass('bg-mid');
    else $bar.addClass('bg-high');

    if (total === 0) $('#progressSection').fadeOut(200);
    else $('#progressSection').fadeIn(200);
}

/* ══════════════════════════════════
   DATE HELPERS
══════════════════════════════════ */
function getTodayDateString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

function formatPrettyDate(dateStr) {
    if (!dateStr) return '';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const taskDate = new Date(dateStr);
    taskDate.setHours(0,0,0,0);
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '<span class="text-primary fw-bold">Bugün</span>';
    if (diffDays === 1) return '<span class="text-success fw-bold">Yarın</span>';
    if (diffDays === -1) return '<span class="text-danger fw-bold">Dün</span>';
    
    // DD/MM/YYYY formatı
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* ══════════════════════════════════
   LIST REFRESH & RENDER
══════════════════════════════════ */
function refreshList() {
    $('#taskContainer').empty();
    let filtered = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(currentSearch.toLowerCase());
        const matchesFilter = currentFilter === 'all' 
            || (currentFilter === 'active' && !task.done)
            || (currentFilter === 'completed' && task.done);
        return matchesSearch && matchesFilter;
    });

    // Tarihe göre sırala
    filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });

    filtered.forEach(t => renderTask(t));
    updateProgress();
}

function renderTask(task) {
    const labels = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' };
    const timeDisplay = task.time || '--:--';
    const dateDisplay = formatPrettyDate(task.date);
    const badgeHtml = task.priority !== 'none'
        ? `<span class="priority-badge priority-${task.priority}">${labels[task.priority]}</span>`
        : '';

    const taskHTML = `
        <div class="todo-item" id="task-${task.id}">
            <input type="checkbox" id="check-${task.id}" ${task.done ? 'checked' : ''}>
            <label class="checkbox-label" for="check-${task.id}">
                <span class="custom-checkbox"></span>
            </label>
            <div class="task-info">
                <span class="task-text ${task.done ? 'done-text' : ''}" id="text-${task.id}">${escapeHtml(task.name)}</span>
                <div class="d-flex align-items-center gap-2 mt-1">
                    ${badgeHtml}
                    <small class="text-muted" style="font-size: 11px;">${dateDisplay}</small>
                </div>
            </div>
            <span class="task-time">${timeDisplay}</span>
            <div class="action-btns">
                <button class="edit-btn" onclick="openEditModal(${task.id})">✏️</button>
                <button class="delete-btn btn btn-sm btn-danger" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        </div>`;

    $('#taskContainer').append(taskHTML);

    $(`#check-${task.id}`).on('change', function () {
        const isDone = $(this).is(':checked');
        const found  = tasks.find(t => t.id === task.id);
        if (found) { 
            found.done = isDone; 
            saveTasks(); 
            updateProgress(); 
            if (currentFilter !== 'all') refreshList();
        }
        if (isDone) $(`#text-${task.id}`).addClass('done-text');
        else $(`#text-${task.id}`).removeClass('done-text');
    });
}

/* ══════════════════════════════════
   OPERATIONS
══════════════════════════════════ */
function addTask() {
    const $taskInput = $('#taskInput');
    const $dateInput = $('#dateInput');
    const $timeInput = $('#timeInput');
    const priority   = $('#prioritySelect').val();
    const taskName   = $taskInput.val().trim();
    const dateValue  = $dateInput.val() || getTodayDateString();
    const timeValue  = $timeInput.val().trim();

    if (timeValue !== '' && !/^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeValue)) {
        $('#errorBox').fadeIn(250);
        $timeInput.addClass('is-invalid').focus();
        return;
    }
    $('#errorBox').fadeOut(200);
    $timeInput.removeClass('is-invalid');

    if (taskName === '') {
        $taskInput.addClass('is-invalid').focus();
        return;
    }

    const task = { id: taskIdCounter++, name: taskName, date: dateValue, time: timeValue, priority: priority, done: false };
    tasks.push(task);
    saveTasks();
    refreshList();

    $taskInput.val('').focus();
    $timeInput.val('');
    $dateInput.val(getTodayDateString());
    $('#prioritySelect').val('none');
}

function deleteTask(id) {
    $(`#task-${id}`).fadeOut(300, function () {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        refreshList();
    });
}

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    $('#editTaskId').val(task.id);
    $('#editTaskName').val(task.name);
    $('#editTaskDate').val(task.date);
    $('#editTaskTime').val(task.time);
    $('#editTaskPriority').val(task.priority);

    new bootstrap.Modal(document.getElementById('editModal')).show();
}

function saveEdit() {
    const id = parseInt($('#editTaskId').val());
    const name = $('#editTaskName').val().trim();
    const date = $('#editTaskDate').val();
    const time = $('#editTaskTime').val().trim();
    const priority = $('#editTaskPriority').val();

    if (name === '') return;

    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
        tasks[idx].name = name;
        tasks[idx].date = date;
        tasks[idx].time = time;
        tasks[idx].priority = priority;
        saveTasks();
        refreshList();
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    }
}

function clearCompleted() {
    if (confirm('Tamamlananları silmek istiyor musunuz?')) {
        tasks = tasks.filter(t => !t.done);
        saveTasks();
        refreshList();
    }
}

function clearAll() {
    if (confirm('Tüm listeyi temizle?')) {
        tasks = [];
        saveTasks();
        refreshList();
    }
}

function escapeHtml(text) { return $('<div>').text(text).html(); }

$(document).ready(function () {
    $('#dateInput').val(getTodayDateString()); // Varsayılan bugün
    loadDarkMode();
    loadTasks();

    $('#darkToggleBtn').on('click', toggleDarkMode);
    $('#addBtn').on('click', addTask);
    $('#saveEditBtn').on('click', saveEdit);
    $('#clearCompletedBtn').on('click', clearCompleted);
    $('#clearAllBtn').on('click', clearAll);

    $('#searchInput').on('input', function() {
        currentSearch = $(this).val();
        refreshList();
    });

    $('#statusFilter').on('change', function() {
        currentFilter = $(this).val();
        refreshList();
    });

    $('#taskInput, #dateInput, #timeInput').on('keydown', function (e) {
        if (e.key === 'Enter') addTask();
    });

    console.log('📅 Akıllı Tarih Sistemi Aktif!');
});
