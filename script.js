    const users = {
      marvin: { name: "malazagamarvin", image: "https://via.placeholder.com/100?text=Marvin" },
      aiza: { name: "aizasmith", image: "https://via.placeholder.com/100?text=Aiza" },
      samuel: { name: "samueldoe", image: "https://via.placeholder.com/100?text=Samuel" }
    };

    let lockedUser = null;

    const userSelect = document.getElementById("user-select");
    const lockButton = document.getElementById("lock-button");
    const userImage = document.getElementById("user-image");
    const qrcodeContainer = document.getElementById("qrcode");
    const scannerContainer = document.getElementById("scanner");
    const message = document.getElementById("message");

    function formatTime(date) {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${hours}:${minutes}${ampm}`;
    }

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("QRUserDB", 1);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("user")) {
        db.createObjectStore("user");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveUserToDB(key, value) {
  const db = await openDB();
  const tx = db.transaction("user", "readwrite");
  tx.objectStore("user").put(value, key);
  return tx.complete;
}

async function getUserFromDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("user", "readonly");
    const store = tx.objectStore("user");
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

    function generateQRCode(userKey) {
      const name = users[userKey].name;
      const timeStr = formatTime(new Date());
      const fullCode = name + timeStr;
      QRCode.toCanvas(document.createElement('canvas'), fullCode, (err, canvas) => {
        qrcodeContainer.innerHTML = '';
        qrcodeContainer.appendChild(canvas);
      });
    }

    function updateQRLoop(userKey) {
      generateQRCode(userKey);
      setInterval(() => generateQRCode(userKey), 1000); // update every minute
    }

lockButton.addEventListener('click', async () => {
  const selected = userSelect.value;
  if (!selected) return alert("Please select a user.");
  lockedUser = selected;

  userSelect.disabled = true;
  lockButton.disabled = true;
  userImage.src = users[selected].image;
  userImage.style.display = "inline";

  await saveUserToDB("lockedUser", selected);
  updateQRLoop(selected);
});

    document.getElementById("scan-btn").addEventListener('click', () => {
      scannerContainer.style.display = 'block';
      const html5QrCode = new Html5Qrcode("scanner");

      Html5Qrcode.getCameras().then(devices => {
        if (devices.length) {
          html5QrCode.start(
            devices[0].id,
            { fps: 10, qrbox: 250 },
            qrCodeMessage => {
              validateScan(qrCodeMessage);
              html5QrCode.stop();
              scannerContainer.style.display = 'none';
            },
            error => {}
          );
        }
      });
    });

    function validateScan(scannedCode) {
      const now = new Date();
      const currentTime = formatTime(now);
      let found = false;

      for (const key in users) {
        const expected = users[key].name + currentTime;
        if (scannedCode === expected) {
          saveToLog(users[key].name, currentTime);
          message.textContent = `✅ Success! Logged for ${users[key].name}`;
          found = true;
          break;
        }
      }

      if (!found) {
        message.textContent = "❌ Error: QR code does not match current time or name.";
      }
    }

    function saveToLog(name, time) {
      const key = `log_${name}`;
      const date = new Date().toLocaleDateString();
      const logs = JSON.parse(localStorage.getItem(key)) || [];
      logs.push(`${date} ${time}`);
      localStorage.setItem(key, JSON.stringify(logs));
    }

window.addEventListener("DOMContentLoaded", async () => {
  const savedUser = await getUserFromDB("lockedUser");
  if (savedUser && users[savedUser]) {
    lockedUser = savedUser;
    userSelect.value = savedUser;
    userSelect.disabled = true;
    lockButton.disabled = true;
    userImage.src = users[savedUser].image;
    userImage.style.display = "inline";
    updateQRLoop(savedUser);
  }
});