 const emojis = ['🍎', '🍌', '🍇', '🥤', '🍞', '🍫'];
const productArea = document.getElementById('product-area');
const cart = document.getElementById('cart');
const totalDisplay = document.getElementById('total');
const scanner = document.getElementById('scanner');
const npcBtn = document.getElementById('npcBtn');

let total = 0;
let scannedItems = new Set();
let isNPCActive = false;
let keepSpawningNPCs = false;

function startInfiniteNPCQueue() {
  if (keepSpawningNPCs) return; // Supaya tidak dobel kalau tombol ditekan lagi

  keepSpawningNPCs = true;
  spawnNextNPC();
}

function spawnNextNPC() {
  if (!keepSpawningNPCs) return;

  if (isNPCActive) {
    // Tunggu NPC sebelumnya selesai
    setTimeout(spawnNextNPC, 1000);
    return;
  }

  spawnNPCWithCheckout().then(() => {
    // Setelah NPC checkout selesai, langsung lanjut ke berikutnya
    spawnNextNPC();
  });
}

const npcTypes = [
  {
    name: "Lansia",
    icon: "👵",
    delay: 2000, // Lebih lambat saat scan
    payAccuracy: "exact", // Bayar tepat
    maxItems: 3
  },
  {
    name: "Anak-anak",
    icon: "🧒",
    delay: 1000,
    payAccuracy: "mistake", // Kadang salah taruh
    maxItems: 2
  },
  {
    name: "Robot",
    icon: "🤖",
    delay: 300, // Cepat
    payAccuracy: "exact",
    maxItems: 5
  },
  {
    name: "Bandel",
    icon: "😈",
    delay: 800,
    payAccuracy: "chaotic", // Lempar barang kalau kelamaan
    maxItems: 4
  }
];
function spawnNPCWithCheckout() {
  return new Promise(resolve => {
    isNPCActive = true;

    // Reset area dan keranjang
    productArea.innerHTML = '';
    cart.innerHTML = '';
    total = 0;
    totalDisplay.textContent = total;
    scannedItems.clear();

    const npcType = npcTypes[Math.floor(Math.random() * npcTypes.length)];
    currentNPCType = npcType;

    const npcEl = document.createElement('div');
    npcEl.className = 'npc';
    npcEl.textContent = npcType.icon + ' ' + npcType.name;
    document.getElementById('npc-container').appendChild(npcEl);

    // Simulasi delay unik per tipe
    setTimeout(() => {
      spawnProductsForNPC(npcType);
    }, 1000);

    window.finishCurrentNPC = () => {
      npcEl.remove();
      isNPCActive = false;
      resolve();
    };
  });
}


// Ubah fungsi confirmPayment supaya setelah bayar panggil nextNPC
function confirmPayment() {
  if (currentInput === '' || parseInt(currentInput) <= 0) {
    alert("Masukkan jumlah bayar yang valid.");
    return;
  }

  const bayar = parseInt(currentInput);
  if (bayar < total) {
    alert(`Uang kurang! Total belanja: Rp${total.toLocaleString('id-ID')}`);
    return;
  }

  const kembalian = bayar - total;

  // Tampilkan struk dll (kode kamu sudah ada)...

  // Reset kalkulator dan keranjang
  currentInput = '';
  updateDisplay();

  total = 0;
  totalDisplay.textContent = total;
  cart.innerHTML = '';
  productArea.innerHTML = 'Belum ada pelanggan...';
  // Panggil NPC berikutnya setelah checkout selesai
  nextNPC();
}
function spawnProductsForNPC(npcType) {
  const count = npcType.maxItems;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const price = (Math.floor(Math.random() * 10) + 1) * 1000;
      const id = `item-${Date.now()}-${i}`;
      const scannable = Math.random() < 0.7; // 70% bisa discan

      const div = document.createElement('div');
      div.className = 'product';
      div.id = id;
      div.setAttribute('draggable', 'true');
      div.setAttribute('data-price', price);

      // ⬇️ Tambahkan atribut ini
      const isScannable = Math.random() < 0.7; // 70% produk bisa discan
      div.setAttribute('data-scannable', isScannable ? 'true' : 'false');

      div.innerHTML = `${emoji}<div class="product-price">Rp${price}</div>`;

      div.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', id);
      });

      productArea.appendChild(div);
    }, npcType.delay * i);
  }

  // NPC bandel: bisa lempar barang kalau telat
  if (npcType.payAccuracy === "chaotic") {
    setTimeout(() => {
      if (!checkoutDoneYet()) {
        alert("NPC 😈 bandel melempar barang keluar!");
        productArea.innerHTML = '';
      }
    }, 10000);
  }
  
}


// Drag & Drop handling
scanner.addEventListener('dragover', e => e.preventDefault());
cart.addEventListener('dragover', e => e.preventDefault());

