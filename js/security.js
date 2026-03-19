/**
 * SECURITY.JS - Криптографические функции и безопасность
 * Задания: 6-7 (RSA, Diffie-Hellman, Эль-Гамаль, DES, AES, Поля Галуа)
 */

class SecurityLab {
    constructor() {
        this.primeCache = new Map();
        this.initEventListeners();
    }
    
    /**
     * Инициализация обработчиков
     */
    initEventListeners() {
        // RSA
        document.getElementById('rsaBtn')?.addEventListener('click', () => this.testRSA());
        document.getElementById('rsaOpenSSLBtn')?.addEventListener('click', () => this.testRSAOpenSSL());
        
        // Diffie-Hellman
        document.getElementById('dhGenerateBtn')?.addEventListener('click', () => this.generateDiffieHellman());
        document.getElementById('dhCustomBtn')?.addEventListener('click', () => this.customDiffieHellman());
        
        // Эль-Гамаль
        document.getElementById('elgamalBtn')?.addEventListener('click', () => this.testElGamal());
        document.getElementById('verifyBtn')?.addEventListener('click', () => this.verifyElGamal());
        
        // PRNG
        document.getElementById('prngBtn')?.addEventListener('click', () => this.generatePRNG());
        
        // Поля Галуа
        document.getElementById('galoisAddBtn')?.addEventListener('click', () => this.galoisAdd());
        document.getElementById('galoisMulBtn')?.addEventListener('click', () => this.galoisMultiply());
        
        // DES/AES
        document.getElementById('desBtn')?.addEventListener('click', () => this.testDES());
        document.getElementById('aesEncryptBtn')?.addEventListener('click', () => this.testAES('encrypt'));
        document.getElementById('aesDecryptBtn')?.addEventListener('click', () => this.testAES('decrypt'));
    }
    
    // ===== Вспомогательные функции =====
    
    /**
     * Быстрое возведение в степень по модулю
     */
    modPow(base, exp, mod) {
        if (mod === 1) return 0;
        let result = 1;
        base = base % mod;
        
        while (exp > 0) {
            if (exp & 1) {
                result = (result * base) % mod;
            }
            base = (base * base) % mod;
            exp >>= 1;
        }
        return result;
    }
    
    /**
     * Расширенный алгоритм Евклида
     */
    extendedGcd(a, b) {
        if (b === 0) return [1, 0, a];
        
        const [x1, y1, d] = this.extendedGcd(b, a % b);
        return [y1, x1 - y1 * Math.floor(a / b), d];
    }
    
    /**
     * Модульное обратное число
     */
    modInverse(a, m) {
        const [x, y, d] = this.extendedGcd(a, m);
        if (d !== 1) return null;
        return ((x % m) + m) % m;
    }
    
    /**
     * Проверка простоты числа
     */
    isPrime(num) {
        if (this.primeCache.has(num)) return this.primeCache.get(num);
        
        if (num < 2) return false;
        if (num === 2) return true;
        if (num % 2 === 0) return false;
        
        for (let i = 3; i <= Math.sqrt(num); i += 2) {
            if (num % i === 0) {
                this.primeCache.set(num, false);
                return false;
            }
        }
        
        this.primeCache.set(num, true);
        return true;
    }
    
    /**
     * Генерация простого числа
     */
    generatePrime(bits = 8) {
        const min = Math.pow(2, bits - 1);
        const max = Math.pow(2, bits) - 1;
        
        let num;
        do {
            num = Math.floor(Math.random() * (max - min) + min);
            if (num % 2 === 0) num++;
        } while (!this.isPrime(num));
        
        return num;
    }
    
    /**
     * Хеш-функция для строки
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
    
    // ===== RSA (Задание 6.3) =====
    
    /**
     * Тест RSA
     */
    testRSA() {
        const input = parseInt(document.getElementById('rsaInput')?.value) || 123;
        
        // Параметры RSA (p=61, q=53)
        const p = 61;
        const q = 53;
        const n = p * q; // 3233
        const phi = (p - 1) * (q - 1); // 3120
        const e = 17;
        const d = 2753; // d * e ≡ 1 mod φ(n)
        
        // Шифрование
        const encrypted = this.modPow(input, e, n);
        
        // Дешифрование
        const decrypted = this.modPow(encrypted, d, n);
        
        document.getElementById('rsaOriginal').textContent = input;
        document.getElementById('rsaEncrypted').textContent = encrypted;
        document.getElementById('rsaDecrypted').textContent = decrypted;
        
        app.showNotification('RSA: тест выполнен', 'success');
    }
    
