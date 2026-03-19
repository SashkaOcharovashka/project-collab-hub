/**
 * KANBAN.JS - Drag & Drop доска задач
 * Задание 4: Drag & Drop, динамическое обновление
 */

class KanbanBoard {
    constructor(boardId = 'kanbanBoard') {
        this.board = document.getElementById(boardId);
        if (!this.board) return;
        
        this.currentProject = 1;
        this.tasks = [];
        this.draggedItem = null;
        this.columns = {
            todo: { id: 'todo', title: 'To Do', limit: 10, tasks: [] },
            'in-progress': { id: 'in-progress', title: 'In Progress', limit: 8, tasks: [] },
            review: { id: 'review', title: 'Review', limit: 6, tasks: [] },
            done: { id: 'done', title: 'Done', limit: 20, tasks: [] }
        };
        
        this.init();
    }
    
    init() {
        this.loadTasks();
        this.initDragAndDrop();
        this.initEventListeners();
        this.initAutoSave();
    }
    
    /**
     * Загрузка задач
     */
    async loadTasks() {
        try {
            // Пробуем загрузить из localStorage
            const saved = localStorage.getItem(`kanban_${this.currentProject}`);
            if (saved) {
                this.tasks = JSON.parse(saved);
            } else {
                // Иначе загружаем демо-данные
                this.tasks = this.getDemoTasks();
            }
            
            this.renderBoard();
            
            // Загружаем с сервера (если есть API)
            if (API && API.tasks) {
                const response = await API.tasks.getByProject(this.currentProject);
                if (response.data) {
                    this.tasks = response.data;
                    this.renderBoard();
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки задач:', error);
            this.tasks = this.getDemoTasks();
            this.renderBoard();
        }
    }
    
    /**
     * Демо-данные
     */
    getDemoTasks() {
        return [
            // To Do
            { id: 1, title: 'Разработка API', description: 'Создать RESTful API для CRM системы с документацией Swagger', priority: 'high', assignee: 'Иван Петров', assigneeAvatar: 'https://randomuser.me/api/portraits/men/1.jpg', deadline: '2026-03-25', hours: 16, status: 'todo', tags: ['backend', 'api'], comments: 3, attachments: 2 },
            { id: 2, title: 'Проектирование БД', description: 'Спроектировать структуру базы данных, создать ER-диаграмму', priority: 'critical', assignee: 'Мария Смирнова', assigneeAvatar: 'https://randomuser.me/api/portraits/women/2.jpg', deadline: '2026-03-20', hours: 8, status: 'todo', tags: ['database', 'design'], comments: 1 },
            { id: 3, title: 'Настройка сервера', description: 'Настроить серверное окружение, установить необходимые пакеты', priority: 'medium', assignee: 'Алексей Иванов', assigneeAvatar: 'https://randomuser.me/api/portraits/men/3.jpg', deadline: '2026-03-22', hours: 4, status: 'todo', tags: ['devops', 'server'] },
            
            // In Progress
            { id: 4, title: 'Верстка интерфейса', description: 'Сверстать главную страницу и дашборд по макетам', priority: 'high', assignee: 'Елена Соколова', assigneeAvatar: 'https://randomuser.me/api/portraits/women/4.jpg', deadline: '2026-03-23', hours: 24, status: 'in-progress', tags: ['frontend', 'html', 'css'], comments: 5 },
            { id: 5, title: 'Авторизация JWT', description: 'Реализовать JWT авторизацию и middleware для проверки токенов', priority: 'high', assignee: 'Иван Петров', assigneeAvatar: 'https://randomuser.me/api/portraits/men/1.jpg', deadline: '2026-03-21', hours: 12, status: 'in-progress', tags: ['backend', 'security'], comments: 2 },
            { id: 6, title: 'Интеграция с телефонией', description: 'Подключить API телефонии для записи звонков', priority: 'medium', assignee: 'Петр Сидоров', assigneeAvatar: 'https://randomuser.me/api/portraits/men/5.jpg', deadline: '2026-03-26', hours: 20, status: 'in-progress', tags: ['api', 'integration'] },
            
            // Review
            { id: 7, title: 'Код-ревью авторизации', description: 'Проверить пул-реквест с реализацией JWT', priority: 'medium', assignee: 'Алексей Иванов', assigneeAvatar: 'https://randomuser.me/api/portraits/men/3.jpg', deadline: '2026-03-19', hours: 2, status: 'review', tags: ['review', 'security'], comments: 4 },
            { id: 8, title: 'Тестирование API', description: 'Провести тестирование всех эндпоинтов Postman', priority: 'high', assignee: 'Дмитрий Козлов', assigneeAvatar: 'https://randomuser.me/api/portraits/men/6.jpg', deadline: '2026-03-20', hours: 6, status: 'review', tags: ['testing', 'api'] },
            
            // Done
            { id: 9, title: 'Настройка Git репозитория', description: 'Инициализировать репозиторий, настроить .gitignore', priority: 'low', assignee: 'Иван Петров', assigneeAvatar: 'https://randomuser.me/api/portraits/men/1.jpg', deadline: '2026-03-15', hours: 1, status: 'done', tags: ['git'] },
            { id: 10, title: 'Документация проекта', description: 'Написать README и базовую документацию', priority: 'low', assignee: 'Мария Смирнова', assigneeAvatar: 'https://randomuser.me/api/portraits/women/2.jpg', deadline: '2026-03-16', hours: 3, status: 'done', tags: ['docs'] },
            { id: 11, title: 'Установка зависимостей', description: 'Установить все необходимые пакеты через composer и npm', priority: 'medium', assignee: 'Алексей Иванов', assigneeAvatar: 'https://randomuser.me/api/portraits/men/3.jpg', deadline: '2026-03-14', hours: 2, status: 'done', tags: ['setup'] }
        ];
    }
    
    /**
     * Рендер доски
     */
    renderBoard() {
        this.groupTasksByStatus();
        
        for (const [status, column] of Object.entries(this.columns)) {
            this.renderColumn(status, column.tasks);
        }
        
        this.updateCounts();
    }
    
    /**
     * Группировка задач по статусам
     */
    groupTasksByStatus() {
        // Очищаем задачи в колонках
        for (const status in this.columns) {
            this.columns[status].tasks = [];
        }
        
        // Группируем
        this.tasks.forEach(task => {
            const status = task.status;
            if (this.columns[status]) {
                this.columns[status].tasks.push(task);
            } else {
                console.warn(`Неизвестный статус: ${status}`);
            }
        });
        
        // Сортируем по позиции
        for (const status in this.columns) {
            this.columns[status].tasks.sort((a, b) => (a.position || 0) - (b.position || 0));
        }
    }
    
    /**
     * Рендер колонки
     */
    renderColumn(status, tasks) {
        const container = document.getElementById(`${status}Tasks`);
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-column">Нет задач</div>';
            return;
        }
        
        container.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');
    }
    
    /**
     * Рендер карточки задачи
     */
    renderTaskCard(task) {
        const isUrgent = this.isUrgent(task.deadline);
        const deadlineText = this.formatDeadline(task.deadline);
        
        return `
            <div class="task-card" draggable="true" 
                 data-id="${task.id}" 
                 data-status="${task.status}"
                 ondragstart="kanban.dragStart(event)"
                 ondragend="kanban.dragEnd(event)"
                 onclick="kanban.openTaskDetails(${task.id})">
                
                <div class="task-priority priority-${task.priority}"></div>
                
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                
                <div class="task-description">${this.truncateText(this.escapeHtml(task.description), 60)}</div>
                
                <div class="task-meta">
                    <div class="task-assignee">
                        <img src="${task.assigneeAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" 
                             alt="${this.escapeHtml(task.assignee)}">
                        <span>${this.escapeHtml(task.assignee || 'Не назначен')}</span>
                    </div>
                    
                    <div class="task-deadline ${isUrgent ? 'urgent' : ''}">
                        <i class="far fa-calendar-alt"></i>
                        <span>${deadlineText}</span>
                    </div>
                </div>
                
                <div class="task-footer">
                    <div class="task-tags">
                        ${(task.tags || []).map(tag => 
                            `<span class="skill-tag small">${this.escapeHtml(tag)}</span>`
                        ).join('')}
                    </div>
                    
                    <div class="task-stats">
                        ${task.comments ? `<span><i class="far fa-comment"></i> ${task.comments}</span>` : ''}
                        ${task.attachments ? `<span><i class="far fa-paperclip"></i> ${task.attachments}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Инициализация Drag & Drop
     */
    initDragAndDrop() {
        const containers = document.querySelectorAll('.tasks-container');
        containers.forEach(container => {
            container.addEventListener('dragover', (e) => this.dragOver(e));
            container.addEventListener('dragleave', (e) => this.dragLeave(e));
            container.addEventListener('drop', (e) => this.drop(e));
        });
        
        // Предотвращаем стандартное поведение для всей страницы
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }
    
    /**
     * Начало перетаскивания
     */
    dragStart(e) {
        const card = e.target.closest('.task-card');
        if (!card) return;
        
        this.draggedItem = card;
        card.classList.add('dragging');
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            id: card.dataset.id,
            status: card.dataset.status
        }));
        