scanner.addEventListener('drop', e => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  if (!id) return;

  const item = document.getElementById(id);
  if (!item) return;

  const isScannable = item.getAttribute('data-scannable') === 'true';
  if (!isScannable) {
    alert("Barang ini tidak bisa discan. Harap masukkan langsung ke keranjang.");
    return;
  }

  if (scannedItems.has(id)) {
    alert("Barang sudah discan!");
    return;
  }

  scannedItems.add(id);

  // Flash scanner
  scanner.style.backgroundColor = '#bbf7d0';
  setTimeout(() => scanner.style.backgroundColor = '#e0f2fe', 300);

  // Ambil harga dan update total
  const price = parseInt(item.getAttribute('data-price'));
  total += price;
  totalDisplay.textContent = total;

  // Tambahkan ke cart
  const newItem = document.createElement('div');
  newItem.className = 'product';
  newItem.innerHTML = item.innerHTML;
  cart.appendChild(newItem);

  // Hapus dari rak
  item.remove();

  scannedItems.delete(id); // agar bisa scan ulang kalau perlu
});

// Event drop sudah ada
cart.addEventListener('drop', e => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  if (!id) return;

  const item = document.getElementById(id);
  if (!item) return;

  const isScannable = item.getAttribute('data-scannable') === 'true';

  if (!isScannable) {
    // Barang tidak bisa discan → boleh langsung ke keranjang tapi belum dihitung
    const newItem = document.createElement('div');
    newItem.className = 'product not-scanned'; // class khusus
    newItem.setAttribute('data-price', item.getAttribute('data-price') || '0');
    newItem.setAttribute('data-id', item.id);
    newItem.innerHTML = item.innerHTML + '<span class="unconfirmed">❌</span>';
    cart.appendChild(newItem);
    item.remove();
  } else {
    // Barang harus discan terlebih dahulu
    alert('Barang ini harus discan dulu sebelum masuk keranjang!');
  }
});


document.getElementById('autoPayBtn').addEventListener('click', function() {
  if (total === 0) {
    alert("Tidak ada total belanja untuk dibayar.");
    return;
  }
  // Set currentInput jadi total (supaya sesuai format)
  currentInput = total.toString();
  updateDisplay();
  confirmPayment();
});

function showReceipt(items, total) {
  const receiptModal = document.getElementById('receiptModal');
  const receiptText = document.getElementById('receiptText');

  let text = '';
  items.forEach(item => {
    text += `${item.name.padEnd(10, ' ')}  Rp${item.price.toLocaleString('id-ID')}\n`;
  });
  text += '\n----------------------\n';
  text += `Total: Rp${total.toLocaleString('id-ID')}`;

  receiptText.textContent = text;
  receiptModal.style.display = 'block';
}

// Close modal when clicking X
document.getElementById('closeReceipt').onclick = function() {
  document.getElementById('receiptModal').style.display = 'none';
};