    /**
     * RSA с OpenSSL
     */
    testRSAOpenSSL() {
        const text = document.getElementById('rsaOpenSSLInput')?.value || 'Secret Message';
        
        // Генерация ключей (в браузере используем библиотеку forge)
        if (typeof forge === 'undefined') {
            app.showNotification('Библиотека forge не загружена', 'error');
            return;
        }
        
        const keypair = forge.pki.rsa.generateKeyPair(512);
        const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        
        // Шифрование
        const encrypted = keypair.publicKey.encrypt(text);
        const encryptedBase64 = forge.util.encode64(encrypted);
        
        // Дешифрование
        const decrypted = keypair.privateKey.decrypt(encrypted);
        
        document.getElementById('rsaOpenSSLResult').innerHTML = `
            <div class="result-row">
                <span class="result-label">Открытый ключ:</span>
                <span class="result-value">${publicKey.substring(0, 50)}...</span>
            </div>
            <div class="result-row">
                <span class="result-label">Зашифровано:</span>
                <span class="result-value">${encryptedBase64.substring(0, 30)}...</span>
            </div>
            <div class="result-row">
                <span class="result-label">Расшифровано:</span>
                <span class="result-value">${decrypted}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Совпадает:</span>
                <span class="result-value">${text === decrypted ? '✓' : '✗'}</span>
            </div>
        `;
        
        app.showNotification('RSA OpenSSL: ключи сгенерированы', 'success');
    }
    
    // ===== Диффи-Хеллман (Задание 6.4) =====
    
    /**
     * Генерация ключей Diffie-Hellman
     */
    generateDiffieHellman() {
        const p = 23;
        const g = 5;
        
        const alicePrivate = Math.floor(Math.random() * 10) + 5;
        const bobPrivate = Math.floor(Math.random() * 10) + 5;
        
        const alicePublic = this.modPow(g, alicePrivate, p);
        const bobPublic = this.modPow(g, bobPrivate, p);
        
        const sharedAlice = this.modPow(bobPublic, alicePrivate, p);
        const sharedBob = this.modPow(alicePublic, bobPrivate, p);
        
        document.getElementById('alicePrivate').textContent = alicePrivate;
        document.getElementById('bobPrivate').textContent = bobPrivate;
        document.getElementById('alicePublic').textContent = alicePublic;
        document.getElementById('bobPublic').textContent = bobPublic;
        document.getElementById('sharedSecret').textContent = sharedAlice;
        
        app.showNotification('Diffie-Hellman: общий ключ вычислен', 'success');
    }
    
    /**
     * Пользовательский Diffie-Hellman
     */
    customDiffieHellman() {
        const p = parseInt(document.getElementById('dhP')?.value) || 23;
        const g = parseInt(document.getElementById('dhG')?.value) || 5;
        const a = parseInt(document.getElementById('dhAlice')?.value) || 6;
        const b = parseInt(document.getElementById('dhBob')?.value) || 15;
        
        const A = this.modPow(g, a, p);
        const B = this.modPow(g, b, p);
        
        const secretA = this.modPow(B, a, p);
        const secretB = this.modPow(A, b, p);
        
        document.getElementById('dhCustomResult').innerHTML = `
            <div class="result-row">
                <span class="result-label">Открытый ключ Алисы:</span>
                <span class="result-value">${A}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Открытый ключ Боба:</span>
                <span class="result-value">${B}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Общий секрет Алисы:</span>
                <span class="result-value">${secretA}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Общий секрет Боба:</span>
                <span class="result-value">${secretB}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Совпадает:</span>
                <span class="result-value">${secretA === secretB ? '✓' : '✗'}</span>
            </div>
        `;
    }
    
