// Theme Change Function (Jab aap dropdown se theme badlenge)
function changeGlobalTheme(themeName) {
    // 1. Purani sabhi theme classes hata dein
    document.body.classList.remove("dark", "neon", "glass", "light");
    
    // 2. Agar "default" nahi hai, tabhi nayi theme class lagayein
    if (themeName !== "default") {
        document.body.classList.add(themeName);
    }
    
    // 3. LocalStorage mein save karein
    localStorage.setItem("selectedSupremeTheme", themeName);
}


// Is code ko apni 'them.js' file ke andar daal dein
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("selectedSupremeTheme") || "default";
    
    // Purani classes hatao
    document.body.classList.remove("dark", "neon", "glass", "light");
    
    // Agar default nahi hai toh nayi theme lagao
    if (savedTheme !== "default") {
        document.body.classList.add(savedTheme);
    }
    
    // Dropdown ko bhi update karein agar us page par hai
    const themeDropdown = document.getElementById("globalThemeSelector");
    if (themeDropdown) {
        themeDropdown.value = savedTheme;
    }
});