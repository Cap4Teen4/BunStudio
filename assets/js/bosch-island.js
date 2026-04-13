// Loading screen
window.addEventListener('load', function() {
    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    setTimeout(() => {
        loading.style.display = 'none';
    }, 500);
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const nav = document.getElementById('nav');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Scroll animations
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // More sensitive detection for mobile
    const threshold = window.innerWidth <= 768 ? 0.1 : 0.3;
    const elementHeight = rect.bottom - rect.top;
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    
    return (
        rect.top >= -elementHeight * threshold &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight + elementHeight * threshold &&
        rect.right <= windowWidth &&
        visibleHeight > elementHeight * 0.1
    );
}

function handleScrollAnimations() {
    const animationClasses = [
        '.fade-in', '.slide-left', '.slide-right', '.scale-up', 
        '.rotate-in', '.bounce-in', '.flip-in', '.zoom-in'
    ];
    
    animationClasses.forEach(className => {
        const elements = document.querySelectorAll(className);
        elements.forEach(element => {
            if (isElementInViewport(element)) {
                element.classList.add('visible');
            }
        });
    });
}

// Force animations on mobile
function forceMobileAnimations() {
    if (window.innerWidth <= 768) {
        const animationClasses = [
            '.fade-in', '.slide-left', '.slide-right', '.scale-up', 
            '.rotate-in', '.bounce-in', '.flip-in', '.zoom-in'
        ];
        
        animationClasses.forEach(className => {
            const elements = document.querySelectorAll(className);
            elements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('visible');
                }, index * 100);
            });
        });
    }
}

// Throttled scroll handler
let scrollTimeout;
window.addEventListener('scroll', function() {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(handleScrollAnimations, 10);
});

// Mobile-specific scroll handler for better performance
if (window.innerWidth <= 768) {
    window.addEventListener('scroll', function() {
        handleScrollAnimations();
    }, { passive: true });
}

// Typing animation for hero title
function initTypingAnimation() {
    const typingElement = document.querySelector('.typing-text');
    
    if (!typingElement) return;
    
    const text = typingElement.getAttribute('data-text');
    const speed = 150; // milliseconds per character
    let index = 0;
    
    function typeText() {
        if (index < text.length) {
            typingElement.textContent += text.charAt(index);
            index++;
            setTimeout(typeText, speed);
        }
        // Typing complete - no cursor needed
    }
    
    // Start typing after a short delay
    setTimeout(typeText, 1000);
}

// Scroll to top functionality
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (!scrollToTopBtn) return;
    
    // Show/hide button based on scroll position
    function toggleScrollToTop() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    }
    
    // Smooth scroll to top
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Event listeners
    window.addEventListener('scroll', toggleScrollToTop, { passive: true });
    scrollToTopBtn.addEventListener('click', scrollToTop);
}

// Load server statistics
function loadServerStats() {
    fetch('/api/server-stats', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const playerCountElement = document.getElementById('unique-players-count');
            if (playerCountElement && data.unique_players !== undefined) {
                // Animate the number change
                animateNumber(playerCountElement, data.unique_players);
            }
        })
        .catch(error => {
            console.error('Failed to load server stats:', error);
            const playerCountElement = document.getElementById('unique-players-count');
            if (playerCountElement) {
                playerCountElement.textContent = '500+';
            }
        });
}

// Animate number counting up
function animateNumber(element, targetNumber) {
    const startNumber = 0;
    const duration = 2000; // 2 seconds
    const increment = targetNumber / (duration / 16); // 60fps
    let currentNumber = startNumber;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= targetNumber) {
            currentNumber = targetNumber;
            clearInterval(timer);
        }
        element.textContent = Math.floor(currentNumber) + '+';
    }, 16);
}

// Initialize scroll animations
document.addEventListener('DOMContentLoaded', function() {
    handleScrollAnimations();
    initHeroSlider();
    initGalleryPagination();
    initAboutInteractivity();
    initNavigationInteractivity();
    initMobileMenu();
    initTypingAnimation();
    initScrollToTop();
    loadServerStats();
    
    // Mobile-specific: Force animations to load
    setTimeout(() => {
        handleScrollAnimations();
        forceMobileAnimations();
    }, 500);
    
    // Additional mobile trigger
    setTimeout(() => {
        forceMobileAnimations();
    }, 1000);
});