        e.dataTransfer.effectAllowed = 'move';
    }
    
    /**
     * Завершение перетаскивания
     */
    dragEnd(e) {
        const card = e.target.closest('.task-card');
        if (card) {
            card.classList.remove('dragging');
        }
        
        document.querySelectorAll('.tasks-container').forEach(c => {
            c.classList.remove('drag-over');
        });
        
        this.draggedItem = null;
    }
    
    /**
     * Перетаскивание над элементом
     */
    dragOver(e) {
        e.preventDefault();
        const container = e.currentTarget;
        container.classList.add('drag-over');
    }
    
    /**
     * Уход с элемента
     */
    dragLeave(e) {
        const container = e.currentTarget;
        container.classList.remove('drag-over');
    }
    
    /**
     * Сброс
     */
    drop(e) {
        e.preventDefault();
        
        const container = e.currentTarget;
        container.classList.remove('drag-over');
        
        if (!this.draggedItem) return;
        
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const taskId = parseInt(data.id);
        const oldStatus = data.status;
        const newStatus = container.closest('.kanban-column').dataset.status;
        
        if (oldStatus === newStatus) {
            this.reorderTasks(taskId, oldStatus, e.clientY);
            return;
        }
        
        this.moveTask(taskId, oldStatus, newStatus);
    }
    
    /**
     * Перемещение задачи между колонками
     */
    moveTask(taskId, oldStatus, newStatus) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        // Обновляем статус
        this.tasks[taskIndex].status = newStatus;
        
        // Обновляем позицию
        const newPosition = this.columns[newStatus].tasks.length;
        this.tasks[taskIndex].position = newPosition;
        
        // Перерисовываем
        this.renderBoard();
        
        // Сохраняем
        this.saveTasks();
        
        // Анимация
        app.showNotification(`Задача перемещена в ${this.columns[newStatus].title}`, 'success');
        
        // Отправляем на сервер
        if (API && API.tasks) {
            API.tasks.move(taskId, newStatus, newPosition).catch(() => {
                console.error('Ошибка синхронизации с сервером');
            });
        }
    }
    
    /**
     * Переупорядочивание задач в колонке
     */
    reorderTasks(taskId, status, clientY) {
        const container = document.getElementById(`${status}Tasks`);
        const cards = [...container.querySelectorAll('.task-card')];
        
        // Находим позицию для вставки
        const insertBefore = this.findInsertPosition(cards, clientY);
        
        // Получаем текущий индекс задачи
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        // Получаем задачи в колонке
        const columnTasks = this.tasks.filter(t => t.status === status);
        const oldPosition = columnTasks.findIndex(t => t.id === taskId);
        
        // Определяем новую позицию
        let newPosition;
        if (insertBefore) {
            const beforeId = parseInt(insertBefore.dataset.id);
            newPosition = columnTasks.findIndex(t => t.id === beforeId);
        } else {
            newPosition = columnTasks.length - 1;
        }
        
        if (oldPosition === newPosition) return;
        
        // Обновляем позиции
        columnTasks.splice(oldPosition, 1);
        columnTasks.splice(newPosition, 0, this.tasks[taskIndex]);
        
        // Обновляем позиции в массиве tasks
        columnTasks.forEach((task, idx) => {
            const t = this.tasks.find(t => t.id === task.id);
            if (t) t.position = idx;
        });
        
        // Перерисовываем
        this.renderColumn(status, columnTasks);
        
        // Сохраняем
        this.saveTasks();
    }
    
    /**
     * Поиск позиции для вставки
     */
    findInsertPosition(cards, clientY) {
        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            
            if (clientY < mid) {
                return card;
            }
        }
        return null;
    }
    
    /**
     * Открытие деталей задачи
     */
    openTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Здесь можно открыть модальное окно с деталями
        app.openModal('viewTask');
        
        // Заполняем данными
        document.getElementById('viewTaskTitle').textContent = task.title;
        document.getElementById('viewTaskDescription').textContent = task.description;
        document.getElementById('viewTaskStatus').textContent = this.columns[task.status].title;
        document.getElementById('viewTaskAssignee').textContent = task.assignee || 'Не назначен';
        document.getElementById('viewTaskDeadline').textContent = task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : 'Не указан';
        document.getElementById('viewTaskPriority').className = `task-priority-large priority-${task.priority}`;
        document.getElementById('viewTaskPriority').innerHTML = `<i class="fas fa-flag"></i> ${task.priority.toUpperCase()}`;
        
        // Теги
        const tagsContainer = document.getElementById('viewTaskTags');
        if (task.tags && task.tags.length) {
            tagsContainer.innerHTML = task.tags.map(tag => 
                `<span class="skill-tag">${tag}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = 'Нет тегов';
        }
        
        // Сохраняем ID текущей задачи
        this.currentTaskId = taskId;
    }
    
    /**
     * Создание новой задачи
     */
    openTaskModal(status = 'todo') {
        document.getElementById('taskId').value = '';
        document.getElementById('taskStatus').value = status;
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskAssignee').value = '';
        document.getElementById('taskDeadline').value = '';
        document.getElementById('taskHours').value = '';
        document.getElementById('taskTags').value = '';
        
        // Сброс выбора приоритета
        document.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.priority-option.medium').classList.add('selected');
        
        app.openModal('task');
    }
    
    /**
     * Сохранение задачи
     */
    saveTask(taskData) {
        if (taskData.id) {
            // Обновление
            const index = this.tasks.findIndex(t => t.id === taskData.id);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData };
            }
        } else {
            // Создание
            const newId = Math.max(...this.tasks.map(t => t.id), 0) + 1;
            this.tasks.push({
                id: newId,
                ...taskData,
                comments: 0,
                attachments: 0
            });
        }
        
        this.renderBoard();
        this.saveTasks();
        app.closeModal(document.getElementById('taskModal'));
        app.showNotification('Задача сохранена', 'success');
    }
    
    /**
     * Удаление задачи
     */
    deleteTask(taskId) {
        if (!confirm('Удалить задачу?')) return;
        
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.renderBoard();
        this.saveTasks();
        app.closeModal(document.getElementById('viewTaskModal'));
        app.showNotification('Задача удалена', 'success');
    }
    
    /**
     * Сохранение задач
     */
    saveTasks() {
        localStorage.setItem(`kanban_${this.currentProject}`, JSON.stringify(this.tasks));
    }
    
    /**
     * Инициализация автосохранения
     */
    initAutoSave() {
        setInterval(() => {
            this.saveTasks();
        }, 30000); // Каждые 30 секунд
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        // Смена проекта
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', (e) => {
                this.currentProject = parseInt(e.target.value);
                this.loadTasks();
            });
        }
        
        // Сохранение
        const saveBtn = document.getElementById('saveBoardBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveTasks();
                app.showNotification('Доска сохранена', 'success');
            });
        }
        
        // Фильтры
        const filterInput = document.getElementById('taskFilter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.filterTasks(e.target.value);
            });
        }
    }
    
    /**
     * Фильтрация задач
     */
    filterTasks(query) {
        const lowerQuery = query.toLowerCase();
        
        document.querySelectorAll('.task-card').forEach(card => {
            const title = card.querySelector('.task-title').textContent.toLowerCase();
            const description = card.querySelector('.task-description')?.textContent.toLowerCase() || '';
            
            if (title.includes(lowerQuery) || description.includes(lowerQuery)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    /**
     * Обновление счетчиков
     */
    updateCounts() {
        for (const [status, column] of Object.entries(this.columns)) {
            const countEl = document.getElementById(`${status}Count`);
            if (countEl) {
                countEl.textContent = column.tasks.length;
            }
        }
    }
    
    /**
     * Проверка срочности
     */
    isUrgent(date) {
        if (!date) return false;
        const deadline = new Date(date);
        const today = new Date();
        const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return diff <= 2;
    }
    
    /**
     * Форматирование дедлайна
     */
    formatDeadline(date) {
        if (!date) return 'Нет срока';
        
        const deadline = new Date(date);
        const today = new Date();
        const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        
        if (diff < 0) return 'Просрочен';
        if (diff === 0) return 'Сегодня';
        if (diff === 1) return 'Завтра';
        if (diff <= 7) return `Через ${diff} дн.`;
        return deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    
    /**
     * Обрезка текста
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('kanbanBoard')) {
        window.kanban = new KanbanBoard();
    }
});