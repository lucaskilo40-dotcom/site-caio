// Configurações globais
const CONFIG = {
    testimonials: {
        autoPlay: false,
        interval: 10000,
        totalItems: 7
    },
    transformations: {
        autoPlay: false,
        interval: 10000,
        totalItems: 4
    },
    pixKey: 'doar.refugiotiare@gmail.com'
};

// Ajuste o valor abaixo para usar um prefixo único de checkout, por exemplo:
// const DONATION_CHECKOUT_BASE_URL = 'https://meucheckout.com/pagar?valor=';
const DONATION_CHECKOUT_BASE_URL = '';
const DONATION_CHECKOUT_WARNING = 'Atualize os links de checkout antes de finalizar a doação.';

// Estado da aplicação
let currentTestimonial = 0;
let currentTransformation = 0;
let testimonialInterval = null;
let transformationInterval = null;
let donationModalElement = null;
let donationModalOptions = [];
let lastFocusedElementBeforeDonationModal = null;
let donationModalInitialized = false;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeProgressiveImageLoading();
    initializeCarousel();
    initializeTransformationCarousel();
    initializeAnimations();
    initializePIXCopy();
    initializeDonationModal();
    console.log('Site do Refúgio da Tia Rê carregado com sucesso!');
});

// ===== CARREGAMENTO PROGRESSIVO DE IMAGENS =====