// Hero slider functionality
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    
    // Check if hero slider elements exist (only on welcome page)
    if (slides.length === 0) {
        console.log('Hero slider elements not found, skipping hero slider initialization');
        return;
    }
    
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Change slide every 5 seconds
    setInterval(nextSlide, 5000);
}

// Gallery data and pagination
let originalGalleryImages = [];
let galleryImages = [];

// Shuffle function using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

let currentPage = 1;
const imagesPerPage = 6;

// Function to load gallery images dynamically
async function loadGalleryImages() {
    try {
        const response = await fetch('/api/gallery-images');
        if (response.ok) {
            const images = await response.json();
            originalGalleryImages = images.map((image, index) => ({
                src: `storage/gallery/${image}`,
                alt: `Game Screenshot ${index + 1}`
            }));
            galleryImages = shuffleArray(originalGalleryImages);
            return true;
        } else {
            // Fallback to hardcoded images if API fails
            console.warn('API failed, using fallback images');
            return false;
        }
    } catch (error) {
        console.warn('Failed to load gallery images:', error);
        return false;
    }
}

// Fallback images if dynamic loading fails
function loadFallbackImages() {
    originalGalleryImages = [
        { src: 'storage/gallery/20250829001933_1.jpg', alt: 'Game Screenshot 1' },
        { src: 'storage/gallery/20250830154525_1.jpg', alt: 'Game Screenshot 2' },
        { src: 'storage/gallery/2025084.JPG', alt: 'Game Screenshot 3' },
        { src: 'storage/gallery/20250905013550_1.jpg', alt: 'Game Screenshot 4' },
        { src: 'storage/gallery/2057E61.JPG', alt: 'Game Screenshot 5' },
        { src: 'storage/gallery/20987C1.JPG', alt: 'Game Screenshot 6' },
        { src: 'storage/gallery/20AEA71.JPG', alt: 'Game Screenshot 7' },
        { src: 'storage/gallery/image.png', alt: 'Game Screenshot 8' },
        { src: 'storage/gallery/image1.png', alt: 'Game Screenshot 9' },
        { src: 'storage/gallery/image2.png', alt: 'Game Screenshot 10' },
        { src: 'storage/gallery/image3.png', alt: 'Game Screenshot 11' },
        { src: 'storage/gallery/IMG_20250820_082820.jpg', alt: 'Game Screenshot 12' }
    ];
    galleryImages = shuffleArray(originalGalleryImages);
}

// Gallery pagination functionality
async function initGalleryPagination() {
    const galleryGrid = document.getElementById('galleryGrid');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const loading = document.getElementById('galleryLoading');

    // Check if gallery elements exist (only on welcome page)
    if (!galleryGrid || !prevBtn || !nextBtn || !pageInfo || !loading) {
        console.log('Gallery elements not found, skipping gallery pagination initialization');
        return;
    }

    // Load images dynamically
    const loaded = await loadGalleryImages();
    if (!loaded) {
        loadFallbackImages();
    }

    function showLoading() {
        loading.classList.add('active');
        galleryGrid.innerHTML = '';
    }

    function hideLoading() {
        loading.classList.remove('active');
    }

    function renderGallery() {
        showLoading();
        
        setTimeout(() => {
            const startIndex = (currentPage - 1) * imagesPerPage;
            const endIndex = startIndex + imagesPerPage;
            const currentImages = galleryImages.slice(startIndex, endIndex);
            
            const animationClasses = ['scale-up', 'slide-left', 'slide-right', 'bounce-in', 'flip-in', 'rotate-in', 'zoom-in'];
            
            galleryGrid.innerHTML = currentImages.map((image, index) => {
                const animationClass = animationClasses[index % animationClasses.length];
                return `
                    <div class="gallery-item ${animationClass}" data-src="${image.src}" style="animation-delay: ${index * 0.1}s">
                        <img src="${image.src}" alt="${image.alt}" loading="lazy">
                        <div class="gallery-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                `;
            }).join('');

            // Update pagination info
            const totalPages = Math.ceil(galleryImages.length / imagesPerPage);
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            
            // Update button states
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === totalPages;
            
            // Re-initialize modal functionality for new items
            initGalleryModal();
            
            // Trigger scroll animations
            handleScrollAnimations();
            
            hideLoading();
        }, 500);
    }

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderGallery();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(galleryImages.length / imagesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderGallery();
        }
    });


    // Initial render
    renderGallery();
}

// Gallery modal functionality
let currentImageIndex = 0;
let currentImageList = [];
let currentContext = 'gallery'; // 'gallery' or 'about'