    // ===== Эль-Гамаль (Задание 7.1) =====
    
    /**
     * Тест Эль-Гамаля
     */
    testElGamal() {
        const message = document.getElementById('elgamalMessage')?.value || 'HELLO';
        const hash = this.hashCode(message) % 467;
        
        const p = 467;
        const g = 2;
        const x = 127; // закрытый ключ
        const y = this.modPow(g, x, p); // открытый ключ
        
        const k = 213; // случайное число
        const r = this.modPow(g, k, p);
        
        // s = (hash - x*r) * k^(-1) mod (p-1)
        const kInv = this.modInverse(k, p - 1);
        let s = ((hash - x * r) * kInv) % (p - 1);
        if (s < 0) s += (p - 1);
        
        document.getElementById('elgamalPublicKey').textContent = y;
        document.getElementById('elgamalResult').innerHTML = `
            <div class="result-row">
                <span class="result-label">Хеш сообщения:</span>
                <span class="result-value">${hash}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Подпись r:</span>
                <span class="result-value">${r}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Подпись s:</span>
                <span class="result-value">${s}</span>
            </div>
        `;
        
        // Проверка
        const verifyResult = this.verifyElGamalSignature(message, { r, s }, p, g, y);
        
        app.showNotification(`Эль-Гамаль: подпись ${verifyResult ? 'действительна' : 'недействительна'}`, verifyResult ? 'success' : 'warning');
    }
    
    /**
     * Проверка подписи Эль-Гамаля
     */
    verifyElGamalSignature(message, signature, p, g, y) {
        const { r, s } = signature;
        const hash = this.hashCode(message) % p;
        
        const left = (this.modPow(y, r, p) * this.modPow(r, s, p)) % p;
        const right = this.modPow(g, hash, p);
        
        return left === right;
    }
    
    /**
     * Проверка подписи (интерактивная)
     */
    verifyElGamal() {
        const message = document.getElementById('verifyMessage')?.value || 'HELLO';
        const r = parseInt(document.getElementById('verifyR')?.value) || 174;
        const s = parseInt(document.getElementById('verifyS')?.value) || 142;
        
        const p = 467;
        const g = 2;
        const y = parseInt(document.getElementById('elgamalPublicKey')?.textContent) || 132;
        
        const valid = this.verifyElGamalSignature(message, { r, s }, p, g, y);
        
        document.getElementById('verifyResult').innerHTML = `
            <div class="result-row">
                <span class="result-label">Результат проверки:</span>
                <span class="result-value ${valid ? 'success' : 'error'}">
                    ${valid ? '✓ Подпись действительна' : '✗ Подпись недействительна'}
                </span>
            </div>
        `;
    }
    
    // ===== PRNG (Задание 6.2) =====
    
    /**
     * Линейный конгруэнтный генератор
     */
    lcg(seed, a = 1664525, c = 1013904223, m = Math.pow(2, 32)) {
        return (a * seed + c) % m;
    }
    
    /**
     * Генерация последовательности
     */
    generatePRNG() {
        const length = parseInt(document.getElementById('prngLength')?.value) || 8;
        let seed = parseInt(document.getElementById('prngSeed')?.value) || Date.now();
        
        const sequence = [];
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        
        for (let i = 0; i < length; i++) {
            seed = this.lcg(seed, a, c, m);
            sequence.push(seed & 0xFF);
        }
        
        // Отображение
        const container = document.getElementById('prngSequence');
        if (container) {
            container.innerHTML = '';
            
            sequence.forEach((val, i) => {
                const byteDiv = document.createElement('div');
                byteDiv.className = 'byte-box';
                byteDiv.innerHTML = `
                    <div class="byte-decimal">${val}</div>
                    <div class="byte-hex">0x${val.toString(16).padStart(2, '0').toUpperCase()}</div>
                    <div class="byte-bin">${val.toString(2).padStart(8, '0')}</div>
                `;
                container.appendChild(byteDiv);
            });
        }
        
        // Анализ
        const mean = sequence.reduce((a, b) => a + b, 0) / length;
        const min = Math.min(...sequence);
        const max = Math.max(...sequence);
        
        const analysisEl = document.getElementById('prngAnalysis');
        if (analysisEl) {
            analysisEl.innerHTML = `
                <div class="result-row">
                    <span class="result-label">Минимум:</span>
                    <span class="result-value">${min}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Максимум:</span>
                    <span class="result-value">${max}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Среднее:</span>
                    <span class="result-value">${mean.toFixed(2)}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Дисперсия:</span>
                    <span class="result-value">${this.calculateVariance(sequence).toFixed(2)}</span>
                </div>
            `;
        }
        
        app.showNotification(`PRNG: сгенерировано ${length} байт`, 'success');
    }
    