function initializeProgressiveImageLoading() {
    // Lista de imagens em ordem de prioridade (de cima para baixo)
    const imagePriority = [
        // Prioridade 1: Logo e banners principais (carregam imediatamente)
        'images/logosemfundo2.png',
        'images/banner1novo.png',
        'images/banner2novo.png',
        'images/logo.png',
        
        // Prioridade 2: Imagens do carrossel de transformações (carregam logo após)
        'images/antes1.png',
        'images/depois1.png',
        'images/antes 2.png',
        'images/depois 2.png',
        'images/antes 3.png',
        'images/depois 3.png',
        'images/antes 4.png',
        'images/depois 4.png',
        
        // Prioridade 3: Imagens dos depoimentos (carregam em seguida)
        'images/1.png',
        'images/2.png',
        'images/3.png',
        'images/4.png',
        'images/8.png',
        'images/9.png',
        'images/10.png',
        
        // Prioridade 4: Outras imagens (carregam por último)
        'images/pixxx.png'
    ];
    
    // Função para carregar uma imagem
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => reject(src);
            img.src = src;
        });
    }
    
    // Função para carregar imagens em lotes com delay
    async function loadImagesInBatches() {
        const batchSize = 3; // Carrega 3 imagens por vez
        const delayBetweenBatches = 100; // 100ms entre lotes
        
        for (let i = 0; i < imagePriority.length; i += batchSize) {
            const batch = imagePriority.slice(i, i + batchSize);
            
            // Carrega o lote atual
            const promises = batch.map(src => loadImage(src).catch(err => {
                console.warn(`Falha ao carregar imagem: ${src}`, err);
                return null;
            }));
            
            await Promise.all(promises);
            
            // Aguarda um pouco antes do próximo lote (exceto para o primeiro lote)
            if (i + batchSize < imagePriority.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
        console.log('✅ Todas as imagens foram carregadas progressivamente!');
    }
    
    // Carrega as imagens críticas imediatamente
    const criticalImages = [
        'images/logosemfundo2.png',
        'images/banner1novo.png',
        'images/banner2novo.png',
        'images/logo.png'
    ];
    
    // Carrega imagens críticas primeiro
    Promise.all(criticalImages.map(src => loadImage(src).catch(err => {
        console.warn(`Falha ao carregar imagem crítica: ${src}`, err);
        return null;
    }))).then(() => {
        console.log('✅ Imagens críticas carregadas!');
        // Inicia o carregamento progressivo das demais imagens
        loadImagesInBatches();
    });
    
    // Função para pré-carregar imagens dos carrosséis
    function preloadCarouselImages() {
        const carouselImages = [
            // Imagens de transformação
            'images/antes1.png', 'images/depois1.png',
            'images/antes 2.png', 'images/depois 2.png',
            'images/antes 3.png', 'images/depois 3.png',
            'images/antes 4.png', 'images/depois 4.png',
            // Imagens de depoimentos
            'images/1.png', 'images/2.png', 'images/3.png', 'images/4.png',
            'images/8.png', 'images/9.png', 'images/10.png'
        ];
        
        carouselImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    // Pré-carrega imagens dos carrosséis em background
    setTimeout(preloadCarouselImages, 500);
}

// ===== CAROUSEL DE DEPOIMENTOS =====

function initializeCarousel() {
    createCarouselIndicators();
    
    // Garante que o primeiro depoimento seja mostrado
    showTestimonial(0);
    
    if (CONFIG.testimonials.autoPlay) {
        startAutoPlay();
    }
    
    // Event listeners para controles
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Pausa autoplay quando mouse está sobre o carousel
    const carousel = document.getElementById('testimonialsCarousel');
    if (carousel) {
        if (CONFIG.testimonials.autoPlay) {
            carousel.addEventListener('mouseenter', stopAutoPlay);
            carousel.addEventListener('mouseleave', startAutoPlay);
        }
        
        // Adiciona suporte para touch/swipe
        initializeTestimonialTouch(carousel);
    }
}

// ===== CAROUSEL DE TRANSFORMAÇÕES =====

function initializeTransformationCarousel() {
    createTransformationIndicators();
    if (CONFIG.transformations.autoPlay) {
        startTransformationAutoPlay();
    }
    
    // Pausa autoplay quando mouse está sobre o carousel
    const transformationCarousel = document.getElementById('transformationCarousel');
    if (transformationCarousel) {
        transformationCarousel.addEventListener('mouseenter', stopTransformationAutoPlay);
        transformationCarousel.addEventListener('mouseleave', startTransformationAutoPlay);
        
        // Adiciona suporte para touch/swipe
        initializeTransformationTouch(transformationCarousel);
    }
}

function createTransformationIndicators() {
    const indicatorsContainer = document.getElementById('transformationIndicators');
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = '';
    
    for (let i = 0; i < CONFIG.transformations.totalItems; i++) {
        const indicator = document.createElement('div');
        indicator.className = `transformation-indicator ${i === 0 ? 'active' : ''}`;
        indicator.addEventListener('click', () => goToTransformation(i));
        indicator.setAttribute('aria-label', `Ir para história ${i + 1}`);
        indicator.setAttribute('role', 'button');
        indicator.setAttribute('tabindex', '0');
        
        // Suporte para navegação por teclado nos indicadores
        indicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToTransformation(i);
            }
        });
        
        indicatorsContainer.appendChild(indicator);
    }
}

