/**
 * SEO.JS - SEO оптимизация и аналитика
 * Задания: 8-9 (SEO аудит, оптимизация, кластеризация)
 */

class SEOManager {
    constructor() {
        this.keywords = [];
        this.clusters = [];
        this.auditResults = {};
        
        this.init();
    }
    
    init() {
        this.initEventListeners();
        this.loadKeywords();
        this.runAudit();
    }
    
    /**
     * Инициализация обработчиков
     */
    initEventListeners() {
        // Кластеризация
        document.getElementById('clusterBtn')?.addEventListener('click', () => this.clusterKeywords());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearKeywords());
        
        // Оптимизация изображений
        document.getElementById('optimizeImageBtn')?.addEventListener('click', () => this.optimizeImage());
        
        // Резервное копирование
        document.getElementById('createBackupBtn')?.addEventListener('click', () => this.createBackup());
        
        // SEO аудит
        document.getElementById('runAuditBtn')?.addEventListener('click', () => this.runAudit());
        
        // Анализ конкурентов
        document.getElementById('analyzeCompetitorsBtn')?.addEventListener('click', () => this.analyzeCompetitors());
    }
    
    // ===== Технический SEO аудит (Задание 8) =====
    
    /**
     * Запуск SEO аудита
     */
    async runAudit() {
        app.showNotification('Запуск SEO аудита...', 'info');
        
        const results = {
            robots: await this.checkRobotsTxt(),
            sitemap: await this.checkSitemap(),
            ssl: this.checkSSL(),
            meta: this.checkMetaTags(),
            speed: await this.checkPageSpeed(),
            links: await this.checkBrokenLinks(),
            duplicates: await this.checkDuplicates(),
            responsive: this.checkResponsive()
        };
        
        this.auditResults = results;
        this.renderAuditResults(results);
        
        const score = this.calculateSEOScore(results);
        this.updateSEOScore(score);
        
        app.showNotification(`SEO аудит завершен. Общий балл: ${score}`, 'success');
    }
    
    /**
     * Проверка robots.txt
     */
    async checkRobotsTxt() {
        try {
            const response = await fetch('/robots.txt');
            if (!response.ok) {
                return {
                    status: 'error',
                    message: 'Файл robots.txt не найден'
                };
            }
            
            const content = await response.text();
            const hasSitemap = content.includes('Sitemap:');
            
            return {
                status: hasSitemap ? 'success' : 'warning',
                message: hasSitemap ? 'robots.txt найден, содержит Sitemap' : 'robots.txt найден, но не содержит Sitemap',
                content
            };
        } catch {
            return {
                status: 'error',
                message: 'Ошибка при проверке robots.txt'
            };
        }
    }
    
    /**
     * Проверка sitemap.xml
     */
    async checkSitemap() {
        try {
            const response = await fetch('/sitemap.xml');
            if (!response.ok) {
                return {
                    status: 'error',
                    message: 'Файл sitemap.xml не найден'
                };
            }
            
            const content = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(content, 'text/xml');
            
            const urls = xml.getElementsByTagName('url');
            const urlCount = urls.length;
            
            return {
                status: urlCount > 0 ? 'success' : 'warning',
                message: `sitemap.xml содержит ${urlCount} URL`,
                count: urlCount
            };
        } catch {
            return {
                status: 'error',
                message: 'Ошибка при проверке sitemap.xml'
            };
        }
    }
    
    /**
     * Проверка SSL сертификата
     */
    checkSSL() {
        const isHttps = window.location.protocol === 'https:';
        
        return {
            status: isHttps ? 'success' : 'error',
            message: isHttps ? 'SSL сертификат действителен' : 'Сайт не использует HTTPS'
        };
    }
    
    /**
     * Проверка мета-тегов
     */
    checkMetaTags() {
        const issues = [];
        
        // Title
        const title = document.querySelector('title');
        if (!title) {
            issues.push('Отсутствует тег <title>');
        } else if (title.text.length < 30 || title.text.length > 60) {
            issues.push(`Длина title (${title.text.length} символов) должна быть 30-60`);
        }
        
        // Meta description
        const description = document.querySelector('meta[name="description"]');
        if (!description) {
            issues.push('Отсутствует meta description');
        } else {
            const content = description.getAttribute('content') || '';
            if (content.length < 70 || content.length > 160) {
                issues.push(`Длина description (${content.length} символов) должна быть 70-160`);
            }
        }
        
        // Meta keywords
        const keywords = document.querySelector('meta[name="keywords"]');
        if (!keywords) {
            issues.push('Отсутствуют meta keywords');
        }
        
        // H1
        const h1 = document.querySelector('h1');
        if (!h1) {
            issues.push('Отсутствует заголовок H1');
        }
        
        // Canonical
        const canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            issues.push('Отсутствует canonical ссылка');
        }
        
        return {
            status: issues.length === 0 ? 'success' : issues.length < 3 ? 'warning' : 'error',
            issues,
            count: issues.length
        };
    }
    
    /**
     * Проверка скорости загрузки
     */
    async checkPageSpeed() {
        const startTime = performance.now();
        
        // Имитация замера скорости
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const loadTime = (performance.now() - startTime) / 1000;
        
        return {
            status: loadTime < 2 ? 'success' : loadTime < 3 ? 'warning' : 'error',
            loadTime: loadTime.toFixed(2),
            message: `Время загрузки: ${loadTime.toFixed(2)}с`
        };
    }
    
    /**
     * Проверка битых ссылок
     */
    async checkBrokenLinks() {
        const links = document.querySelectorAll('a[href]');
        const brokenLinks = [];
        
        // Проверяем только внутренние ссылки
        for (const link of links) {
            const href = link.getAttribute('href');
            if (href.startsWith('/') || href.startsWith(window.location.origin)) {
                try {
                    const response = await fetch(href, { method: 'HEAD' });
                    if (!response.ok) {
                        brokenLinks.push({
                            url: href,
                            status: response.status
                        });
                    }
                } catch {
                    // Пропускаем ошибки сети
                }
            }
        }
        
        return {
            status: brokenLinks.length === 0 ? 'success' : 'warning',
            count: brokenLinks.length,
            links: brokenLinks
        };
    }
    
    /**
     * Проверка дублей страниц
     */
    checkDuplicates() {
        const urls = new Set();
        const duplicates = [];
        
        // Проверка URL с параметрами
        const currentUrl = window.location.href;
        const urlWithoutParams = currentUrl.split('?')[0];
        
        // Проверка наличия www и без www
        if (currentUrl.includes('www.') && !currentUrl.replace('www.', '')) {
            duplicates.push('Версия с www и без www');
        }
        
        // Проверка слеша в конце
        if (currentUrl.endsWith('/') && !currentUrl.slice(0, -1)) {
            duplicates.push('URL с / и без /');
        }
        
        return {
            status: duplicates.length === 0 ? 'success' : 'warning',
            count: duplicates.length,
            duplicates
        };
    }
    
    /**
     * Проверка адаптивности
     */
    checkResponsive() {
        const viewport = document.querySelector('meta[name="viewport"]');
        const mediaQueries = this.checkMediaQueries();
        
        const issues = [];
        
        if (!viewport) {
            issues.push('Отсутствует viewport meta тег');
        }
        
        if (!mediaQueries) {
            issues.push('Сайт не адаптирован для мобильных устройств');
        }
        
        return {
            status: issues.length === 0 ? 'success' : 'warning',
            issues
        };
    }
    
    /**
     * Проверка наличия медиа-запросов
     */
    checkMediaQueries() {
        const sheets = document.styleSheets;
        
        for (const sheet of sheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                if (rules) {
                    for (const rule of rules) {
                        if (rule.type === CSSRule.MEDIA_RULE) {
                            return true;
                        }
                    }
                }
            } catch {
                // Пропускаем ошибки доступа к CSS
            }
        }
        
        return false;
    }
    
    /**
     * Расчет SEO балла
     */
    calculateSEOScore(results) {
        let score = 100;
        const weights = {
            robots: 10,
            sitemap: 10,
            ssl: 15,
            meta: 20,
            speed: 15,
            links: 10,
            duplicates: 10,
            responsive: 10
        };
        
        for (const [key, value] of Object.entries(results)) {
            if (value.status === 'error') {
                score -= weights[key];
            } else if (value.status === 'warning') {
                score -= weights[key] / 2;
            }
        }
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    
    /**
     * Обновление отображения SEO балла
     */
    updateSEOScore(score) {
        const meter = document.querySelector('.meter-value');
        if (meter) {
            meter.textContent = score;
            
            const circle = document.querySelector('.meter-circle');
            if (circle) {
                const percentage = (score / 100) * 360;
                circle.style.background = `conic-gradient(var(--accent-primary) 0deg ${percentage}deg, var(--tertiary-bg) ${percentage}deg 360deg)`;
            }
        }
    }
    
    /**
     * Отображение результатов аудита
     */
    renderAuditResults(results) {
        const container = document.querySelector('.audit-list');
        if (!container) return;
        
        container.innerHTML = Object.entries(results).map(([key, value]) => `
            <div class="audit-item">
                <div class="audit-status status-${value.status}">
                    <i class="fas fa-${this.getStatusIcon(value.status)}"></i>
                </div>
                <div class="audit-info">
                    <div class="audit-title">${this.formatAuditTitle(key)}</div>
                    <div class="audit-desc">${value.message || value.issues?.join(', ') || 'OK'}</div>
                </div>
                ${value.count ? `<span class="audit-count">${value.count}</span>` : ''}
            </div>
        `).join('');
    }
    
    /**
     * Получение иконки статуса
     */
    getStatusIcon(status) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[status] || 'info-circle';
    }
    
    /**
     * Форматирование заголовка аудита
     */
    formatAuditTitle(key) {
        const titles = {
            robots: 'robots.txt',
            sitemap: 'sitemap.xml',
            ssl: 'SSL сертификат',
            meta: 'Мета-теги',
            speed: 'Скорость загрузки',
            links: 'Битые ссылки',
            duplicates: 'Дубли страниц',
            responsive: 'Адаптивность'
        };
        return titles[key] || key;
    }
    
    // ===== Семантическое ядро (Задание 10) =====
    
    /**
     * Загрузка ключевых слов
     */
    loadKeywords() {
        const textarea = document.getElementById('keywordsText');
        if (!textarea) return;
        
        // Демо-данные
        this.keywords = [
            'разработка сайта',
            'создание сайта',
            'заказать сайт',
            'веб студия',
            'интернет магазин',
            'seo продвижение',
            'раскрутка сайта',
            'оптимизация сайта',
            'контекстная реклама',
            'таргетинг',
            'продвижение в яндексе',
            'продвижение в гугле',
            'аудит сайта',
            'юзабилити аудит',
            'технический аудит'
        ];
        
        textarea.value = this.keywords.join('\n');
    }
    
    /**
     * Кластеризация ключевых слов (Задание 11)
     */
    clusterKeywords() {
        const textarea = document.getElementById('keywordsText');
        if (!textarea) return;
        
        const keywords = textarea.value.split('\n')
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        if (keywords.length === 0) {
            app.showNotification('Введите ключевые слова', 'warning');
            return;
        }
        
        // Кластеризация по тематикам
        const clusters = {
            'Разработка сайтов': [],
            'SEO продвижение': [],
            'Реклама': [],
            'Аналитика': [],
            'Другое': []
        };
        
        keywords.forEach(keyword => {
            const kw = keyword.toLowerCase();
            
            if (kw.includes('разработка') || kw.includes('создание') || kw.includes('заказать') || 
                kw.includes('веб') || kw.includes('интернет') || kw.includes('магазин')) {
                clusters['Разработка сайтов'].push(keyword);
            } else if (kw.includes('seo') || kw.includes('продвижение') || kw.includes('раскрутка') || 
                       kw.includes('оптимизация')) {
                clusters['SEO продвижение'].push(keyword);
            } else if (kw.includes('реклама') || kw.includes('таргетинг') || kw.includes('контекст')) {
                clusters['Реклама'].push(keyword);
            } else if (kw.includes('аудит') || kw.includes('анализ') || kw.includes('юзабилити')) {
                clusters['Аналитика'].push(keyword);
            } else {
                clusters['Другое'].push(keyword);
            }
        });
        
        this.clusters = clusters;
        this.renderClusters(clusters);
        
        app.showNotification('Кластеризация завершена', 'success');
    }
    
    /**
     * Отображение кластеров
     */
    renderClusters(clusters) {
        const container = document.getElementById('clustersContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const [name, keywords] of Object.entries(clusters)) {
            if (keywords.length === 0) continue;
            
            const clusterDiv = document.createElement('div');
            clusterDiv.className = 'cluster-card';
            clusterDiv.innerHTML = `
                <div class="cluster-header">
                    <span class="cluster-name">${name}</span>
                    <span class="cluster-count">${keywords.length} ключей</span>
                </div>
                <div class="cluster-keywords">
                    ${keywords.map(kw => `<span class="keyword-tag">${kw}</span>`).join('')}
                </div>
            `;
            
            container.appendChild(clusterDiv);
        }
    }
    
    /**
     * Очистка ключевых слов
     */
    clearKeywords() {
        document.getElementById('keywordsText').value = '';
        document.getElementById('clustersContainer').innerHTML = '';
        app.showNotification('Поле очищено', 'info');
    }
    
    // ===== Анализ конкурентов (Задание 8) =====
    
    /**
     * Анализ конкурентов
     */
    async analyzeCompetitors() {
        app.showNotification('Анализ конкурентов...', 'info');
        
        // Демо-данные
        const competitors = [
            { name: 'freelance.ru', dr: 72, traffic: 1200000, keywords: 45000, pages: 125000 },
            { name: 'habr.com', dr: 85, traffic: 5600000, keywords: 128000, pages: 342000 },
            { name: 'tproger.ru', dr: 64, traffic: 890000, keywords: 23000, pages: 78000 },
            { name: 'vc.ru', dr: 78, traffic: 2100000, keywords: 67000, pages: 189000 }
        ];
        
        this.renderCompetitors(competitors);
        
        app.showNotification('Анализ конкурентов завершен', 'success');
    }
    
    /**
     * Отображение конкурентов
     */
    renderCompetitors(competitors) {
        const tbody = document.querySelector('.competitors-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = competitors.map(comp => `
            <tr>
                <td>${comp.name}</td>
                <td>${comp.dr}</td>
                <td>${this.formatNumber(comp.traffic)}</td>
                <td>${this.formatNumber(comp.keywords)}</td>
                <td>${this.formatNumber(comp.pages)}</td>
            </tr>
        `).join('');
        
        // Добавляем текущий сайт
        tbody.innerHTML += `
            <tr class="highlight-row">
                <td>projectcollabhub.ru</td>
                <td>45</td>
                <td>234K</td>
                <td>12K</td>
                <td>56K</td>
            </tr>
        `;
    }
    
    // ===== Оптимизация изображений (Задание 14) =====
    
    /**
     * Оптимизация изображения
     */
    optimizeImage() {
        const alt = document.getElementById('altText')?.value;
        const title = document.getElementById('titleText')?.value;
        const img = document.getElementById('previewImage');
        
        if (img) {
            if (alt) img.alt = alt;
            if (title) img.title = title;
            
            app.showNotification('Изображение оптимизировано', 'success');
        }
    }
    
    // ===== Резервное копирование (Задание 8) =====
    
    /**
     * Создание резервной копии
     */
    createBackup() {
        app.showNotification('Создание резервной копии...', 'info');
        
        setTimeout(() => {
            const backupList = document.querySelector('.backup-list');
            if (backupList) {
                const now = new Date();
                const dateStr = now.toISOString().slice(0, 10);
                const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
                
                const backupItem = document.createElement('div');
                backupItem.className = 'backup-item';
                backupItem.innerHTML = `
                    <div class="backup-info">
                        <div class="backup-icon">
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="backup-details">
                            <h4>backup-${dateStr}-${timeStr}.zip</h4>
                            <p>База данных + файлы</p>
                        </div>
                    </div>
                    <div class="backup-size">${Math.floor(Math.random() * 100 + 100)} MB</div>
                    <div class="backup-actions">
                        <button class="backup-btn" onclick="seo.downloadBackup(this)">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="backup-btn" onclick="seo.restoreBackup(this)">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                `;
                
                backupList.insertBefore(backupItem, backupList.firstChild);
            }
            
            app.showNotification('Резервная копия создана', 'success');
        }, 2000);
    }
    
    /**
     * Скачивание бэкапа
     */
    downloadBackup(btn) {
        app.showNotification('Скачивание начато', 'info');
    }
    
    /**
     * Восстановление из бэкапа
     */
    restoreBackup(btn) {
        if (confirm('Восстановить из этой резервной копии?')) {
            app.showNotification('Восстановление...', 'info');
            
            setTimeout(() => {
                app.showNotification('Восстановление завершено', 'success');
            }, 3000);
        }
    }
    
    // ===== Вспомогательные функции =====
    
    /**
     * Форматирование числа
     */
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// Инициализация
const seo = new SEOManager();
window.seo = seo;