    /**
     * Вычисление дисперсии
     */
    calculateVariance(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
    }
    
    // ===== Поля Галуа (Задание 7.2) =====
    
    /**
     * Умножение в поле Галуа GF(2^3)
     */
    gfMultiply(a, b, poly = 0b1011) {
        let result = 0;
        while (b > 0) {
            if (b & 1) {
                result ^= a;
            }
            a <<= 1;
            if (a & 0b1000) { // если вышли за пределы GF(2^3)
                a ^= poly;
            }
            b >>= 1;
        }
        return result & 0b111; // маскируем до 3 бит
    }
    
    /**
     * Генерация таблиц Галуа
     */
    generateGaloisTables() {
        const size = 8;
        const addTable = [];
        const mulTable = [];
        const poly = 0b1011; // x^3 + x + 1
        
        for (let i = 0; i < size; i++) {
            addTable[i] = [];
            mulTable[i] = [];
            for (let j = 0; j < size; j++) {
                addTable[i][j] = i ^ j; // XOR
                mulTable[i][j] = this.gfMultiply(i, j, poly);
            }
        }
        
        return { addTable, mulTable };
    }
    
    /**
     * Сложение в поле Галуа
     */
    galoisAdd() {
        const a = parseInt(document.getElementById('galoisA')?.value) || 3;
        const b = parseInt(document.getElementById('galoisB')?.value) || 5;
        
        const result = a ^ b;
        
        document.getElementById('galoisResult').innerHTML = `
            <div class="result-row">
                <span class="result-label">${a} ⊕ ${b} =</span>
                <span class="result-value">${result}</span>
            </div>
            <div class="result-row">
                <span class="result-label">В двоичном виде:</span>
                <span class="result-value">${a.toString(2)} ⊕ ${b.toString(2)} = ${result.toString(2).padStart(3, '0')}</span>
            </div>
        `;
    }
    
    /**
     * Умножение в поле Галуа
     */
    galoisMultiply() {
        const a = parseInt(document.getElementById('galoisA')?.value) || 3;
        const b = parseInt(document.getElementById('galoisB')?.value) || 5;
        const poly = 0b1011;
        
        const result = this.gfMultiply(a, b, poly);
        
        document.getElementById('galoisResult').innerHTML = `
            <div class="result-row">
                <span class="result-label">${a} ⊗ ${b} =</span>
                <span class="result-value">${result}</span>
            </div>
            <div class="result-row">
                <span class="result-label">В двоичном виде:</span>
                <span class="result-value">${a.toString(2)} ⊗ ${b.toString(2)} = ${result.toString(2).padStart(3, '0')}</span>
            </div>
        `;
    }
    
    // ===== DES (Задание 7.3) =====
    
    /**
     * Тест DES
     */
    testDES() {
        const text = document.getElementById('desInput')?.value || 'Secret Message';
        const key = document.getElementById('desKey')?.value || 'KEY12345';
        
        if (typeof CryptoJS === 'undefined') {
            app.showNotification('Библиотека CryptoJS не загружена', 'error');
            return;
        }
        
        // Шифрование
        const encrypted = CryptoJS.DES.encrypt(text, key).toString();
        
        // Дешифрование
        const decrypted = CryptoJS.DES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
        
        document.getElementById('desResult').innerHTML = `
            <div class="result-row">
                <span class="result-label">Исходный текст:</span>
                <span class="result-value">${text}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Зашифровано:</span>
                <span class="result-value">${encrypted.substring(0, 30)}...</span>
            </div>
            <div class="result-row">
                <span class="result-label">Расшифровано:</span>
                <span class="result-value">${decrypted}</span>
            </div>
            <div class="result-row">
                <span class="result-label">Совпадает:</span>
                <span class="result-value">${text === decrypted ? '✓' : '✗'}</span>
            </div>
        `;
        
        app.showNotification('DES: шифрование выполнено', 'success');
    }
    