function showTransformation(index) {
    const transformations = document.querySelectorAll('.transformation-item');
    const indicators = document.querySelectorAll('.transformation-indicator');
    
    // Remove classe active de todos
    transformations.forEach(item => item.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Adiciona classe active ao atual
    if (transformations[index]) {
        transformations[index].classList.add('active');
    }
    if (indicators[index]) {
        indicators[index].classList.add('active');
    }
    
    currentTransformation = index;
}

function nextTransformation() {
    const next = (currentTransformation + 1) % CONFIG.transformations.totalItems;
    goToTransformation(next);
}

function prevTransformation() {
    const prev = currentTransformation === 0 ? CONFIG.transformations.totalItems - 1 : currentTransformation - 1;
    goToTransformation(prev);
}

function goToTransformation(index) {
    if (index >= 0 && index < CONFIG.transformations.totalItems) {
        showTransformation(index);
    }
}

function startTransformationAutoPlay() {
    if (transformationInterval) {
        clearInterval(transformationInterval);
    }
    
    transformationInterval = setInterval(() => {
        nextTransformation();
    }, CONFIG.transformations.interval);
}

function stopTransformationAutoPlay() {
    if (transformationInterval) {
        clearInterval(transformationInterval);
        transformationInterval = null;
    }
}

// ===== TOUCH SUPPORT PARA DEPOIMENTOS =====

function initializeTestimonialTouch(carousel) {
    let startX = 0;
    let endX = 0;
    let isDragging = false;
    
    // Touch events
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        if (CONFIG.testimonials.autoPlay) {
            stopAutoPlay();
        }
    });
    
    carousel.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        const threshold = 50; // Sensibilidade do swipe
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe para esquerda - próximo
                nextTestimonial();
            } else {
                // Swipe para direita - anterior
                prevTestimonial();
            }
        }
        
        isDragging = false;
        // Só reinicia o autoplay se estiver habilitado
        if (CONFIG.testimonials.autoPlay) {
            startAutoPlay();
        }
    });
    
    // Mouse events para desktop
    carousel.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
        if (CONFIG.testimonials.autoPlay) {
            stopAutoPlay();
        }
    });
    
    carousel.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        
        endX = e.clientX;
        const diffX = startX - endX;
        const threshold = 50;
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                nextTestimonial();
            } else {
                prevTestimonial();
            }
        }
        
        isDragging = false;
        // Só reinicia o autoplay se estiver habilitado
        if (CONFIG.testimonials.autoPlay) {
            startAutoPlay();
        }
    });
    
    // Previne seleção de texto durante o drag
    carousel.addEventListener('selectstart', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    });
}

// ===== TOUCH SUPPORT PARA TRANSFORMAÇÕES =====

