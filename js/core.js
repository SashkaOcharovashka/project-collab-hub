/**
 * CORE.JS - Ядро системы Project Collab Hub
 * Задания: 4 (валидация, динамика), 6 (безопасность)
 */

class ProjectCollabHub {
    constructor() {
        this.config = {
            apiUrl: '/api',
            debug: true,
            version: '2.0.0'
        };
        
        this.state = {
            user: null,
            token: localStorage.getItem('authToken'),
            projects: [],
            filters: {
                category: 'all',
                budget: null,
                skills: []
            },
            theme: 'dark'
        };
        
        this.init();
    }
    
    async init() {
        console.log(`🚀 Project Collab Hub v${this.config.version} инициализация...`);
        
        this.checkAuth();
        this.initEventListeners();
        this.initAnimations();
        this.initPreloader();
        this.loadInitialData();
        this.initTheme();
        
        console.log('✅ Project Collab Hub готов к работе');
    }
    
    /**
     * Проверка авторизации
     */
    checkAuth() {
        if (this.state.token) {
            this.loadUserData();
            this.updateUIForAuth();
        }
    }
    
    /**
     * Загрузка данных пользователя
     */
    async loadUserData() {
        try {
            const response = await this.apiRequest('/auth/me');
            this.state.user = response.user;
            this.updateUIForAuth();
        } catch (error) {
            console.error('❌ Ошибка авторизации:', error);
            this.logout();
        }
    }
    
