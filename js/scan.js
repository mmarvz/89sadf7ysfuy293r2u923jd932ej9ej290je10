
let scanner; // Declare globally
let scanEnabled = false;

function validateCode(scannedCode) {
    const now = new Date();
    const currentTime = now.getTime();
    
    if (!scanEnabled) return;

    // Example: validate the scanned code
    const selectedUser = localStorage.getItem("lockedName") || "";
    const formattedTime = formatAMPM(now);
    const expected = selectedUser + formattedTime;

    if (scannedCode.trim().toLowerCase() === expected.toLowerCase()) {
        const log = `${selectedUser}, ${now.toLocaleDateString()}, ${formattedTime}`;
        saveLogToLocalStorage(selectedUser, log);
        document.getElementById("message").textContent = "✅ Scanned and saved!";
    } else {
        document.getElementById("message").textContent = "❌ Invalid QR Code.";
    }

    scanEnabled = false;
    scanner.clear(); // Stop scanner
}

function startScanner() {
    const readerDiv = document.getElementById("scanner");
    readerDiv.style.display = "block";

    if (!scanner) {
        scanner = new Html5QrcodeScanner("scanner", { fps: 10, qrbox: 250 });
        scanner.render(validateCode);
    }
}

// Single button to scan
document.getElementById("scan-btn").addEventListener("click", function () {
    scanEnabled = true;
    startScanner();
});

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes}${ampm}`;
}

function saveLogToLocalStorage(user, logEntry) {
    let logs = JSON.parse(localStorage.getItem(user + ".txt") || "[]");
    logs.push(logEntry);
    localStorage.setItem(user + ".txt", JSON.stringify(logs));
}