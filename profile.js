document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // BLOCK 1: Page load hote hi photo set karna
    // ==========================================
    const savedPic = localStorage.getItem("savedProfilePic");
    
    if (savedPic) {
        // 1. ID ke zariye index.html wale avatar ko target karein
        const indexAvatar = document.getElementById("dsUserAvatar");
        if (indexAvatar) {
            indexAvatar.src = savedPic;
        }

        // 2. Class ke zariye baaki sabhi images ko target karein
        const allImages = document.querySelectorAll(".profile-user-img, .ds-premium-avatar");
        allImages.forEach((img) => {
            img.src = savedPic;
        });
    }

    // --- Baaki aapke purane elements aur modals ---
    const profileModal = document.getElementById("profileModal");
    const fileInput = document.getElementById("fileInput");
    const pencilBtn = document.querySelector(".pencil-btn");
    const closeBtn = document.querySelector(".ds-modal-header .close-icon");
    const mainEditCard = document.getElementById("mainEditCard");
    const myProfileBtn = document.querySelector(".profile-nav-link");

    // Open Modal
    if (pencilBtn && profileModal) {
        pencilBtn.addEventListener("click", (e) => {
            e.preventDefault();
            profileModal.classList.add("active");
        });
    }

    // Close Modal
    const closeModal = () => {
        if (profileModal) profileModal.classList.remove("active");
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    window.addEventListener("click", (e) => {
        if (e.target === profileModal) closeModal();
    });

    // ==========================================
    // BLOCK 2: File upload hone par naya photo save karna
    // ==========================================
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const newImageSrc = event.target.result;
                    
                    // LocalStorage mein save karein
                    localStorage.setItem("savedProfilePic", newImageSrc);

                    // Index page wale avatar par turant set karein
                    const indexAvatar = document.getElementById("dsUserAvatar");
                    if (indexAvatar) {
                        indexAvatar.src = newImageSrc;
                    }

                    // Baaki sabhi profile images par bhi set karein
                    document.querySelectorAll(".profile-user-img, .ds-premium-avatar").forEach((img) => {
                        img.src = newImageSrc;
                    });

                    closeModal();
                };
                
                reader.readAsDataURL(file);
            }
        });
    }

    // Navigation Profile Button Click
    if (myProfileBtn && mainEditCard) {
        myProfileBtn.addEventListener("click", (e) => {
            e.preventDefault(); 
            mainEditCard.style.display = "block";
            mainEditCard.scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// Google Picker Function
function openGooglePicker() {
    alert("Google Photos integration is coming soon!");
}

// Main Edit Card Close Function
function closeMainEditCard() {
    const editCard = document.getElementById("mainEditCard");
    if (editCard) {
        editCard.style.display = "none";
    }
}document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // BLOCK 1: Page load hote hi photo set karna
    // ==========================================
    const savedPic = localStorage.getItem("savedProfilePic");
    
    if (savedPic) {
        // 1. ID ke zariye index.html wale avatar ko target karein
        const indexAvatar = document.getElementById("dsUserAvatar");
        if (indexAvatar) {
            indexAvatar.src = savedPic;
        }

        // 2. Class ke zariye baaki sabhi images ko target karein
        const allImages = document.querySelectorAll(".profile-user-img, .ds-premium-avatar");
        allImages.forEach((img) => {
            img.src = savedPic;
        });
    }

    // --- Baaki aapke purane elements aur modals ---
    const profileModal = document.getElementById("profileModal");
    const fileInput = document.getElementById("fileInput");
    const pencilBtn = document.querySelector(".pencil-btn");
    const closeBtn = document.querySelector(".ds-modal-header .close-icon");
    const mainEditCard = document.getElementById("mainEditCard");
    const myProfileBtn = document.querySelector(".profile-nav-link");

    // Open Modal
    if (pencilBtn && profileModal) {
        pencilBtn.addEventListener("click", (e) => {
            e.preventDefault();
            profileModal.classList.add("active");
        });
    }

    // Close Modal
    const closeModal = () => {
        if (profileModal) profileModal.classList.remove("active");
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    window.addEventListener("click", (e) => {
        if (e.target === profileModal) closeModal();
    });

    // ==========================================
    // BLOCK 2: File upload hone par naya photo save karna
    // ==========================================
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const newImageSrc = event.target.result;
                    
                    // LocalStorage mein save karein
                    localStorage.setItem("savedProfilePic", newImageSrc);

                    // Index page wale avatar par turant set karein
                    const indexAvatar = document.getElementById("dsUserAvatar");
                    if (indexAvatar) {
                        indexAvatar.src = newImageSrc;
                    }

                    // Baaki sabhi profile images par bhi set karein
                    document.querySelectorAll(".profile-user-img, .ds-premium-avatar").forEach((img) => {
                        img.src = newImageSrc;
                    });

                    closeModal();
                };
                
                reader.readAsDataURL(file);
            }
        });
    }

    // Navigation Profile Button Click
    if (myProfileBtn && mainEditCard) {
        myProfileBtn.addEventListener("click", (e) => {
            e.preventDefault(); 
            mainEditCard.style.display = "block";
            mainEditCard.scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// Google Picker Function
function openGooglePicker() {
    alert("Google Photos integration is coming soon!");
}

// Main Edit Card Close Function
function goBack() {
    // Yeh code exactly wahi bhejega jahan se user is page par aaya tha
    window.history.back();
}


document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-menu .nav-item");
    const profileCard = document.getElementById("mainEditCard"); // Aapka profile form wala card ID
    const settingsCard = document.getElementById("settingsCard"); // Aapka settings wala card ID

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            // 1. Sabhi nav items se active class remove karein
            navItems.forEach(nav => nav.classList.remove("active"));
            
            // 2. Click kiye gaye item par active class lagayein
            item.classList.add("active");

            // 3. Target check karein
            const targetId = item.getAttribute("data-target");

            if (targetId === "profileCard") {
                if (profileCard) profileCard.style.display = "block";
                if (settingsCard) settingsCard.style.display = "none";
            } else if (targetId === "settingsCard") {
                if (settingsCard) settingsCard.style.display = "block";
                if (profileCard) profileCard.style.display = "none";
            }
        });
    });
});