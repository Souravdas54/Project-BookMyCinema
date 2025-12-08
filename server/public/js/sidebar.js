/**
 * Sidebar Toggle Functionality
 * Works across all screen sizes (XS-XXL)
 * Version: 1.0.0
 */

class SidebarManager {
    constructor() {
        this.sidebarWrapper = document.getElementById('sidebar-wrapper');
        this.navbarWrapper = document.getElementById('navbar-wrapper');
        this.contentWrapper = document.getElementById('content-wrapper');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.isMobile = window.innerWidth < 992;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadState();
        this.updateUI();
        this.setupResizeListener();
    }
    
    bindEvents() {
        // Sidebar toggle button
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', (e) => this.handleToggle(e));
        }
        
        // Overlay click (mobile)
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.handleMobileClose());
        }
        
        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobile && this.sidebarWrapper.classList.contains('show')) {
                this.handleMobileClose();
            }
        });
    }
    
    handleToggle(e) {
        e.preventDefault();
        
        if (this.isMobile) {
            this.toggleMobileSidebar();
        } else {
            this.toggleDesktopSidebar();
        }
    }
    
    toggleDesktopSidebar() {
        this.sidebarWrapper.classList.toggle('collapsed');
        this.navbarWrapper.classList.toggle('expanded');
        this.contentWrapper.classList.toggle('expanded');
        
        this.updateToggleIcon();
        this.saveState();
    }
    
    toggleMobileSidebar() {
        this.sidebarWrapper.classList.toggle('show');
        
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.toggle('show');
        }
        
        // Prevent body scrolling when sidebar is open
        if (this.sidebarWrapper.classList.contains('show')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        this.updateToggleIcon();
    }
    
    handleMobileClose() {
        if (this.sidebarWrapper.classList.contains('show')) {
            this.sidebarWrapper.classList.remove('show');
            
            if (this.sidebarOverlay) {
                this.sidebarOverlay.classList.remove('show');
            }
            
            document.body.style.overflow = '';
            this.updateToggleIcon();
        }
    }
    
    updateToggleIcon() {
        if (!this.sidebarToggle) return;
        
        const icon = this.sidebarToggle.querySelector('i');
        if (!icon) return;
        
        if (this.isMobile) {
            if (this.sidebarWrapper.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        } else {
            if (this.sidebarWrapper.classList.contains('collapsed')) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            } else {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
        }
    }
    
    saveState() {
        if (!this.isMobile) {
            const isCollapsed = this.sidebarWrapper.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    }
    
    loadState() {
        if (!this.isMobile) {
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            
            if (isCollapsed && !this.sidebarWrapper.classList.contains('collapsed')) {
                this.sidebarWrapper.classList.add('collapsed');
                this.navbarWrapper.classList.add('expanded');
                this.contentWrapper.classList.add('expanded');
            }
        }
    }
    
    updateUI() {
        this.updateToggleIcon();
        
        // Ensure proper mobile behavior
        if (this.isMobile) {
            this.sidebarWrapper.classList.remove('collapsed');
            this.navbarWrapper.classList.remove('expanded');
            this.contentWrapper.classList.remove('expanded');
            
            if (this.sidebarOverlay) {
                this.sidebarOverlay.classList.remove('show');
            }
        }
    }
    
    setupResizeListener() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth < 992;
                
                if (wasMobile !== this.isMobile) {
                    this.handleResizeChange();
                }
            }, 150);
        });
    }
    
    handleResizeChange() {
        if (this.isMobile) {
            // Switching to mobile
            this.sidebarWrapper.classList.remove('collapsed');
            this.navbarWrapper.classList.remove('expanded');
            this.contentWrapper.classList.remove('expanded');
            
            if (this.sidebarWrapper.classList.contains('show')) {
                this.handleMobileClose();
            }
        } else {
            // Switching to desktop
            this.sidebarWrapper.classList.remove('show');
            
            if (this.sidebarOverlay) {
                this.sidebarOverlay.classList.remove('show');
            }
            
            document.body.style.overflow = '';
            this.loadState();
        }
        
        this.updateToggleIcon();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarManager;
}