function initializeTransformationTouch(carousel) {
    let startX = 0;
    let endX = 0;
    let isDragging = false;
    let currentTranslateX = 0;
    let prevTranslateX = 0;
    let animationID = 0;
    
    // Touch events
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        stopTransformationAutoPlay();
        
        // Captura a posição atual
        const activeItem = carousel.querySelector('.transformation-item.active');
        if (activeItem) {
            const transform = window.getComputedStyle(activeItem).transform;
            const matrix = new DOMMatrix(transform);
            currentTranslateX = matrix.m41;
            prevTranslateX = currentTranslateX;
        }
    });
    
    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        const moveX = prevTranslateX + diffX;
        
        // Aplica a animação durante o arraste
        const activeItem = carousel.querySelector('.transformation-item.active');
        const nextItem = carousel.querySelector('.transformation-item.next') || 
                        carousel.querySelector('.transformation-item:nth-child(' + ((currentTransformation + 1) % CONFIG.transformations.totalItems + 1) + ')');
        const prevItem = carousel.querySelector('.transformation-item.prev') || 
                        carousel.querySelector('.transformation-item:nth-child(' + (currentTransformation === 0 ? CONFIG.transformations.totalItems : currentTransformation) + ')');
        
        if (activeItem) {
            activeItem.style.transform = `translateX(${moveX}px)`;
            activeItem.style.transition = 'none';
        }
        
        // Mostra o próximo item durante o arraste
        if (diffX < 0 && nextItem) { // Arrastando para esquerda
            nextItem.style.display = 'block';
            nextItem.style.transform = `translateX(${moveX + carousel.offsetWidth}px)`;
            nextItem.style.transition = 'none';
            nextItem.style.opacity = '0.7';
        } else if (diffX > 0 && prevItem) { // Arrastando para direita
            prevItem.style.display = 'block';
            prevItem.style.transform = `translateX(${moveX - carousel.offsetWidth}px)`;
            prevItem.style.transition = 'none';
            prevItem.style.opacity = '0.7';
        }
    });
    
    carousel.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        const threshold = 50; // Sensibilidade do swipe
        
        // Reseta as animações
        const activeItem = carousel.querySelector('.transformation-item.active');
        const nextItem = carousel.querySelector('.transformation-item.next') || 
                        carousel.querySelector('.transformation-item:nth-child(' + ((currentTransformation + 1) % CONFIG.transformations.totalItems + 1) + ')');
        const prevItem = carousel.querySelector('.transformation-item.prev') || 
                        carousel.querySelector('.transformation-item:nth-child(' + (currentTransformation === 0 ? CONFIG.transformations.totalItems : currentTransformation) + ')');
        
        if (activeItem) {
            activeItem.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            activeItem.style.transform = '';
        }
        
        if (nextItem) {
            nextItem.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            nextItem.style.transform = '';
            nextItem.style.opacity = '';
        }
        
        if (prevItem) {
            prevItem.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            prevItem.style.transform = '';
            prevItem.style.opacity = '';
        }
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe para esquerda - próximo
                nextTransformation();
            } else {
                // Swipe para direita - anterior
                prevTransformation();
            }
        }
        
        isDragging = false;
        startTransformationAutoPlay();
    });
    
    // Mouse events para desktop
    carousel.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
        stopTransformationAutoPlay();
        
        // Captura a posição atual
        const activeItem = carousel.querySelector('.transformation-item.active');
        if (activeItem) {
            const transform = window.getComputedStyle(activeItem).transform;
            const matrix = new DOMMatrix(transform);
            currentTranslateX = matrix.m41;
            prevTranslateX = currentTranslateX;
        }
    });
    
    carousel.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const currentX = e.clientX;
        const diffX = currentX - startX;
        const moveX = prevTranslateX + diffX;
        
        // Aplica a animação durante o arraste
        const activeItem = carousel.querySelector('.transformation-item.active');
        const nextItem = carousel.querySelector('.transformation-item.next') || 
                        carousel.querySelector('.transformation-item:nth-child(' + ((currentTransformation + 1) % CONFIG.transformations.totalItems + 1) + ')');
        const prevItem = carousel.querySelector('.transformation-item.prev') || 
                        carousel.querySelector('.transformation-item:nth-child(' + (currentTransformation === 0 ? CONFIG.transformations.totalItems : currentTransformation) + ')');
        
        if (activeItem) {
            activeItem.style.transform = `translateX(${moveX}px)`;
            activeItem.style.transition = 'none';
        }
        
        // Mostra o próximo item durante o arraste
        if (diffX < 0 && nextItem) { // Arrastando para esquerda
            nextItem.style.display = 'block';
            nextItem.style.transform = `translateX(${moveX + carousel.offsetWidth}px)`;
            nextItem.style.transition = 'none';
            nextItem.style.opacity = '0.7';
        } else if (diffX > 0 && prevItem) { // Arrastando para direita
            prevItem.style.display = 'block';
            prevItem.style.transform = `translateX(${moveX - carousel.offsetWidth}px)`;
            prevItem.style.transition = 'none';
            prevItem.style.opacity = '0.7';
        }
    });
    
    carousel.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        
        endX = e.clientX;
        const diffX = startX - endX;
        const threshold = 50;
        
        // Reseta as animações
        const activeItem = carousel.querySelector('.transformation-item.active');
        const nextItem = carousel.querySelector('.transformation-item.next') || 
                        carousel.querySelector('.transformation-item:nth-child(' + ((currentTransformation + 1) % CONFIG.transformations.totalItems + 1) + ')');
        const prevItem = carousel.querySelector('.transformation-item.prev') || 
                        carousel.querySelector('.transformation-item:nth-child(' + (currentTransformation === 0 ? CONFIG.transformations.totalItems : currentTransformation) + ')');
        
        if (activeItem) {
            activeItem.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            activeItem.style.transform = '';
        }
        
        if (nextItem) {
            nextItem.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            nextItem.style.transform = '';
            nextItem.style.opacity = '';
        }
        
        if (prevItem) {
            prevItem.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            prevItem.style.transform = '';
            prevItem.style.opacity = '';
        }
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                nextTransformation();
            } else {
                prevTransformation();
            }
        }
        
        isDragging = false;
        startTransformationAutoPlay();
    });
    
    // Previne seleção de texto durante o drag
    carousel.addEventListener('selectstart', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    });
}