    /**
     * Обновление UI для авторизованного пользователя
     */
    updateUIForAuth() {
        const authButtons = document.querySelector('.nav-actions');
        if (authButtons && this.state.user) {
            authButtons.innerHTML = `
                <div class="dropdown">
                    <button class="btn-ghost dropdown-toggle">
                        <img src="${this.state.user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" 
                             class="avatar avatar-sm" style="width: 30px; height: 30px;">
                        <span>${this.state.user.name}</span>
                    </button>
                    <div class="dropdown-menu">
                        <a href="pages/profile.html" class="dropdown-item">
                            <i class="fas fa-user"></i> Профиль
                        </a>
                        <a href="pages/projects.html" class="dropdown-item">
                            <i class="fas fa-project-diagram"></i> Мои проекты
                        </a>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item" onclick="app.logout()">
                            <i class="fas fa-sign-out-alt"></i> Выйти
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        // Мобильное меню
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.nav-links').classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
        
        // Закрытие модальных окон
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });
        
        // Клик вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
        
        // Изменение навигации при скролле
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.cyber-nav');
            if (nav) {
                if (window.scrollY > 100) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }
        });
        
        // Валидация форм
        document.querySelectorAll('form[data-validate]').forEach(form => {
            form.addEventListener('submit', (e) => this.validateForm(e));
            form.addEventListener('input', (e) => this.validateField(e.target));
        });
        
        // Плавный скролл для якорей
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    /**
     * Инициализация анимаций
     */
    initAnimations() {
        // Анимация счетчиков
        const statNumbers = document.querySelectorAll('.stat-value[data-target]');
        
        const animateValue = (element, start, end, duration) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                element.innerHTML = Math.floor(progress * (end - start) + start);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };
        
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const targetValue = parseInt(target.getAttribute('data-target'));
                    animateValue(target, 0, targetValue, 2000);
                    observer.unobserve(target);
                }
            });
        }, observerOptions);
        
        statNumbers.forEach(stat => observer.observe(stat));
        
        // Анимация появления элементов
        const fadeElements = document.querySelectorAll('.fade-on-scroll');
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });
        
        fadeElements.forEach(el => fadeObserver.observe(el));
    }
    
    /**
     * Инициализация прелоадера
     */
    initPreloader() {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('fade-out');
            }, 1500);
        }
    }
    
    /**
     * Инициализация темы
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.state.theme = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
    }
    
    /**
     * Переключение темы
     */
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.state.theme);
        document.body.setAttribute('data-theme', this.state.theme);
        this.showNotification(`Тема изменена на ${this.state.theme}`, 'info');
    }
    
    /**
     * Загрузка начальных данных
     */
    async loadInitialData() {
        await this.loadFeaturedProjects();
        await this.loadTestimonials();
        await this.loadSkills();
    }
    
    /**
     * Загрузка избранных проектов
     */
    async loadFeaturedProjects() {
        try {
            const response = await this.apiRequest('/projects/featured');
            this.renderProjects(response.data);
        } catch (error) {
            console.error('❌ Ошибка загрузки проектов:', error);
        }
    }
    
    /**
     * Рендер проектов
     */
    renderProjects(projects) {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        if (!projects || projects.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('проектов');
            return;
        }
        
        container.innerHTML = projects.map(project => `
            <div class="project-card" onclick="window.location.href='pages/project-detail.html?id=${project.id}'">
                <div class="project-header">
                    <h3>${this.escapeHtml(project.title)}</h3>
                    <div class="project-budget">${this.formatBudget(project.budget_min, project.budget_max)}</div>
                </div>
                <div class="project-body">
                    <p class="project-description">${this.truncateText(this.escapeHtml(project.description), 120)}</p>
                    <div class="project-skills">
                        ${(project.skills || []).map(skill => 
                            `<span class="skill-tag">${this.escapeHtml(skill.name)}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="project-footer">
                    <div class="client-info">
                        <img src="${project.client_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" 
                             class="client-avatar" alt="${this.escapeHtml(project.client_name)}">
                        <span>${this.escapeHtml(project.client_name)}</span>
                    </div>
                    <div>
                        <i class="far fa-clock"></i>
                        ${this.formatDeadline(project.deadline)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Загрузка отзывов
     */
    async loadTestimonials() {
        try {
            const response = await this.apiRequest('/testimonials');
            this.renderTestimonials(response.data);
        } catch (error) {
            console.error('❌ Ошибка загрузки отзывов:', error);
        }
    }
    
    /**
     * Рендер отзывов
     */
    renderTestimonials(testimonials) {
        const container = document.getElementById('testimonialsContainer');
        if (!container) return;
        
        container.innerHTML = testimonials.map(t => `
            <div class="testimonial-card">
                <div class="testimonial-content">
                    <i class="fas fa-quote-left"></i>
                    <p>${this.escapeHtml(t.content)}</p>
                </div>
                <div class="testimonial-author">
                    <img src="${t.avatar || 'https://randomuser.me/api/portraits/lego/2.jpg'}" 
                         alt="${this.escapeHtml(t.author)}">
                    <div class="author-info">
                        <h4>${this.escapeHtml(t.author)}</h4>
                        <p>${this.escapeHtml(t.role)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Загрузка навыков
     */
    async loadSkills() {
        try {
            const response = await this.apiRequest('/skills');
            this.renderSkills(response.data);
        } catch (error) {
            console.error('❌ Ошибка загрузки навыков:', error);
        }
    }
    
    /**
     * Рендер навыков для фильтра
     */
    renderSkills(skills) {
        const container = document.getElementById('skillsFilter');
        if (!container) return;
        
        container.innerHTML = skills.map(skill => `
            <label class="skill-checkbox">
                <input type="checkbox" value="${skill.id}">
                <span>${this.escapeHtml(skill.name)}</span>
            </label>
        `).join('');
    }
    
    /**
     * API запрос
     */
    async apiRequest(endpoint, options = {}) {
        const url = `${this.config.apiUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        if (this.state.token) {
            headers['Authorization'] = `Bearer ${this.state.token}`;
        }
        
        const config = {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API Error');
            }
            
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }
    
    /**
     * Валидация формы
     */
    validateForm(e) {
        e.preventDefault();
        const form = e.target;
        let isValid = true;
        
        form.querySelectorAll('[required]').forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Проверка пароля
        const password = form.querySelector('[name="password"]');
        const confirm = form.querySelector('[name="confirm_password"]');
        
        if (password && confirm && password.value !== confirm.value) {
            this.showFieldError(confirm, 'Пароли не совпадают');
            isValid = false;
        }
        
        // Проверка email
        const email = form.querySelector('[type="email"]');
        if (email && email.value && !this.validateEmail(email.value)) {
            this.showFieldError(email, 'Введите корректный email');
            isValid = false;
        }
        
        if (isValid) {
            this.submitForm(form);
        }
        
        return false;
    }
    
    /**
     * Валидация поля
     */
    validateField(field) {
        const value = field.value.trim();
        field.classList.remove('error');
        
        let errorElement = field.nextElementSibling;
        if (!errorElement?.classList.contains('error-message')) {
            errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'Поле обязательно для заполнения');
            return false;
        }
        
        if (field.type === 'email' && value && !this.validateEmail(value)) {
            this.showFieldError(field, 'Введите корректный email');
            return false;
        }
        
        if (field.type === 'password' && field.minLength && value.length < field.minLength) {
            this.showFieldError(field, `Минимум ${field.minLength} символов`);
            return false;
        }
        
        errorElement.textContent = '';
        return true;
    }
    
    /**
     * Валидация email
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Показать ошибку поля
     */
    showFieldError(field, message) {
        field.classList.add('error');
        let error = field.nextElementSibling;
        
        if (!error?.classList.contains('error-message')) {
            error = document.createElement('span');
            error.className = 'error-message';
            field.parentNode.appendChild(error);
        }
        
        error.textContent = message;
    }
    
    /**
     * Отправка формы
     */
    async submitForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(form.action || window.location.href, {
                method: form.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('Успешно!', 'success');
                
                if (result.token) {
                    this.state.token = result.token;
                    localStorage.setItem('authToken', result.token);
                }
                
                if (result.redirect) {
                    setTimeout(() => window.location.href = result.redirect, 1000);
                } else {
                    this.closeModal(form.closest('.modal'));
                }
            } else {
                throw new Error(result.message || 'Ошибка');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    /**
     * Показать уведомление
     */
    showNotification(message, type = 'info', duration = 3000) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icons[type] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <div class="notification-progress"></div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    /**
     * Открыть модальное окно
     */
    openModal(modalId) {
        const modal = document.getElementById(`${modalId}Modal`);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Закрытие по ESC
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal(modal);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }
    }
    
    /**
     * Закрыть модальное окно
     */
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    /**
     * Выход из системы
     */
    logout() {
        localStorage.removeItem('authToken');
        this.state.token = null;
        this.state.user = null;
        window.location.href = '/';
    }
    
    /**
     * Форматирование бюджета
     */
    formatBudget(min, max) {
        if (!min && !max) return 'Договорная';
        if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ₽`;
        if (min) return `от ${min.toLocaleString()} ₽`;
        return `до ${max.toLocaleString()} ₽`;
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
        return deadline.toLocaleDateString('ru-RU');
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Пустое состояние
     */
    getEmptyStateHTML(type) {
        return `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-folder-open"></i>
                <h3>${type.charAt(0).toUpperCase() + type.slice(1)} не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
    }
    
    /**
     * Копирование в буфер обмена
     */
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Скопировано в буфер обмена', 'success');
        }).catch(() => {
            this.showNotification('Ошибка копирования', 'error');
        });
    }
    
    /**
     * Дебаунс
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
    
    /**
     * Троттлинг
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Создание глобального экземпляра
const app = new ProjectCollabHub();

// Экспорт глобальных функций
window.openModal = (modalId) => app.openModal(modalId);
window.closeModal = (modal) => app.closeModal(modal);
window.logout = () => app.logout();
window.app = app;