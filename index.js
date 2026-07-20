// ye vide clock ke part 2 hai part 1 niche me hai 
window.addEventListener('load', () => {
    const clock = document.getElementById('digital-clock');
    console.log("Clock Element Found:", clock); 
    if(!clock) {
        alert("Error: digital-clock ID HTML me nahi mili!");
    }
});

// AAPKA CLOCK FUNCTION (Updated for absolute stability)
function updateClock() {
    const clockElement = document.getElementById('digital-clock');
    const dateElement = document.getElementById('date-text');

    if (!clockElement || !dateElement) return;

    const now = new Date();
    
    // Time Formatting
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    // Date Formatting
    const dateString = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
    });

    clockElement.innerText = timeString;
    dateElement.innerText = dateString;
}

// Interval
setInterval(updateClock, 1000);
updateClock();




//              ..............................////////////
    


    if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Digital Saathi PWA Registered!'));
}



// 1. REAL-TIME FIREBASE SYNC
db.collection('data').doc('matrix_config').onSnapshot((doc) => {
    if (doc.exists) {
        renderUI(doc.data());
    }
});

// 2. RENDER LOGIC
function renderUI(config) {
    const sidebarMenu = document.getElementById('masterLiveSidebarMenu');
    const gridContainer = document.getElementById('toolsDisplayGrid');
    const noticeBoard = document.getElementById('liveNoticeBoardHeadlineText');
    const noResults = document.getElementById('noResultsMessage');

    if (!sidebarMenu) return;

    sidebarMenu.innerHTML = '';
    gridContainer.innerHTML = '';
    if (noResults) gridContainer.appendChild(noResults); 
    
    if (noticeBoard && config.notice) noticeBoard.innerText = config.notice;

    const applyColor = (color) => color || "#4f46e5";

    // --- 1. RENDER FOLDERS AND SIDE-LINKS ---
    if (config.folders) {
        config.folders.forEach((mainFolder, fIdx) => {
            const safeFolderName = mainFolder.name.replace(/\s+/g, '');
            const folderColor = applyColor(mainFolder.color);
            
            const li = document.createElement('li');
            li.className = `menu-item ${fIdx === 0 ? 'open' : ''}`;
            li.innerHTML = `
                <div class="menu-link">
                    <div class="menu-link-content">
                        <i class="${mainFolder.icon}" style="color: ${folderColor};"></i> 
                        <span>${mainFolder.name}</span>
                    </div>
                    <i class="fas fa-chevron-down chevron-icon"></i>
                </div>
                <div class="submenu-container" id="container-${safeFolderName}"></div>
            `;
            sidebarMenu.appendChild(li);

            const subContainer = document.getElementById(`container-${safeFolderName}`);
            if (config.subs) {
                config.subs.filter(s => s.parent === mainFolder.name).forEach(subPortal => {
                    const subId = `subPortal-${subPortal.name.replace(/\s+/g, '')}`;
                    const subColor = applyColor(subPortal.color);
                    
                    const subDiv = document.createElement('div');
                    subDiv.className = "submenu-link-toggle";
                    subDiv.setAttribute('data-target', subId);
                    subDiv.setAttribute('data-filter', subPortal.name.toLowerCase());
                    subDiv.innerHTML = `
                        <span class="menu-link-content">
                            <i class="${subPortal.icon}" style="color: ${subColor};"></i> ${subPortal.name}
                        </span>
                        <i class="fas fa-chevron-down nested-chevron"></i>
                    `;
                    subContainer.appendChild(subDiv);

                    const nestedContainer = document.createElement('div');
                    nestedContainer.className = "nested-submenu-container";
                    nestedContainer.id = subId;

                    if (config.sideLinks) {
                        config.sideLinks.filter(l => l.sub?.toLowerCase().trim() === subPortal.name.toLowerCase().trim()).forEach(dl => {
                            const dlAnchor = document.createElement('a');
                            dlAnchor.href = dl.url || '#';
                            dlAnchor.target = "_blank";
                            dlAnchor.className = "nested-submenu-link";
                            const dlColor = applyColor(dl.color);
                            dlAnchor.innerHTML = `<i class="${dl.icon}" style="color: ${dlColor};"></i> ${dl.label || dl.title}`;
                            nestedContainer.appendChild(dlAnchor);
                        });
                    }
                    subContainer.appendChild(nestedContainer);
                });
            }
        });
    }

    // --- 2. RENDER CARDS (Dashboard) ---
// --- 2. RENDER CARDS (Dashboard) ---
    if (config.cards) {
        config.cards.forEach(card => {
            console.log("Card Data Check:", card);
            
            // Image logic
            const displayImage = card.imageUrl && card.imageUrl.trim() !== "" ? card.imageUrl : "default-icon.png";
            
            const anchor = document.createElement('div'); 
            anchor.className = `service-card-block tool-card-item`;
            anchor.setAttribute('data-sub', card.sub?.toLowerCase() || '');
            anchor.setAttribute('data-name', (card.title || card.name || '').toLowerCase());
            anchor.style.cursor = "pointer";
            // --- YAHAN PASTE KAREIN ---
            anchor.style.setProperty('--card-accent', card.color || '#4f46e5');
            anchor.style.setProperty('--card-glow', (card.color || '#4f46e5') + '40');
            // --------------------------

            // SUPER CHECK: Popup kholne ka logic
            if (card.links && Array.isArray(card.links) && card.links.length > 0) {
                anchor.onclick = () => openServicePopup(card);
            } else {
                anchor.onclick = () => window.open(card.url || '#', '_blank');
            }
            
            // Card HTML
            anchor.innerHTML = `
                <div class="square-icon-box" style="background-color: ${card.color || '#4f46e5'};">
                    <i class="${card.icon || 'fas fa-link'}"></i>
                </div>
                <div class="service-meta-text">
                    <h4>${card.title || card.name || 'Untitled'}</h4>
                    <p>${card.desc || card.description || ''}</p>
                </div>
            `;
            
            gridContainer.appendChild(anchor);
        }); // Ye forEach ka closing bracket hai
    } // Ye if(config.cards) ka closing bracket hai
}
// 3. SINGLE MASTER EVENT LISTENER (Filter + UI Toggle)
document.getElementById('masterLiveSidebarMenu').addEventListener('click', function(e) {
    const allCards = document.querySelectorAll('.tool-card-item');
    const noResults = document.getElementById('noResultsMessage');
    const breadCrumb = document.getElementById('breadCrumbStatus');
    const sectionTitle = document.getElementById('gridSectionTitle');

    // 1. FOLDER CLICK: Reset UI (Show All)
    const menuLink = e.target.closest('.menu-link');
    if (menuLink) {
        // Sidebar UI toggle
        menuLink.parentElement.classList.toggle('open');
        
        // Sabhi cards dikhayein
        allCards.forEach(c => {
            c.style.display = "flex"; // Reset display
            c.classList.remove('card-hidden');
            c.classList.add('card-visible');
        });
        
        // Reset Breadcrumb and Title
        if (breadCrumb) breadCrumb.innerText = "Dashboard";
        if (sectionTitle) sectionTitle.innerText = "Sarkari Portals & Recruitment Desks";
        if (noResults) noResults.style.display = "none";
        return;
    }

    // 2. SUB-FOLDER CLICK: Filter Logic
    const subToggle = e.target.closest('.submenu-link-toggle');
    if (subToggle) {
        e.stopPropagation(); // Parent tak click na jaye
        
        const filterVal = subToggle.getAttribute('data-filter').toLowerCase().trim();
        const subName = subToggle.innerText.trim(); // Sub-folder ka naam nikala
        
        // UI Toggle (Active state)
        subToggle.classList.toggle('active-toggle-item');
        const nestedMenu = document.getElementById(subToggle.getAttribute('data-target'));
        if (nestedMenu) nestedMenu.classList.toggle('nested-open');

        // Update Breadcrumb and Title Dynamically
        if (breadCrumb) breadCrumb.innerText = subName;
        if (sectionTitle) sectionTitle.innerText = subName;

        // Filter Execution
        let matchCount = 0;
        allCards.forEach(c => {
            const cardSub = c.getAttribute('data-sub').toLowerCase().trim();
            
            if (cardSub === filterVal) {
                c.style.display = "flex"; // Match hone par dikhayein
                c.classList.remove('card-hidden');
                c.classList.add('card-visible');
                matchCount++;
            } else {
                c.style.display = "none"; // Match na hone par chupayein
                c.classList.remove('card-visible');
                c.classList.add('card-hidden');
            }
        });

        // Agar result zero hai toh "No results" dikhayein
        if (noResults) noResults.style.display = (matchCount === 0) ? "block" : "none";
    }
});