// Optional: close modal when clicking outside modal content
window.onclick = function(event) {
  const modal = document.getElementById('receiptModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

//kalkulator logic 
let currentInput = '';
let displayValue = ""; // tampungan input kalkulator
const display = document.getElementById("display");

  function pressNumber(num) {
    displayValue += num.toString();
    updateDisplay();
  }

  function clearDisplay() {
    displayValue = "";
    updateDisplay();
  }

  function updateDisplay() {
    display.textContent = displayValue || "0";
  }

  function addManualPrice() {
  const price = parseInt(display.textContent);
  if (isNaN(price)) {
    alert("Masukkan angka yang valid");
    return;
  }

  const notCountedItem = document.querySelector('.product.not-scanned .unconfirmed');
  if (!notCountedItem) {
    alert("Tidak ada barang manual yang perlu dihitung");
    return;
  }

  // Validasi agar harga yang dimasukkan sesuai dengan harga barang manual
  // Kalau ada aturan tertentu, kamu bisa tambahkan cek di sini

  notCountedItem.textContent = ``;
  notCountedItem.parentElement.classList.remove('not-scanned');

  total += price;
  totalDisplay.textContent = total;

  display.textContent = '0';
  displayValue = "";
}

function confirmPayment() {
  if (currentInput === '' || parseInt(currentInput) <= 0) {
    alert("Masukkan jumlah bayar yang valid.");
    return;
  }

  const bayar = parseInt(currentInput);
  if (bayar < total) {
    alert(`Uang kurang! Total belanja: Rp${total.toLocaleString('id-ID')}`);
    return;
  }

  const kembalian = bayar - total;

  // Ambil item dari keranjang buat receipt
  const items = [];
  cart.querySelectorAll('.product').forEach(prod => {
    const name = prod.textContent.replace(/Rp[\d.]+/, '').trim();
    const priceText = prod.querySelector('.product-price').textContent;
    const price = parseInt(priceText.replace(/Rp/g, '').replace(/\./g, ''));
    items.push({ name, price });
  });

  // Tampilkan receipt
  let receiptText = '🧾 STRUK PEMBELIAN\n\n';
  items.forEach(item => {
    receiptText += `${item.name} - Rp${item.price.toLocaleString('id-ID')}\n`;
  });
  receiptText += '\n';
  receiptText += `Total     : Rp${total.toLocaleString('id-ID')}\n`;
  receiptText += `Bayar     : Rp${bayar.toLocaleString('id-ID')}\n`;
  receiptText += `Kembalian : Rp${kembalian.toLocaleString('id-ID')}`;

  // Tampilkan di modal
  document.getElementById('receiptText').textContent = receiptText;
  document.getElementById('receiptModal').style.display = 'block';

  // Reset setelah bayar
  currentInput = '';
  updateDisplay();

  total = 0;
  totalDisplay.textContent = total;
  cart.innerHTML = '';
  productArea.innerHTML = 'Belum ada pelanggan...';
  npc.style.display = 'none';
  isNPCActive = false;
  reduceStamina(10);
  addXP(xpPerTransaction);
playSound('sound-checkout');  // suara ching saat bayar
playSound('sound-receipt');   // suara kertas/struk muncul

// Tambahkan ini
if (typeof finishCurrentNPC === 'function') {
  finishCurrentNPC();
}

}

//npc simpen barang
function npcPutProduct() {
  const productArea = document.getElementById('product-area');

  // Random ambil produk dari daftar
  const randomProduct = productList[Math.floor(Math.random() * productList.length)];

  // Buat elemen produk
  const productEl = document.createElement('div');
  productEl.classList.add('product');
  productEl.innerHTML = `${randomProduct.name}<div class="product-price">Rp ${randomProduct.price}</div>`;

  // Tambah ke rak produk
  productArea.appendChild(productEl);
}

// tambahin reduceStamina(10); bebas diisi berapa aja mau 10 atau x di confirmPayment()
let stamina = 100;
let maxStamina = 100;
let regenInterval = null;

function updateStaminaUI() {
  document.getElementById('stamina-bar').value = stamina;
  document.getElementById('stamina-text').textContent = stamina;
}

function reduceStamina(amount) {
  stamina -= amount;
  if (stamina < 0) stamina = 0;
  updateStaminaUI();

  if (stamina === 0 && !regenInterval) {
    alert("Stamina habis! Istirahat dan tunggu pemulihan...");

    regenInterval = setInterval(() => {
      stamina += 10;
      if (stamina >= maxStamina) {
        stamina = maxStamina;
        clearInterval(regenInterval);
        regenInterval = null;
      }
      updateStaminaUI();
    }, 50000); // setiap 20 detik naik 10
  }
}


//tambahin fungsi addXP(xpPerTransaction); di confirmPayment() sebelum finishCurrentNPC()
let playerXP = 0;
let playerLevel = 1;
const xpPerTransaction = 50;
const xpPerLevel = 100;

function updateStatusPanel() {
  document.getElementById('playerLevel').textContent = playerLevel;
  document.getElementById('playerXP').textContent = playerXP;
  document.getElementById('xpPerLevel').textContent = xpPerLevel;
  updateBadge(playerLevel);
}

function addXP(amount) {
  playerXP += amount;
  if (playerXP >= xpPerLevel) {
    playerXP -= xpPerLevel;
    playerLevel++;
    alert(`🎉 Level up! Sekarang kamu level ${playerLevel}`);
  }
  updateStatusPanel();
}
function updateBadge(level) {
  const badge = document.getElementById('xpBadge');
  badge.className = 'badge'; // reset semua kelas badge
  if (level >= 15) {
    badge.classList.add('level15');
    badge.textContent = '🔥';
  } else if (level === 12) {
    badge.classList.add('level12');
    badge.textContent = '🌟';
  } else if (level === 8) {
    badge.classList.add('level8');
    badge.textContent = '✨';
  } else if (level === 4) {
    badge.classList.add('level4');
    badge.textContent = '⭐';
  } else {
    badge.classList.add('level1');
    badge.textContent = '⚪';
  }
}


function playSound(id) {
  const sound = document.getElementById(id);
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}
function showReceipt(text) {
  document.getElementById("receiptText").textContent = text;
  document.getElementById("receiptModal").style.display = "block";

  // 🔊 Putar suara receipt
  playSound("sound-receipt");
}

window.finishCurrentNPC = () => {
  npcEl.remove();
  isNPCActive = false;

  // 🔊 Putar suara checkout
  playSound("sound-checkout");

  resolve(); // Lanjut NPC berikutnya
};
