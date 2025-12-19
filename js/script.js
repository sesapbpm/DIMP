// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header background on scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(74, 144, 226, 0.98)';
        } else {
            header.style.background = 'rgba(74, 144, 226, 0.95)';
        }
    });
    
    // Active navigation link highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function highlightNavigation() {
        const scrollPosition = window.scrollY + 200;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.phase-card, .experience-card, .advantage-item, .process-card').forEach(el => {
        observer.observe(el);
    });
    
    
    // Create modal function
    function createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Sistema de Processos Terceirizados</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>O sistema de controle de processos terceirizados está em desenvolvimento como parte do Projeto BPM SESAP/RN.</p>
                    <p>Este sistema permitirá:</p>
                    <ul>
                        <li>Mapeamento completo dos processos terceirizados</li>
                        <li>Controle e monitoramento em tempo real</li>
                        <li>Relatórios gerenciais automatizados</li>
                        <li>Integração com sistemas existentes</li>
                    </ul>
                    <p><strong>Status:</strong> Em desenvolvimento - Fase 1 do projeto</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary modal-close">Entendi</button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .modal-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .modal-content {
                background: white;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                transform: translateY(-50px);
                transition: transform 0.3s ease;
            }
            
            .modal-overlay.show .modal-content {
                transform: translateY(0);
            }
            
            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                margin: 0;
                color: #333;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-close:hover {
                color: #333;
            }
            
            .modal-body {
                padding: 1.5rem;
            }
            
            .modal-body p {
                margin-bottom: 1rem;
                line-height: 1.6;
                color: #555;
            }
            
            .modal-body ul {
                margin: 1rem 0;
                padding-left: 1.5rem;
            }
            
            .modal-body li {
                margin-bottom: 0.5rem;
                color: #555;
            }
            
            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid #eee;
                text-align: right;
            }
        `;
        
        if (!document.querySelector('#modal-styles')) {
            modalStyles.id = 'modal-styles';
            document.head.appendChild(modalStyles);
        }
        
        // Close modal functionality
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                modal.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
        
        return modal;
    }
    
    // Add CSS for animations
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        .phase-card,
        .experience-card,
        .advantage-item,
        .process-card {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .phase-card.animate-in,
        .experience-card.animate-in,
        .advantage-item.animate-in,
        .process-card.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .nav-link.active {
            color: #FFD700 !important;
        }
        
        .nav-link.active::after {
            width: 100% !important;
        }
        
        .hamburger.active span:nth-child(1) {
            transform: rotate(-45deg) translate(-5px, 6px);
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(3) {
            transform: rotate(45deg) translate(-5px, -6px);
        }
    `;
    
    document.head.appendChild(animationStyles);
    
    // Initialize animations for elements already in view
    setTimeout(() => {
        highlightNavigation();
        
        // Trigger animation for elements in view on load
        document.querySelectorAll('.phase-card, .experience-card, .advantage-item, .process-card').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('animate-in');
            }
        });
    }, 100);
});