// 1. CLOCK LOGIC
setInterval(() => {
    const clock = document.getElementById('liveMatrixClock');
    if (clock) {
        clock.innerText = new Date().toLocaleTimeString('en-IN', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
        });
    }
}, 1000);

// 2. CLEAN SEARCH LOGIC (No History, Exact/Partial Match)
const searchInput = document.getElementById('toolSearchField');

searchInput?.addEventListener('input', function() {
    const term = this.value.toLowerCase().trim();
    const allCards = document.querySelectorAll('.tool-card-item');
    const noResults = document.getElementById('noResultsMessage');
    const sectionTitle = document.getElementById('gridSectionTitle');
    const breadCrumb = document.getElementById('breadCrumbStatus');

    // Title Update
    if (sectionTitle) sectionTitle.innerText = term.length > 0 ? `Results for: "${term}"` : "Sarkari Portals & Recruitment Desks";
    if (breadCrumb) breadCrumb.innerText = term.length > 0 ? "Search" : "Dashboard";

    // Filter Logic
    let visibleCount = 0;
    allCards.forEach(c => {
        const cardName = c.getAttribute('data-name')?.toLowerCase() || "";
        const isMatch = (term === "" || cardName.includes(term));
        
        c.style.display = isMatch ? "flex" : "none";
        if(isMatch) visibleCount++;
    });

    // No Results Message
    if (noResults) {
        noResults.style.display = (term !== "" && visibleCount === 0) ? "block" : "none";
    }
});

