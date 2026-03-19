/**
 * PROJECTS.JS - Управление проектами
 * Задания: 4, 5 (работа с проектами)
 */

class ProjectManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {
            category: 'all',
            minBudget: null,
            maxBudget: null,
            skills: [],
            search: '',
            status: 'open'
        };
        
        this.init();
    }
    
    init() {
        this.loadProjects();
        this.initFilters();
        this.initSearch();
    }
    
    /**
     * Загрузка проектов
     */
    async loadProjects() {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        try {
            container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Загрузка проектов...</p></div>';
            
            const params = {
                page: this.currentPage,
                limit: 9,
                ...this.filters
            };
            
            if (this.filters.skills.length) {
                params.skills = this.filters.skills.join(',');
            }
            
            const response = await API.projects.getAll(params);
            
            this.totalPages = response.pagination.pages;
            this.renderProjects(response.data);
            this.renderPagination(response.pagination);
            
        } catch (error) {
            console.error('Ошибка загрузки проектов:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить проекты. Попробуйте позже.</p>
                    <button class="btn-primary" onclick="projectManager.loadProjects()">
                        <i class="fas fa-sync-alt"></i> Повторить
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Рендер проектов
     */
    renderProjects(projects) {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        if (!projects || projects.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        container.innerHTML = projects.map(project => this.renderProjectCard(project)).join('');
    }
    
    /**
     * Рендер карточки проекта
     */
    renderProjectCard(project) {
        const budget = this.formatBudget(project.budget_min, project.budget_max);
        const deadline = this.formatDeadline(project.deadline);
        const skills = project.skills || [];
        
        return `
            <div class="project-card" onclick="viewProject(${project.id})">
                <div class="project-header">
                    <h3>${this.escapeHtml(project.title)}</h3>
                    <div class="project-budget">${budget}</div>
                </div>
                <div class="project-body">
                    <p class="project-description">${this.truncateText(this.escapeHtml(project.description), 120)}</p>
                    <div class="project-skills">
                        ${skills.map(skill => 
                            `<span class="skill-tag">${this.escapeHtml(skill.name || skill)}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="project-footer">
                    <div class="client-info">
                        <img src="${project.client_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" 
                             class="client-avatar" alt="${this.escapeHtml(project.client_name || 'Клиент')}">
                        <span>${this.escapeHtml(project.client_name || 'Пользователь')}</span>
                    </div>
                    <div class="project-deadline ${this.isUrgent(project.deadline) ? 'urgent' : ''}">
                        <i class="far fa-clock"></i>
                        <span>${deadline}</span>
                    </div>
                </div>
                ${project.is_featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Рекомендуем</div>' : ''}
            </div>
        `;
    }
    
    /**
     * Рендер пагинации
     */
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        if (pagination.pages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Кнопка "Назад"
        if (pagination.page > 1) {
            html += `<button class="page-btn" onclick="projectManager.changePage(${pagination.page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // Номера страниц
        for (let i = 1; i <= pagination.pages; i++) {
            if (i === 1 || i === pagination.pages || 
                (i >= pagination.page - 2 && i <= pagination.page + 2)) {
                html += `<button class="page-btn ${i === pagination.page ? 'active' : ''}" 
                               onclick="projectManager.changePage(${i})">${i}</button>`;
            } else if (i === pagination.page - 3 || i === pagination.page + 3) {
                html += `<span class="page-dots">...</span>`;
            }
        }
        
        // Кнопка "Вперед"
        if (pagination.page < pagination.pages) {
            html += `<button class="page-btn" onclick="projectManager.changePage(${pagination.page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        container.innerHTML = html;
    }
    
    /**
     * Изменение страницы
     */
    changePage(page) {
        this.currentPage = page;
        this.loadProjects();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * Инициализация фильтров
     */
    initFilters() {
        const filterForm = document.getElementById('filterForm');
        if (!filterForm) return;
        
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyFilters();
        });
        
        // Категория
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.category = categoryFilter.value;
                this.debouncedApplyFilters();
            });
        }
        
        // Бюджет
        const minBudget = document.getElementById('minBudget');
        const maxBudget = document.getElementById('maxBudget');
        
        if (minBudget) {
            minBudget.addEventListener('input', () => {
                this.filters.minBudget = minBudget.value || null;
                this.debouncedApplyFilters();
            });
        }
        
        if (maxBudget) {
            maxBudget.addEventListener('input', () => {
                this.filters.maxBudget = maxBudget.value || null;
                this.debouncedApplyFilters();
            });
        }
        
        // Навыки
        document.querySelectorAll('.skill-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSkillsFilter();
                this.debouncedApplyFilters();
            });
        });
    }
    
    /**
     * Обновление фильтра навыков
     */
    updateSkillsFilter() {
        this.filters.skills = Array.from(document.querySelectorAll('.skill-checkbox input:checked'))
            .map(cb => cb.value);
    }
    
    /**
     * Применение фильтров
     */
    applyFilters() {
        this.currentPage = 1;
        this.loadProjects();
        
        // Обновляем URL с параметрами фильтрации
        const url = new URL(window.location);
        url.searchParams.set('page', this.currentPage);
        if (this.filters.category !== 'all') url.searchParams.set('category', this.filters.category);
        if (this.filters.minBudget) url.searchParams.set('min_budget', this.filters.minBudget);
        if (this.filters.maxBudget) url.searchParams.set('max_budget', this.filters.maxBudget);
        if (this.filters.skills.length) url.searchParams.set('skills', this.filters.skills.join(','));
        if (this.filters.search) url.searchParams.set('search', this.filters.search);
        
        window.history.pushState({}, '', url);
    }
    
    /**
     * Сброс фильтров
     */
    resetFilters() {
        this.filters = {
            category: 'all',
            minBudget: null,
            maxBudget: null,
            skills: [],
            search: '',
            status: 'open'
        };
        
        // Сброс полей формы
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) categoryFilter.value = 'all';
        
        const minBudget = document.getElementById('minBudget');
        if (minBudget) minBudget.value = '';
        
        const maxBudget = document.getElementById('maxBudget');
        if (maxBudget) maxBudget.value = '';
        
        document.querySelectorAll('.skill-checkbox input').forEach(cb => cb.checked = false);
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        this.applyFilters();
    }
    
    /**
     * Инициализация поиска
     */
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.debouncedApplyFilters();
        });
    }
    
    /**
     * Debounced применение фильтров
     */
    debouncedApplyFilters = this.debounce(() => {
        this.applyFilters();
    }, 500);
    
    /**
     * Детальная страница проекта
     */
    async loadProjectDetails(projectId) {
        try {
            const response = await API.projects.getById(projectId);
            this.renderProjectDetails(response.data);
        } catch (error) {
            console.error('Ошибка загрузки проекта:', error);
            app.showNotification('Ошибка загрузки проекта', 'error');
        }
    }
    
    /**
     * Рендер детальной страницы
     */
    renderProjectDetails(project) {
        // Обновляем мета-теги для SEO
        document.title = `${project.title} | Project Collab Hub`;
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = project.description.substring(0, 160);
        }
        
        // Здесь рендеринг детальной страницы
        // (реализуется при необходимости)
    }
    
    /**
     * Создание проекта
     */
    async createProject(projectData) {
        try {
            const response = await API.projects.create(projectData);
            app.showNotification('Проект успешно создан!', 'success');
            
            setTimeout(() => {
                window.location.href = `/pages/project-detail.html?id=${response.project_id}`;
            }, 1500);
            
        } catch (error) {
            app.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Обновление проекта
     */
    async updateProject(projectId, projectData) {
        try {
            await API.projects.update(projectId, projectData);
            app.showNotification('Проект обновлен', 'success');
        } catch (error) {
            app.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Удаление проекта
     */
    async deleteProject(projectId) {
        if (!confirm('Вы уверены, что хотите удалить проект?')) return;
        
        try {
            await API.projects.delete(projectId);
            app.showNotification('Проект удален', 'success');
            
            setTimeout(() => {
                window.location.href = '/pages/projects.html';
            }, 1500);
            
        } catch (error) {
            app.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Отклик на проект
     */
    async applyToProject(projectId, proposalData) {
        try {
            await API.post(`/projects/${projectId}/proposals`, proposalData);
            app.showNotification('Отклик отправлен!', 'success');
        } catch (error) {
            app.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Форматирование бюджета
     */
    formatBudget(min, max) {
        if (!min && !max) return 'Договорная';
        if (min && max) return `${this.formatNumber(min)} - ${this.formatNumber(max)} ₽`;
        if (min) return `от ${this.formatNumber(min)} ₽`;
        return `до ${this.formatNumber(max)} ₽`;
    }
    
    /**
     * Форматирование числа
     */
    formatNumber(num) {
        return num ? num.toLocaleString('ru-RU') : '0';
    }
    
    /**
     * Форматирование дедлайна
     */
    formatDeadline(date) {
        if (!date) return 'Срок не указан';
        
        const deadline = new Date(date);
        const today = new Date();
        const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        
        if (diff < 0) return 'Просрочен';
        if (diff === 0) return 'Сегодня';
        if (diff === 1) return 'Завтра';
        if (diff <= 7) return `Через ${diff} дн.`;
        return deadline.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    /**
     * Проверка срочности
     */
    isUrgent(date) {
        if (!date) return false;
        const deadline = new Date(date);
        const today = new Date();
        const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return diff <= 3;
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
    
    /**
     * Пустое состояние
     */
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Проекты не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
                <button class="btn-primary" onclick="projectManager.resetFilters()">
                    <i class="fas fa-undo"></i> Сбросить фильтры
                </button>
            </div>
        `;
    }
    
    /**
     * Debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Инициализация
const projectManager = new ProjectManager();

// Глобальные функции
window.viewProject = (id) => {
    window.location.href = `/pages/project-detail.html?id=${id}`;
};

window.applyToProject = (id) => {
    if (!API.auth.isAuthenticated()) {
        app.openModal('login');
        app.showNotification('Необходимо войти в систему', 'warning');
    } else {
        document.getElementById('projectId')?.setAttribute('value', id);
        app.openModal('apply');
    }
};

// Экспорт
window.projectManager = projectManager;