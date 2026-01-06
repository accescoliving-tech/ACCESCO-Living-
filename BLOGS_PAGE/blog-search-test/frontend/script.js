document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    console.log("ACCESCO Blogs UI Initialized");

    // Scroll Navbar Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.transform = 'translateX(-50%) translateY(-10px)';
            navbar.style.width = '95%';
        } else {
            navbar.style.transform = 'translateX(-50%) translateY(0)';
            navbar.style.width = '90%';
        }
    });

    // Simple reveal animation for cards
    const cards = document.querySelectorAll('.blog-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
});