// 3. ENTER KEY - BLUR (Bahar nikalne ke liye)
searchInput?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        this.blur(); // Cursor search box se bahar aa jayega
    }
});

function resetSearch() {
    const input = document.getElementById('toolSearchField');
    input.value = ''; // Input box khali karein
    input.dispatchEvent(new Event('input')); // Event trigger karein taaki cards wapas aa jayein
}


function toggleFabMenu() {
    const menu = document.getElementById('fabMenu');
    menu.classList.toggle('active');
    
    // Button rotate animation
    const btn = document.querySelector('.fab-main i');
    btn.style.transform = menu.classList.contains('active') ? 'rotate(45deg)' : 'rotate(0deg)';
    btn.style.transition = '0.3s';
}











// Function ko call karte waqt 'card' object pura pass karein
function openServicePopup(card) {
    const modal = document.getElementById('reusableModal');
    const container = document.getElementById('popupLinks');
    const titleElement = document.getElementById('popupTitle');

    if (titleElement) titleElement.innerText = card.title || "Untitled Service"; 
    container.innerHTML = ''; 

    if (card.links && card.links.length > 0) {
        card.links.forEach(link => {
            const displayImage = card.imageUrl && card.imageUrl.trim() !== "" ? card.imageUrl : "default-icon.png";
            
            container.innerHTML += `
                <div class="premium-link-card">
                    <div class="card-img-wrapper">
                        <img src="${displayImage}" alt="${link.title}" class="card-img">
                    </div>
                    <div class="card-content">
                        <p class="card-desc">${link.desc || 'Explore this service'}</p>
                    </div>
                    <!-- Yahan simple link use karein, onclick ki zaroorat nahi -->
                    <a href="${link.url}" target="_blank" class="btn-update">
                       ${link.title}
                    </a>
                </div>
            `;
        });
    } else {
        container.innerHTML = '<p class="no-data">No services available.</p>';
    }
    modal.style.display = 'flex';
}
document.addEventListener('DOMContentLoaded', () => {
    // 1. Close Button ko select karein
    const closeBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('reusableModal');

    // 2. Button click hone par modal hide karein
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 3. Modal ke bahar click hone par hide karein (Safety check)
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});