function createCarouselIndicators() {
    const indicatorsContainer = document.getElementById('testimonialIndicators');
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = '';
    
    for (let i = 0; i < CONFIG.testimonials.totalItems; i++) {
        const indicator = document.createElement('div');
        indicator.className = `testimonial-indicator ${i === 0 ? 'active' : ''}`;
        indicator.addEventListener('click', () => goToTestimonial(i));
        indicator.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
        indicator.setAttribute('role', 'button');
        indicator.setAttribute('tabindex', '0');
        
        // Suporte para navegação por teclado nos indicadores
        indicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToTestimonial(i);
            }
        });
        
        indicatorsContainer.appendChild(indicator);
    }
}

function showTestimonial(index) {
    const testimonials = document.querySelectorAll('.testimonial-item');
    const indicators = document.querySelectorAll('.testimonial-indicator');
    
    // Remove classe active de todos (mesmo princípio do transformation)
    testimonials.forEach(item => item.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Adiciona classe active ao atual
    if (testimonials[index]) {
        testimonials[index].classList.add('active');
    }
    if (indicators[index]) {
        indicators[index].classList.add('active');
    }
    
    currentTestimonial = index;
}

function nextTestimonial() {
    const next = (currentTestimonial + 1) % CONFIG.testimonials.totalItems;
    goToTestimonial(next);
}

function prevTestimonial() {
    const prev = currentTestimonial === 0 ? CONFIG.testimonials.totalItems - 1 : currentTestimonial - 1;
    goToTestimonial(prev);
}

function goToTestimonial(index) {
    if (index >= 0 && index < CONFIG.testimonials.totalItems) {
        showTestimonial(index);
        if (CONFIG.testimonials.autoPlay) {
            restartAutoPlay();
        }
    }
}

function startAutoPlay() {
    if (CONFIG.testimonials.autoPlay) {
        stopAutoPlay(); // Limpa interval anterior
        testimonialInterval = setInterval(nextTestimonial, CONFIG.testimonials.interval);
    }
}

function stopAutoPlay() {
    if (testimonialInterval) {
        clearInterval(testimonialInterval);
        testimonialInterval = null;
    }
}

function restartAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
}

function handleKeyboardNavigation(e) {
    const carousel = document.getElementById('testimonialsCarousel');
    if (!carousel) return;
    
    // Verifica se o foco está no carousel ou seus controles
    const isCarouselFocused = carousel.contains(document.activeElement) || 
                             document.activeElement.classList.contains('testimonial-btn') ||
                             document.activeElement.classList.contains('testimonial-indicator');
    
    if (isCarouselFocused) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                prevTestimonial();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextTestimonial();
                break;
            case 'Home':
                e.preventDefault();
                goToTestimonial(0);
                break;
            case 'End':
                e.preventDefault();
                goToTestimonial(CONFIG.testimonials.totalItems - 1);
                break;
        }
    }
}

// ===== FUNCIONALIDADE PIX =====

function initializePIXCopy() {
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyPixKey);
    }
}

async function copyPixKey() {
    const button = document.querySelector('.copy-btn');
    const pixKey = CONFIG.pixKey;
    
    try {
        // Tenta usar a API moderna de clipboard
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(pixKey);
            showCopySuccess(button);
        } else {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = pixKey;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                showCopySuccess(button);
            } else {
                throw new Error('Falha ao copiar');
            }
        }
    } catch (error) {
        console.error('Erro ao copiar chave PIX:', error);
        showCopyError(button);
    }
}

function showCopySuccess(button) {
    const originalText = '<span class="copy-icon">📋</span> Copiar Chave PIX';
    const originalClass = 'copy-btn';
    
    button.innerHTML = '<span class="copy-icon">✓</span> Copiado!';
    button.classList.add('copy-success');
    
    // Feedback tátil se disponível
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    // Mostra alert informativo
    setTimeout(() => {
        alert('✅ Chave PIX copiada com sucesso!\nObrigada por ajudar nossos animais! ❤️');
    }, 500);
    
    // Volta ao estado original após 3 segundos
    setTimeout(() => {
        button.innerHTML = originalText;
        button.className = originalClass;
        // Remove qualquer estilo inline para voltar ao CSS original
        button.style.background = '';
    }, 3000);
}

