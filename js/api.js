/**
 * API.JS - RESTful API клиент
 * Задания: 5 (REST API), 6 (безопасность)
 */

const API = {
    baseUrl: '/api',
    
    /**
     * Заголовки запроса
     */
    headers() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Protected': '1'
        };
        
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    /**
     * Базовый метод запроса
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.headers(),
                ...options.headers
            }
        };
        
        // Добавляем CSRF токен для мутирующих запросов
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            }
        }
        
        try {
            const startTime = performance.now();
            const response = await fetch(url, config);
            const endTime = performance.now();
            
            // Логируем время выполнения запроса в режиме отладки
            if (app.config.debug) {
                console.log(`📡 API ${options.method || 'GET'} ${endpoint} - ${Math.round(endTime - startTime)}ms`);
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API Error');
            }
            
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    },
    
    /**
     * GET запрос
     */
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    },
    
    /**
     * POST запрос
     */
    post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * PUT запрос
     */
    put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * PATCH запрос
     */
    patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * DELETE запрос
     */
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    /**
     * Загрузка файла
     */
    upload(endpoint, file, onProgress = null) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const xhr = new XMLHttpRequest();
            
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        onProgress(progress);
                    }
                });
            }
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            };
            
            xhr.onerror = () => reject(new Error('Upload failed'));
            
            xhr.open('POST', `${this.baseUrl}${endpoint}`);
            
            const token = localStorage.getItem('authToken');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            
            xhr.send(formData);
        });
    },
    
    /**
     * Пакетные запросы
     */
    async batch(requests) {
        return this.post('/batch', { requests });
    },
    
    // ===== Аутентификация =====
    auth: {
        /**
         * Регистрация
         */
        async register(userData) {
            return API.post('/auth/register', userData);
        },
        
        /**
         * Вход
         */
        async login(credentials) {
            const data = await API.post('/auth/login', credentials);
            
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        },
        
        /**
         * Текущий пользователь
         */
        async me() {
            return API.get('/auth/me');
        },
        
        /**
         * Обновление токена
         */
        async refresh() {
            return API.post('/auth/refresh');
        },
        
        /**
         * Выход
         */
        logout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        },
        
        /**
         * Проверка авторизации
         */
        isAuthenticated() {
            return !!localStorage.getItem('authToken');
        },
        
        /**
         * Получение текущего пользователя
         */
        getCurrentUser() {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
    },
    
    // ===== Проекты =====
    projects: {
        /**
         * Получение всех проектов
         */
        async getAll(params = {}) {
            return API.get('/projects', params);
        },
        
        /**
         * Получение проекта по ID
         */
        async getById(id) {
            return API.get(`/projects/${id}`);
        },
        
        /**
         * Создание проекта
         */
        async create(projectData) {
            return API.post('/projects', projectData);
        },
        
        /**
         * Обновление проекта
         */
        async update(id, projectData) {
            return API.put(`/projects/${id}`, projectData);
        },
        
        /**
         * Удаление проекта
         */
        async delete(id) {
            return API.delete(`/projects/${id}`);
        },
        
        /**
         * Поиск проектов
         */
        async search(query) {
            return API.get('/projects/search', { q: query });
        },
        
        /**
         * Избранные проекты
         */
        async getFeatured(limit = 6) {
            return API.get('/projects/featured', { limit });
        },
        
        /**
         * Добавление навыка к проекту
         */
        async addSkill(projectId, skillId) {
            return API.post(`/projects/${projectId}/skills`, { skillId });
        },
        
        /**
         * Получение команды проекта
         */
        async getTeam(projectId) {
            return API.get(`/projects/${projectId}/team`);
        },
        
        /**
         * Добавление участника в команду
         */
        async addTeamMember(projectId, userId, role = 'member') {
            return API.post(`/projects/${projectId}/team`, { userId, role });
        }
    },
    
    // ===== Задачи (Kanban) =====
    tasks: {
        /**
         * Получение задач проекта
         */
        async getByProject(projectId) {
            return API.get(`/projects/${projectId}/tasks`);
        },
        
        /**
         * Создание задачи
         */
        async create(projectId, taskData) {
            return API.post(`/projects/${projectId}/tasks`, taskData);
        },
        
        /**
         * Обновление задачи
         */
        async update(taskId, taskData) {
            return API.put(`/tasks/${taskId}`, taskData);
        },
        
        /**
         * Перемещение задачи
         */
        async move(taskId, status, position) {
            return API.patch(`/tasks/${taskId}/move`, { status, position });
        },
        
        /**
         * Удаление задачи
         */
        async delete(taskId) {
            return API.delete(`/tasks/${taskId}`);
        },
        
        /**
         * Добавление комментария
         */
        async addComment(taskId, comment) {
            return API.post(`/tasks/${taskId}/comments`, { comment });
        },
        
        /**
         * Получение комментариев
         */
        async getComments(taskId) {
            return API.get(`/tasks/${taskId}/comments`);
        }
    },
    
    // ===== Пользователи =====
    users: {
        /**
         * Получение профиля
         */
        async getProfile(userId) {
            return API.get(`/users/${userId}`);
        },
        
        /**
         * Обновление профиля
         */
        async updateProfile(userId, userData) {
            return API.put(`/users/${userId}`, userData);
        },
        
        /**
         * Получение навыков пользователя
         */
        async getSkills(userId) {
            return API.get(`/users/${userId}/skills`);
        },
        
        /**
         * Добавление навыка
         */
        async addSkill(userId, skillId, level = 'intermediate') {
            return API.post(`/users/${userId}/skills`, { skillId, level });
        },
        
        /**
         * Удаление навыка
         */
        async removeSkill(userId, skillId) {
            return API.delete(`/users/${userId}/skills/${skillId}`);
        },
        
        /**
         * Получение проектов пользователя
         */
        async getProjects(userId, status = null) {
            const params = status ? { status } : {};
            return API.get(`/users/${userId}/projects`, params);
        },
        
        /**
         * Поиск пользователей
         */
        async search(query) {
            return API.get('/users/search', { q: query });
        }
    },
    
    // ===== Сообщения =====
    messages: {
        /**
         * Получение диалогов
         */
        async getConversations() {
            return API.get('/messages/conversations');
        },
        
        /**
         * Получение сообщений диалога
         */
        async getMessages(conversationId, page = 1) {
            return API.get(`/messages/${conversationId}`, { page });
        },
        
        /**
         * Отправка сообщения
         */
        async send(conversationId, message) {
            return API.post(`/messages/${conversationId}`, { message });
        },
        
        /**
         * Отметить как прочитанное
         */
        async markAsRead(conversationId) {
            return API.post(`/messages/${conversationId}/read`);
        },
        
        /**
         * Удаление сообщения
         */
        async delete(messageId) {
            return API.delete(`/messages/${messageId}`);
        }
    },
    
    // ===== Отзывы =====
    reviews: {
        /**
         * Получение отзывов пользователя
         */
        async getUserReviews(userId) {
            return API.get(`/users/${userId}/reviews`);
        },
        
        /**
         * Создание отзыва
         */
        async create(projectId, reviewData) {
            return API.post(`/projects/${projectId}/reviews`, reviewData);
        },
        
        /**
         * Обновление отзыва
         */
        async update(reviewId, reviewData) {
            return API.put(`/reviews/${reviewId}`, reviewData);
        },
        
        /**
         * Удаление отзыва
         */
        async delete(reviewId) {
            return API.delete(`/reviews/${reviewId}`);
        }
    },
    
    // ===== Уведомления =====
    notifications: {
        /**
         * Получение уведомлений
         */
        async getAll(page = 1) {
            return API.get('/notifications', { page });
        },
        
        /**
         * Отметить как прочитанное
         */
        async markAsRead(notificationId) {
            return API.post(`/notifications/${notificationId}/read`);
        },
        
        /**
         * Отметить все как прочитанные
         */
        async markAllAsRead() {
            return API.post('/notifications/read-all');
        },
        
        /**
         * Удаление уведомления
         */
        async delete(notificationId) {
            return API.delete(`/notifications/${notificationId}`);
        },
        
        /**
         * Получение количества непрочитанных
         */
        async getUnreadCount() {
            return API.get('/notifications/unread-count');
        }
    },
    
    // ===== Статистика =====
    stats: {
        /**
         * Получение статистики платформы
         */
        async getPlatformStats() {
            return API.get('/stats/platform');
        },
        
        /**
         * Получение статистики пользователя
         */
        async getUserStats(userId) {
            return API.get(`/users/${userId}/stats`);
        },
        
        /**
         * Получение статистики проекта
         */
        async getProjectStats(projectId) {
            return API.get(`/projects/${projectId}/stats`);
        }
    },
    
    // ===== Поиск =====
    search: {
        /**
         * Глобальный поиск
         */
        async global(query, types = ['projects', 'users']) {
            return API.get('/search', { q: query, types: types.join(',') });
        },
        
        /**
         * Поиск проектов
         */
        async projects(query, filters = {}) {
            return API.get('/search/projects', { q: query, ...filters });
        },
        
        /**
         * Поиск пользователей
         */
        async users(query, filters = {}) {
            return API.get('/search/users', { q: query, ...filters });
        }
    },
    
    // ===== Безопасность (Задание 6-7) =====
    security: {
        /**
         * Генерация RSA ключей
         */
        async generateRSA() {
            return API.get('/security/rsa/generate');
        },
        
        /**
         * RSA шифрование
         */
        async encryptRSA(data, publicKey) {
            return API.post('/security/rsa/encrypt', { data, publicKey });
        },
        
        /**
         * RSA дешифрование
         */
        async decryptRSA(data, privateKey) {
            return API.post('/security/rsa/decrypt', { data, privateKey });
        },
        
        /**
         * Диффи-Хеллман обмен
         */
        async diffieHellman(params) {
            return API.post('/security/dh', params);
        },
        
        /**
         * Эль-Гамаль подпись
         */
        async elGamal(data) {
            return API.post('/security/elgamal', { data });
        },
        
        /**
         * Проверка Эль-Гамаль подписи
         */
        async verifyElGamal(data, signature, publicKey) {
            return API.post('/security/elgamal/verify', { data, signature, publicKey });
        },
        
        /**
         * Генерация PRNG
         */
        async generatePRNG(length = 8) {
            return API.get('/security/prng', { length });
        },
        
        /**
         * Поля Галуа
         */
        async galoisField() {
            return API.get('/security/galois');
        },
        
        /**
         * DES шифрование
         */
        async des(data, key, mode = 'encrypt') {
            return API.post('/security/des', { data, key, mode });
        },
        
        /**
         * AES шифрование
         */
        async aes(data, key, mode = 'encrypt') {
            return API.post('/security/aes', { data, key, mode });
        },
        
        /**
         * Аудит безопасности
         */
        async audit() {
            return API.get('/security/audit');
        }
    },
    
    // ===== SEO (Задание 8-9) =====
    seo: {
        /**
         * SEO аудит
         */
        async analyze(url) {
            return API.post('/seo/analyze', { url });
        },
        
        /**
         * Получение ключевых слов
         */
        async getKeywords() {
            return API.get('/seo/keywords');
        },
        
        /**
         * Кластеризация ключевых слов
         */
        async cluster(keywords) {
            return API.post('/seo/cluster', { keywords });
        },
        
        /**
         * Оптимизация изображений
         */
        async optimizeImages() {
            return API.post('/seo/optimize-images');
        },
        
        /**
         * Поиск битых ссылок
         */
        async findBrokenLinks() {
            return API.get('/seo/broken-links');
        },
        
        /**
         * Поиск дублей
         */
        async findDuplicates() {
            return API.get('/seo/duplicates');
        },
        
        /**
         * Оптимизация кода
         */
        async optimizeCode() {
            return API.post('/seo/optimize-code');
        }
    }
};

// Экспорт в глобальную область
window.API = API;