    // ===== AES (Задание 7.4) =====
    
    /**
     * Тест AES
     */
    testAES(mode = 'encrypt') {
        const text = document.getElementById('aesInput')?.value || 'Top Secret Data';
        const key = document.getElementById('aesKey')?.value || 'ThisIsA256BitKey!!!';
        
        if (typeof CryptoJS === 'undefined') {
            app.showNotification('Библиотека CryptoJS не загружена', 'error');
            return;
        }
        
        if (mode === 'encrypt') {
            // Шифрование
            const encrypted = CryptoJS.AES.encrypt(text, key).toString();
            
            document.getElementById('aesResult').innerHTML = `
                <div class="result-row">
                    <span class="result-label">Исходный текст:</span>
                    <span class="result-value">${text}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Зашифровано:</span>
                    <span class="result-value">${encrypted}</span>
                </div>
            `;
            
            // Сохраняем для дешифрования
            localStorage.setItem('lastEncrypted', encrypted);
            
            app.showNotification('AES: шифрование выполнено', 'success');
        } else {
            // Дешифрование
            const encrypted = localStorage.getItem('lastEncrypted') || text;
            
            try {
                const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
                
                document.getElementById('aesResult').innerHTML = `
                    <div class="result-row">
                        <span class="result-label">Зашифрованный текст:</span>
                        <span class="result-value">${encrypted.substring(0, 30)}...</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Расшифровано:</span>
                        <span class="result-value">${decrypted}</span>
                    </div>
                `;
                
                app.showNotification('AES: дешифрование выполнено', 'success');
            } catch (error) {
                app.showNotification('Ошибка дешифрования', 'error');
            }
        }
    }
    
    // ===== Аудит безопасности (Задание 9) =====
    
    /**
     * Проверка безопасности
     */
    async securityAudit() {
        const issues = [];
        
        // Проверка SSL
        if (window.location.protocol !== 'https:') {
            issues.push({
                type: 'critical',
                message: 'Сайт не использует HTTPS'
            });
        }
        
        // Проверка заголовков
        const headers = this.checkSecurityHeaders();
        issues.push(...headers);
        
        // Проверка паролей
        const passwordIssues = this.checkPasswordStrength();
        issues.push(...passwordIssues);
        
        // Проверка XSS
        const xssIssues = this.checkXSS();
        issues.push(...xssIssues);
        
        // Оценка
        const score = Math.max(0, 100 - issues.length * 10);
        
        return { score, issues };
    }
    
    /**
     * Проверка заголовков безопасности
     */
    checkSecurityHeaders() {
        const issues = [];
        
        // Проверка наличия CSP
        const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!metaCSP) {
            issues.push({
                type: 'warning',
                message: 'Отсутствует Content-Security-Policy'
            });
        }
        
        return issues;
    }
    
    /**
     * Проверка сложности пароля
     */
    checkPasswordStrength(password) {
        const strength = {
            score: 0,
            checks: {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                numbers: /[0-9]/.test(password),
                special: /[!@#$%^&*]/.test(password)
            }
        };
        
        strength.score = Object.values(strength.checks).filter(Boolean).length;
        
        return strength;
    }
    
    /**
     * Проверка XSS
     */
    checkXSS() {
        const issues = [];
        
        // Проверка GET параметров
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            if (/<script|javascript:|onerror/i.test(value)) {
                issues.push({
                    type: 'critical',
                    message: `Потенциальная XSS атака в параметре ${key}`
                });
            }
        }
        
        return issues;
    }
}

// Инициализация
const securityLab = new SecurityLab();
window.securityLab = securityLab;