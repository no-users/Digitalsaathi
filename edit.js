// ==========================================
// DIGITAL SAATHI - CORE UTILITY & EDITOR JS
// ==========================================

let cropper;
const API_KEY = 'QnsDa3AogfoC8w5jqB4ShNz9';

// 1. Clock Updates (Safe Check)
setInterval(() => {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleString();
    }
}, 1000);

// 2. Image Upload & Cropper Initialization
const uploadInput = document.getElementById('upload');
if (uploadInput) {
    uploadInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.getElementById('mainImage');
            if (!img) return;

            img.src = reader.result;
            if (cropper) cropper.destroy();
            
            // Cropper instance setup
            cropper = new Cropper(img, { 
                viewMode: 1, 
                dragMode: 'move',
                autoCropArea: 0.8
            });
        };
        reader.readAsDataURL(file);
    };
}

// 3. Passport Size Auto-Set (Ratio 3.5 : 4.5)
function setPassport() {
    if (cropper) {
        cropper.setAspectRatio(3.5 / 4.5);
    } else {
        alert('Kripya pehle image upload karein!');
    }
}

// 4. Realistic Signature Overlay
const sigUploadInput = document.getElementById('sigUpload');
if (sigUploadInput) {
    sigUploadInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const editorContainer = document.getElementById('editor-container');
            if (!editorContainer) return;

            const sig = document.createElement('img');
            sig.src = reader.result;
            sig.className = 'sig-overlay';
            sig.style.width = "120px";
            sig.style.position = "absolute";
            sig.style.cursor = "grab";
            
            editorContainer.appendChild(sig);
            makeDraggable(sig);
        };
        reader.readAsDataURL(file);
    };
}

// 5. Size Control Logic (Iterative Compression for Target KB)
async function finalDownload() {
    if (!cropper) {
        alert('Pehle image upload karke crop karein!');
        return;
    }

    const canvas = cropper.getCroppedCanvas();
    const targetKBInput = document.getElementById('targetKB');
    const targetKB = targetKBInput ? targetKBInput.value : 50; // Default 50KB agar input na ho
    
    let quality = 0.95;
    let blob;

    // Loop to reach target size smoothly
    do {
        blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
        quality -= 0.05;
    } while (blob.size / 1024 > targetKB && quality > 0.1);

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DigitalSaathi_Photo_${targetKB}kb.jpg`;
    link.click();
}

// 6. Print Layout Generator (6/12 Sheet Maker)
function generatePrint(count) {
    if (!cropper) {
        alert('Pehle image upload karke crop karein!');
        return;
    }

    const canvas = cropper.getCroppedCanvas();
    const printCanvas = document.createElement('canvas');
    const ctx = printCanvas.getContext('2d');

    // A4 Size @ 300 DPI layout dimensions
    printCanvas.width = 2480;
    printCanvas.height = 3508;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

    const imgW = 413; // ~3.5cm width ratio
    const imgH = 531; // ~4.5cm height ratio
    
    let x = 150, y = 150;
    for (let i = 0; i < count; i++) {
        ctx.drawImage(canvas, x, y, imgW, imgH);
        x += imgW + 60;
        if (x > 2000) { 
            x = 150; 
            y += imgH + 80; 
        }
    }

    const link = document.createElement('a');
    link.href = printCanvas.toDataURL('image/jpeg', 1.0);
    link.download = `DigitalSaathi_Print_Sheet_${count}Pcs.jpg`;
    link.click();
}

// 7. Draggable Helper (Smooth Signature Dragging)
function makeDraggable(el) {
    let startX = 0, startY = 0;
    el.onmousedown = (e) => {
        e.preventDefault();
        startX = e.clientX; 
        startY = e.clientY;
        
        document.onmousemove = (e) => {
            el.style.left = (el.offsetLeft - (startX - e.clientX)) + "px";
            el.style.top = (el.offsetTop - (startY - e.clientY)) + "px";
            startX = e.clientX; 
            startY = e.clientY;
        };
        
        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };
}
