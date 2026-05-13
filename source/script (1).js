let tasks = [];
let taskCounter = 1;

function isValidTime(time) {
    const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(time);
}

function addTask() {
    const taskInput = document.getElementById("taskInput");
    const timeInput = document.getElementById("timeInput");
    const errorBox = document.getElementById("errorBox");

    const taskName = taskInput.value.trim();
    let taskTime = timeInput.value.trim();

    errorBox.style.display = "none";

    if (taskName === "") {
        alert("Görev adı boş bırakılamaz.");
        return;
    }

    if (taskTime === "") {
        taskTime = "--:--";
    } else if (!isValidTime(taskTime)) {
        errorBox.style.display = "block";
        return;
    }

    const task = {
        id: "task" + taskCounter,
        name: taskName,
        time: taskTime,
        checked: false
    };

    taskCounter++;
    tasks.push(task);

    sortTasks();
    renderTasks();

    taskInput.value = "";
    timeInput.value = "";
}

function sortTasks() {
    tasks.sort(function(a, b) {
        if (a.time === "--:--" && b.time !== "--:--") {
            return 1;
        }

        if (a.time !== "--:--" && b.time === "--:--") {
            return -1;
        }

        if (a.time === "--:--" && b.time === "--:--") {
            return 0;
        }

        return a.time.localeCompare(b.time);
    });
}

function renderTasks() {
    const taskContainer = document.getElementById("taskContainer");
    taskContainer.innerHTML = "";

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        const todoItem = document.createElement("div");
        todoItem.className = "todo-item";

        todoItem.innerHTML = `
            <input type="checkbox" id="${task.id}" ${task.checked ? "checked" : ""} onchange="updateChecked('${task.id}')">

            <label for="${task.id}" class="checkbox-label">
                <span class="custom-checkbox"></span>
            </label>

            <label for="${task.id}" class="task-text">
                ${task.name}
            </label>

            <span class="task-time">
                ${task.time}
            </span>
            
            <button class="delete-btn" onclick="deleteTask('${task.id}')">Sil</button>
        `;

        taskContainer.appendChild(todoItem);
    }
}

function updateChecked(taskId) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) {
            tasks[i].checked = document.getElementById(taskId).checked;
            break;
        }
    }
}


function deleteTask(taskId) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) {
            tasks[i].checked = false; 
            tasks.splice(i, 1);
            break;
        }
    }

    renderTasks();
}
