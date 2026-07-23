 document.addEventListener("DOMContentLoaded", function() {
        const container = document.getElementById('firebaseMobileCategories');
        if (!container) return;

        // Firestore se data fetch karna: path -> collection('data').doc('matrix_config')
        db.collection("data").doc("matrix_config").get()
            .then((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    const folders = data.folders; // Yeh aapka folders array hai

                    if (folders && Array.isArray(folders) && folders.length > 0) {
                        let htmlContent = '';
                        folders.forEach(folder => {
                            htmlContent += `
                                <a href="#" class="cat-pill">
                                    <div class="cat-icon-wrap" style="background: rgba(79, 70, 229, 0.1); color: ${folder.color || '#4f46e5'};">
                                        <i class="${folder.icon || 'fa-folder'}"></i>
                                    </div>
                                    <span>${folder.name}</span>
                                </a>
                            `;
                        });
                        container.innerHTML = htmlContent;
                    } else {
                        container.innerHTML = '<span style="font-size:12px; color:#64748b; padding:10px;">No folders found</span>';
                    }
                } else {
                    container.innerHTML = '<span style="font-size:12px; color:#64748b; padding:10px;">Config document not found</span>';
                }
            })
            .catch((error) => {
                console.error("Error getting document:", error);
                container.innerHTML = '<span style="font-size:12px; color:#ef4444; padding:10px;">Failed to load</span>';
            });
    });






    //sub folder connect//
        document.addEventListener("DOMContentLoaded", function() {
        const chipsContainer = document.getElementById('firebaseSubChips');
        if (!chipsContainer) return;

        // Firestore se data fetch karna: collection('data').doc('matrix_config')
        db.collection("data").doc("matrix_config").get()
            .then((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    const subs = data.subs || []; // Yeh aapka 'subs' array hai

                    // Shuru ke All aur Recent buttons retain rakhein
                    let htmlContent = `
                        <button class="chip-btn active">All</button>
                        <button class="chip-btn">Recent</button>
                    `;

                    // Firebase ke 'subs' array se sub-folders ke naam nikal kar chips banana
                    subs.forEach(sub => {
                        if (sub.name) {
                            htmlContent += `
                                <button class="chip-btn">${sub.name}</button>
                            `;
                        }
                    });

                    chipsContainer.innerHTML = htmlContent;
                }
            })
            .catch((error) => {
                console.error("Error fetching subs:", error);
            });
    });


// Jab bhi kisi chip par click ho, ye function chalega
document.addEventListener("click", function(event) {
    if (event.target.classList.contains('chip-btn')) {
        // Saare chips se 'active' class hata do
        const allChips = document.querySelectorAll('.chip-btn');
        allChips.forEach(btn => btn.classList.remove('active'));
        
        // Sirf clicked wale chip par 'active' class lagao
        event.target.classList.add('active');
    }
});










    const bannersData = [
        { hashtag: "#BiharPolice", title: "Bihar Police Vacancy", date: "Start: 01 Jul - End: 30 Jul", desc: "Apply for latest constable openings.", btnText: "Apply Now" },
        { hashtag: "#Scholarship", title: "Post Matric Scholarship", date: "Start: 10 Jul - End: 15 Aug", desc: "Financial support for college students.", btnText: "Check Details" },
        { hashtag: "#NewExam", title: "TCS BPS Recruitment", date: "Start: 05 Jul - End: 20 Jul", desc: "Freshers drive for 2026 batch.", btnText: "Register" },
        { hashtag: "#AadhaarUpdate", title: "Aadhaar Biometric Lock", date: "Start: 01 Jul - End: Ongoing", desc: "Secure your digital identity easily.", btnText: "Learn More" },
        { hashtag: "#E-Services", title: "Smart Meter Recharge", date: "Start: 24/7 Available", desc: "Instant electricity bill payment.", btnText: "Pay Now" },
        { hashtag: "#GovtPortal", title: "Ayushman Card Camp", date: "Start: 12 Jul - End: 30 Jul", desc: "Get free healthcare coverage up to 5L.", btnText: "Apply" },
        { hashtag: "#CardsPortal", title: "PAN Card Instant Link", date: "Start: Always Open", desc: "Link Aadhaar with PAN seamlessly.", btnText: "Proceed" },
        { hashtag: "#StudentsFeed", title: "University Exam Form", date: "Start: 18 Jul - End: 05 Aug", desc: "Submit B.Sc semester examination fee.", btnText: "Fill Form" }
    ];

    let currentIndex = 0;

    function renderBanner(index) {
        const banner = bannersData[index];
        document.getElementById('bannerHashtag').innerText = banner.hashtag;
        
        const carousel = document.getElementById('bannerCarousel');
        carousel.innerHTML = `
            <div class="banner-card">
                <div class="banner-date-badge"><i class="fas fa-clock"></i> ${banner.date}</div>
                <div class="banner-content">
                    <h4>${banner.title}</h4>
                    <p>${banner.desc}</p>
                    <button class="banner-apply-btn">${banner.btnText}</button>
                </div>
            </div>
        `;

        // Update Dots
        const dots = document.querySelectorAll('.banner-dots .dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === (index % dots.length));
        });
    }

    // Auto-scroll every 3.5 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % bannersData.length;
        renderBanner(currentIndex);
    }, 3500);

    document.addEventListener("DOMContentLoaded", () => {
        renderBanner(0);
    });










    async function loadCardsFromFirebase() {
    try {
        // Firestore reference (Aapke project ke setup ke mutabiq)
        const docRef = db.collection("data").doc("matrix_config");
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            const cardsArray = data.cards || []; // Firestore ka cards array
            
            const container = document.getElementById('firebaseCardsContainer');
            container.innerHTML = ""; // Purana loading text hata dein

            cardsArray.forEach(card => {
                // Har ek card ke liye HTML element banana
                const cardElement = document.createElement('div');
                cardElement.className = 'mobile-utility-card';
                cardElement.onclick = () => {
                    if(card.url) window.open(card.url, '_blank');
                };

                cardElement.innerHTML = `
                    <div class="card-icon-box" style="background-color: ${card.color || '#1e293b'}; color: #fff;">
                        <i class="${card.icon || 'fas fa-star'}"></i>
                    </div>
                    <div class="card-info-box">
                        <h4>${card.title || 'Service Card'}</h4>
                        <p>${card.desc || card.sub || 'Click to explore more details'}</p>
                    </div>
                `;
                container.appendChild(cardElement);
            });
        } else {
            console.log("No such document in Firebase!");
        }
    } catch (error) {
        console.error("Error loading cards:", error);
    }
}

// Page load hone par function call karein
document.addEventListener("DOMContentLoaded", () => {
    loadCardsFromFirebase();
});