function initGalleryModal() {
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('galleryModalImage');
    const closeBtn = document.getElementById('galleryModalClose');
    const prevBtn = document.getElementById('galleryModalPrev');
    const nextBtn = document.getElementById('galleryModalNext');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const aboutItems = document.querySelectorAll('.about-image-item');

    // Update current image list based on context
    function updateImageList(context) {
        currentContext = context;
        
        if (context === 'gallery') {
            // Use the global galleryImages array that contains all images
            if (typeof galleryImages !== 'undefined' && galleryImages.length > 0) {
                currentImageList = galleryImages.map(img => ({
                    src: img.src,
                    alt: img.alt
                }));
            } else {
                // Fallback to visible gallery items if global array not available
                currentImageList = Array.from(galleryItems).map(item => ({
                    src: item.getAttribute('data-src'),
                    alt: item.querySelector('img').alt
                }));
            }
        } else if (context === 'about') {
            // Use only about section images
            currentImageList = Array.from(aboutItems).map(item => ({
                src: item.getAttribute('data-src'),
                alt: item.querySelector('img').alt
            }));
        }
    }

    // Show image at specific index
    function showImage(index) {
        if (currentImageList.length === 0) return;
        
        // Handle wrapping
        if (index < 0) index = currentImageList.length - 1;
        if (index >= currentImageList.length) index = 0;
        
        currentImageIndex = index;
        const image = currentImageList[currentImageIndex];
        modalImage.src = image.src;
        modalImage.alt = image.alt;
        
        // Update button states
        if (currentImageList.length <= 1) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        }
    }

    // Open modal with specific image
    function openModal(imageSrc, context) {
        updateImageList(context);
        const imageIndex = currentImageList.findIndex(img => img.src === imageSrc);
        if (imageIndex !== -1) {
            currentImageIndex = imageIndex;
        }
        showImage(currentImageIndex);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Event listeners for gallery images
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const imageSrc = this.getAttribute('data-src');
            openModal(imageSrc, 'gallery');
        });
    });

    // Event listeners for about section images
    aboutItems.forEach(item => {
        item.addEventListener('click', function() {
            const imageSrc = this.getAttribute('data-src');
            openModal(imageSrc, 'about');
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showImage(currentImageIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showImage(currentImageIndex + 1);
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeModal();
                } else if (e.key === 'ArrowLeft') {
                    showImage(currentImageIndex - 1);
                } else if (e.key === 'ArrowRight') {
                    showImage(currentImageIndex + 1);
                }
            }
        });
    }
}

// About section interactivity
function initAboutInteractivity() {
    // Add click effects to about content
    const aboutTitle = document.querySelector('.about-content h2');
    const aboutParagraphs = document.querySelectorAll('.about-content p');

    if (aboutTitle) {
        aboutTitle.addEventListener('click', function() {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'pulse 0.6s ease-in-out';
            }, 10);
        });
    }

    aboutParagraphs.forEach((p, index) => {
        p.addEventListener('click', function() {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'slideInLeft 0.5s ease-out';
            }, 10);
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuClose = document.getElementById('mobile-menu-close');

    if (mobileMenuToggle && mobileMenu && mobileMenuClose) {
        function openMenu() {
            mobileMenu.classList.remove('closing');
            mobileMenu.classList.add('active');
            mobileMenuToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            mobileMenu.classList.add('closing');
            mobileMenuToggle.classList.remove('active');
            
            setTimeout(() => {
                mobileMenu.classList.remove('active', 'closing');
                document.body.style.overflow = '';
            }, 400); // Match the closing animation duration
        }

        mobileMenuToggle.addEventListener('click', () => {
            if (mobileMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        mobileMenuClose.addEventListener('click', closeMenu);

        // Close menu when clicking on links (but let them scroll first)
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Only close if it's a section link (not external links)
                if (link.getAttribute('href').startsWith('#')) {
                    // Small delay to allow scroll animation to start
                    setTimeout(() => {
                        closeMenu();
                    }, 100);
                } else {
                    // For external links, close immediately
                    closeMenu();
                }
            });
        });
    }
}

// Navigation interactivity
function initNavigationInteractivity() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-links a[href^="#"], .mobile-menu a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const offsetTop = target.offsetTop - navHeight - 20;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active navigation link on scroll
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Add scroll listener for active nav updates
    window.addEventListener('scroll', updateActiveNavLink);
}

// Button click effects
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.pointerEvents = 'none';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);