function openCalc(type) {
    alert("🚀 Ye feature bahut jald aa raha hai! Stay tuned.");
}

function calcAge() {
   alert("🚀 Ye feature bahut jald aa raha hai! Stay tuned.");
}

function calcPercent() {
    alert("🚀 Ye feature bahut jald aa raha hai! Stay tuned.");
}

function closeModal() { document.getElementById('calcModal').style.display = 'none'; }



function togglePremiumDropdown(id, event) {
    event.stopPropagation(); // Click event ko bubble hone se roke
    const dropdown = document.getElementById(id);
    dropdown.classList.toggle('show');
}

// Bahaar click karne par dropdown band ho jaye
window.onclick = function(event) {
    if (!event.target.matches('.dropdown-trigger')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.remove('show');
        }
    }
}

// Sidebar ke bahar click karne par close ho jaye
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.menu-toggler');
    
    // Agar click sidebar ke bahar aur menu button ke bahar hua hai
    if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});
document.querySelector('.menu-toggler').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.add('active');
});

document.querySelector('.sidebar-close-btn').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('active');
});

// 1. DESKTOP REFRESH (Ctrl + F)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault(); // Browser ka 'Find' wala default action rokne ke liye
        window.location.reload();
    }
});

// 2. MOBILE PREMIUM PULL-TO-REFRESH
let touchStartY = 0;
const threshold = 150; // Kitna neeche khinchne par refresh ho
const ptrIndicator = document.getElementById('ptr-indicator');

window.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
    }
});

window.addEventListener('touchend', (e) => {
    if (window.scrollY === 0) {
        let touchEndY = e.changedTouches[0].clientY;
        let diff = touchEndY - touchStartY;

        // Agar user ne kaafi neeche khincha hai
        if (diff > threshold) {
            // Refresh effect
            if (ptrIndicator) {
                ptrIndicator.style.transform = 'translateY(100px)'; // Indicator niche aayega
                ptrIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Spinner icon
            }
            
            setTimeout(() => {
                window.location.reload();
            }, 800);
        }
    }
});

// ye  clock ke  video ka code function hai //
document.addEventListener("DOMContentLoaded", function() {
    function updateClock() {
        const now = new Date();
        
        // Time check
        const clockElement = document.getElementById('digital-clock');
        const dateElement = document.getElementById('date-text');

        if (!clockElement || !dateElement) {
            console.error("Clock elements nahi mile! ID check karein.");
            return;
        }

        // Time Formatting
        // Time Formatting
const timeString = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
});
        
        // Date Formatting
        const dateString = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
        });

        clockElement.innerText = timeString;
        dateElement.innerText = dateString;
    }

    // Interval run karein
    setInterval(updateClock, 1000);
    updateClock(); 
});







//ye hai them ka function jo maine 4 them liya hai //
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('selectedTheme', themeName); // Save rahega
}

// Page load hote hi saved theme apply karein
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    setTheme(savedTheme);
});
// Screen ki width check karne ka function
    function checkDeviceAndRedirect() {
        var screenWidth = window.innerWidth;
        
        // Agar screen mobile jaisi choti hai (768px ya usse kam)
        if (screenWidth <= 768) {
            // Aur agar hum abhi index.html par hain, tabhi mobile.html par bhejo
            if (window.location.pathname.indexOf('mobile.html') === -1) {
                window.location.href = 'mobile.html';
            }
        } 
        // Agar screen laptop/desktop jaisi badi hai (768px se upar)
        else {
            // Aur agar hum galti se mobile.html par hain, tabhi index.html par wapas bhejo
            if (window.location.pathname.indexOf('index.html') === -1 && window.location.pathname.endsWith('.html')) {
                window.location.href = 'index.html';
            }
        }
    }

    // Page load hote hi turant check karega
    checkDeviceAndRedirect();

    // Jab user browser ki window ko chota ya bada karega, tab bhi ye auto-detect karega
    window.addEventListener('resize', checkDeviceAndRedirect);