function showCopyError(button) {
    const originalText = button.innerHTML;
    
    button.innerHTML = '<span class="copy-icon">❌</span> Erro ao copiar';
    button.style.background = '#f44336';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);
    
    // Mostra a chave PIX para cópia manual
    alert(`Não foi possível copiar automaticamente. Chave PIX: ${CONFIG.pixKey}`);
}

// ===== SCROLL SUAVE =====





// ===== ANIMAÇÕES E EFEITOS VISUAIS =====

function initializeAnimations() {
    // Intersection Observer para animações on scroll
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(handleIntersection, observerOptions);
        
        // Observa elementos que devem ser animados
        const animatedElements = document.querySelectorAll(
            '.stat-item, .testimonial-item, .value-item, .footer-section'
        );
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            observer.observe(el);
        });
    }
    
    // Efeito parallax sutil no banner (se suportado)
    initializeParallax();
}

function handleIntersection(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const element = entry.target;
            
            // Anima o elemento
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            // Para de observar o elemento após animação
            setTimeout(() => {
                entry.target.style.transition = '';
            }, 600);
        }
    });
}

function initializeParallax() {
    // Desabilitado para evitar problemas de rolagem
    return;
    
    const banner = document.querySelector('.banner-image');
    if (!banner) return;
    
    // Verifica se o usuário não prefere movimento reduzido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    // Aplica efeito parallax sutil
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.3;
        banner.style.transform = `translateY(${parallax}px)`;
    });
}

// ===== UTILITÁRIOS =====

// Debounce function para otimizar eventos de scroll/resize
function debounce(func, wait) {
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

// Função para detectar dispositivos móveis
function isMobile() {
    return window.innerWidth <= 768;
}

// Função para logging de eventos (útil para analytics)
function trackEvent(eventName, properties = {}) {
    console.log(`Event: ${eventName}`, properties);
    
            // Aqui você pode integrar com Google Analytics, Facebook Pixel, TikTok Pixel, etc.
        // Exemplo: gtag('event', eventName, properties);
}

// ===== EVENT LISTENERS ADICIONAIS =====

// Otimização para redimensionamento de tela
window.addEventListener('resize', debounce(() => {
    // Reajusta elementos se necessário
    if (CONFIG.testimonials.autoPlay) {
        if (isMobile()) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    }
}, 250));

// Detecta quando a aba fica inativa/ativa
document.addEventListener('visibilitychange', () => {
    if (CONFIG.testimonials.autoPlay) {
        if (document.hidden) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    }
});

// ===== DONATION MODAL =====

function initializeDonationModal() {
    if (donationModalInitialized) {
        return;
    }

    donationModalElement = document.getElementById('donationModal');

    if (!donationModalElement) {
        return;
    }

    donationModalOptions = Array.from(donationModalElement.querySelectorAll('.donation-modal__option'));

    donationModalOptions.forEach(option => {
        option.addEventListener('click', () => handleDonationOptionSelection(option));
    });

    const closeTriggers = donationModalElement.querySelectorAll('[data-close-modal]');

    closeTriggers.forEach(trigger => {
        trigger.addEventListener('click', closeDonationModal);
    });

    donationModalElement.addEventListener('click', (event) => {
        if (event.target === donationModalElement) {
            closeDonationModal();
        }
    });

    donationModalInitialized = true;
}

function openDonationModal() {
    if (!donationModalElement) {
        initializeDonationModal();
    }

    if (!donationModalElement) {
        return;
    }

    lastFocusedElementBeforeDonationModal = document.activeElement;

    donationModalElement.classList.add('is-visible');
    donationModalElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const firstOption = donationModalElement.querySelector('.donation-modal__option');

    if (firstOption) {
        firstOption.focus();
    }
}

function closeDonationModal() {
    if (!donationModalElement || !donationModalElement.classList.contains('is-visible')) {
        return;
    }

    donationModalElement.classList.remove('is-visible');
    donationModalElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (lastFocusedElementBeforeDonationModal) {
        lastFocusedElementBeforeDonationModal.focus();
        lastFocusedElementBeforeDonationModal = null;
    }
}

function handleDonationOptionSelection(optionButton) {
    const redirectUrl = resolveDonationCheckoutUrl(optionButton);

    if (!redirectUrl) {
        alert(DONATION_CHECKOUT_WARNING);
        console.warn('Checkout URL não configurada para o botão de doação.', optionButton);
        return;
    }

    closeDonationModal();
    window.location.href = redirectUrl;
}

function resolveDonationCheckoutUrl(optionButton) {
    if (!optionButton) {
        return '';
    }

    const directUrl = (optionButton.dataset.checkoutUrl || '').trim();

    if (directUrl) {
        return directUrl;
    }

    if (!DONATION_CHECKOUT_BASE_URL) {
        return '';
    }

    const amount = (optionButton.dataset.amount || '').trim();

    if (!amount) {
        return '';
    }

    return DONATION_CHECKOUT_BASE_URL + encodeURIComponent(amount);
}

function isDonationModalVisible() {
    return Boolean(donationModalElement && donationModalElement.classList.contains('is-visible'));
}

function trapFocusWithin(container, event) {
    if (!container) {
        return;
    }

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = container.querySelectorAll(focusableSelectors);

    if (!focusableElements.length) {
        return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
        if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
        }
    } else if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
    }
}
// ===== ACESSIBILIDADE =====

// Melhora a navegação por teclado
document.addEventListener('keydown', (e) => {
    if (isDonationModalVisible()) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeDonationModal();
            return;
        }

        if (e.key === 'Tab') {
            trapFocusWithin(donationModalElement, e);
            return;
        }
    }

    if (e.key === 'Escape' && CONFIG.testimonials.autoPlay) {
        stopAutoPlay();
    }

    handleTabTrap(e);
});

function handleTabTrap(e) {
    if (e.key !== 'Tab') return;
    if (isDonationModalVisible()) {
        return;
    }

    const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
        }
    } else {
        if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    }
}

// ===== PERFORMANCE =====

// Função para otimizar carregamento de imagens (sem lazy loading)
function optimizeImageLoading() {
    // Adiciona classe 'loaded' quando a imagem termina de carregar
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
        }
    });
}

// Otimiza carregamento de imagens
optimizeImageLoading();

// ===== FUNÇÕES EXPOSTAS GLOBALMENTE =====

// Exporta funções que podem ser chamadas pelo HTML
window.nextTestimonial = nextTestimonial;
window.prevTestimonial = prevTestimonial;
window.nextTransformation = nextTransformation;
window.prevTransformation = prevTransformation;
window.copyPixKey = copyPixKey;
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;
window.scrollToDonation = openDonationModal;



// ===== ERROR HANDLING =====

// Captura erros JavaScript
window.addEventListener('error', (e) => {
    console.error('Erro JavaScript:', e.error);
    // Em produção, você enviaria isso para um serviço de logging
});

// Captura erros de Promise rejeitadas
window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rejeitada:', e.reason);
    e.preventDefault();
});

// ===== INICIALIZAÇÃO FINAL =====

// Marca que o script foi carregado
window.RefugioTiaReLoaded = true;

// Log de inicialização
console.log('🐕 Refúgio da Tia Rê - Sistema carregado com sucesso! 🐱');
console.log('Versão: 1.0.0');
console.log('Desenvolvido com ❤️ para salvar vidas');

// Service Worker registration (se disponível)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Registra service worker para cache offline (implementar se necessário)
        // navigator.serviceWorker.register('/sw.js');
    });
}









