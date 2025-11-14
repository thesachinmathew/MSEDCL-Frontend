const API_GATEWAY_URL = 'https://YOUR_API_GATEWAY_URL'; // e.g. https://abc123.execute-api.us-east-1.amazonaws.com/prod
const S3_BUCKET = 'YOUR_S3_BUCKET_NAME';
const AWS_REGION = 'us-east-1';



// Demo/local customer store
let customersDatabase = [
  { id: 'CUST001', name: 'Rajesh Kumar', address:'123 MG Road', phone:'+91 98765 43210', email:'rajesh@example.com' },
  { id: 'CUST002', name: 'Priya Sharma', address:'456 Church Street', phone:'+91 98765 43211', email:'priya@example.com' },
  { id: 'CUST003', name: 'Anand Menon', address:'789 Beach Road', phone:'+91 98765 43212', email:'anand@example.com' }
];

// State
let selectedCustomer = null;
let capturedImage = null;
let isAnomalyOverride = false;


// DOM elements (many pages share same IDs)
const customerIdInput = document.getElementById && document.getElementById('customerIdInput');
const customerDropdown = document.getElementById && document.getElementById('customerDropdown');
const createCustomerBtn = document.getElementById && document.getElementById('createCustomerBtn');
const clearCustomerBtn = document.getElementById && document.getElementById('clearCustomerBtn');
const selectedCustomerInfo = document.getElementById && document.getElementById('selectedCustomerInfo');
const uploadDisabledMessage = document.getElementById && document.getElementById('uploadDisabledMessage');
const uploadArea = document.getElementById && document.getElementById('uploadArea');
const fileInput = document.getElementById && document.getElementById('fileInput');
const cameraBtn = document.getElementById && document.getElementById('cameraBtn');
const uploadBtn = document.getElementById && document.getElementById('uploadBtn');
const uploadPlaceholder = document.getElementById && document.getElementById('uploadPlaceholder');
const imagePreview = document.getElementById && document.getElementById('imagePreview');
const previewImg = document.getElementById && document.getElementById('previewImg');
const retakeBtn = document.getElementById && document.getElementById('retakeBtn');
const submitBtn = document.getElementById && document.getElementById('submitBtn');
const loadingState = document.getElementById && document.getElementById('loadingState');
const createCustomerModal = document.getElementById && document.getElementById('createCustomerModal');
const closeModalBtn = document.getElementById && document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById && document.getElementById('cancelModalBtn');
const createCustomerForm = document.getElementById && document.getElementById('createCustomerForm');
const anomalyModal = document.getElementById && document.getElementById('anomalyModal');
const retakeAnomalyBtn = document.getElementById && document.getElementById('retakeAnomalyBtn');
const overrideBtn = document.getElementById && document.getElementById('overrideBtn');
const toast = document.getElementById && document.getElementById('toast');
const toastMessage = document.getElementById && document.getElementById('toastMessage');

// Safe DOM helpers because same script used across pages
function el(id) { return document.getElementById(id); }

// Global logout function
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }
}

// Initialize on pages that have relevant elements
document.addEventListener('DOMContentLoaded', () => {
  // Load customers from local storage (demo)
  loadCustomersFromLocalStorage();

  // If capture page, wire listeners
  if (customerIdInput) setupEventListeners();

  // Preselect customer if user came from History/Customers pages
  const pre = localStorage.getItem('preselectCustomer');
  if (pre && customerIdInput) {
    const c = customersDatabase.find(x => x.id === pre);
    if (c) selectCustomer(c);
    localStorage.removeItem('preselectCustomer');
  }

  // If override requested from history, preselect
  const overrideCust = localStorage.getItem('overrideCustomer');
  if (overrideCust && customerIdInput) {
    const c = customersDatabase.find(x => x.id === overrideCust);
    if (c) {
      selectCustomer(c);
      showToast('Override mode: confirm and press Upload & Process', 'info');
    }
    localStorage.removeItem('overrideCustomer');
  }
});

// ---------------- Event wiring ----------------
function setupEventListeners() {
  customerIdInput.addEventListener('input', handleCustomerSearch);
  customerIdInput.addEventListener('focus', handleCustomerSearch);

  document.addEventListener('click', (e) => {
    if (!customerIdInput.contains(e.target) && customerDropdown && !customerDropdown.contains(e.target)) {
      customerDropdown.classList.remove('show');
    }
  });

  if (createCustomerBtn) createCustomerBtn.addEventListener('click', openCreateCustomerModal);
  if (clearCustomerBtn) clearCustomerBtn.addEventListener('click', clearCustomerSelection);

  if (cameraBtn) cameraBtn.addEventListener('click', () => fileInput && fileInput.click());
  if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput && fileInput.click());
  if (fileInput) fileInput.addEventListener('change', handleFileSelect);
  if (retakeBtn) retakeBtn.addEventListener('click', resetImageUpload);
  if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeCreateCustomerModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeCreateCustomerModal);
  if (createCustomerForm) createCustomerForm.addEventListener('submit', handleCreateCustomer);

  if (anomalyModal) {
    anomalyModal.addEventListener('click', (e) => {
      if (e.target === anomalyModal) closeAnomalyModal();
    });
  }
  if (retakeAnomalyBtn) retakeAnomalyBtn.addEventListener('click', handleRetakeAfterAnomaly);
  if (overrideBtn) overrideBtn.addEventListener('click', handleOverride);
}

// ---------------- Customer Search & Selection ----------------
function handleCustomerSearch() {
  const input = customerIdInput;
  const dropdown = customerDropdown;
  const searchTerm = (input.value || '').toLowerCase().trim();

  if (!searchTerm) {
    dropdown && dropdown.classList.remove('show');
    return;
  }

  // Ideally: call API to search customers. For demo use local DB
  const filtered = customersDatabase.filter(c =>
    c.id.toLowerCase().includes(searchTerm) || (c.name || '').toLowerCase().includes(searchTerm)
  );

  displayDropdown(filtered);
}

function displayDropdown(customers) {
  if (!customerDropdown) return;
  customerDropdown.innerHTML = '';

  if (!customers.length) {
    customerDropdown.innerHTML = '<div class="dropdown-empty">No customers found</div>';
    customerDropdown.classList.add('show');
    return;
  }

  customers.forEach(customer => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <div class="dropdown-item-title">${customer.id} - ${customer.name}</div>
      <div class="dropdown-item-subtitle">${customer.address || ''}</div>
    `;
    item.addEventListener('click', () => selectCustomer(customer));
    customerDropdown.appendChild(item);
  });

  customerDropdown.classList.add('show');
}

function selectCustomer(customer) {
  selectedCustomer = customer;
  if (customerIdInput) customerIdInput.value = `${customer.id} - ${customer.name}`;
  if (el('infoCustomerId')) el('infoCustomerId').textContent = customer.id;
  if (el('infoCustomerName')) el('infoCustomerName').textContent = customer.name;
  if (el('infoCustomerAddress')) el('infoCustomerAddress').textContent = customer.address || '';
  if (el('infoCustomerPhone')) el('infoCustomerPhone').textContent = customer.phone || '';

  selectedCustomerInfo && selectedCustomerInfo.classList.remove('hidden');
  uploadDisabledMessage && uploadDisabledMessage.classList.add('hidden');
  uploadArea && uploadArea.classList.remove('hidden');
}

function clearCustomerSelection() {
  selectedCustomer = null;
  if (customerIdInput) customerIdInput.value = '';
  selectedCustomerInfo && selectedCustomerInfo.classList.add('hidden');
  uploadDisabledMessage && uploadDisabledMessage.classList.remove('hidden');
  uploadArea && uploadArea.classList.add('hidden');
  resetImageUpload();
}

// ---------------- Create Customer Modal ----------------
function openCreateCustomerModal() {
  if (!createCustomerModal) return;
  createCustomerModal.classList.remove('hidden');
  ['newCustomerId','customerName','customerAddress','customerPhone','customerEmail'].forEach(id => {
    const i = el(id);
    if (i) i.value = '';
  });
}

function closeCreateCustomerModal() {
  createCustomerModal && createCustomerModal.classList.add('hidden');
}

function handleCreateCustomer(e) {
  e && e.preventDefault();
  const id = (el('newCustomerId').value || '').trim();
  const name = (el('customerName').value || '').trim();
  const address = (el('customerAddress').value || '').trim();
  const phone = (el('customerPhone').value || '').trim();
  const email = (el('customerEmail').value || '').trim();

  if (!id || !name) {
    showToast('Please provide at least ID and Name', 'error');
    return;
  }

  // If exists: update; else create
  const existsIdx = customersDatabase.findIndex(c => c.id === id);
  const newCustomer = { id, name, address, phone, email };
  if (existsIdx >= 0) {
    customersDatabase[existsIdx] = newCustomer;
    showToast('Customer updated', 'success');
  } else {
    customersDatabase.push(newCustomer);
    showToast('Customer created', 'success');
  }

  saveCustomersToLocalStorage();
  closeCreateCustomerModal();
  selectCustomer(newCustomer);
}

// ---------------- Image Handling ----------------
function handleFileSelect(e) {
  const file = (e && e.target && e.target.files && e.target.files[0]) || null;
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Image must be < 10MB', 'error');
    return;
  }

  capturedImage = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    if (previewImg) previewImg.src = ev.target.result;
    uploadPlaceholder && uploadPlaceholder.classList.add('hidden');
    imagePreview && imagePreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function resetImageUpload() {
  capturedImage = null;
  if (fileInput) fileInput.value = '';
  if (previewImg) previewImg.src = '';
  uploadPlaceholder && uploadPlaceholder.classList.remove('hidden');
  imagePreview && imagePreview.classList.add('hidden');
  isAnomalyOverride = false;
}

// ---------------- Submit Flow ----------------
async function handleSubmit() {
  if (!selectedCustomer) { showToast('Select a customer first', 'error'); return; }
  if (!capturedImage) { showToast('Take or upload a photo first', 'error'); return; }

  // disable UI
  imagePreview && imagePreview.classList.add('hidden');
  loadingState && loadingState.classList.remove('hidden');
  submitBtn && (submitBtn.disabled = true);

  try {
    // 1) Get presigned URL for S3 upload from backend (recommended)
    const timestamp = new Date().getTime();
    const s3Key = `${selectedCustomer.id}/${timestamp}-${capturedImage.name}`;

    // If you have an API that returns presigned URL:
    // const presigned = await fetch(`${API_GATEWAY_URL}/presign?key=${encodeURIComponent(s3Key)}`).then(r=>r.json());
    // await fetch(presigned.url, { method: 'PUT', body: capturedImage, headers: { 'Content-Type': capturedImage.type } });

    // For now: placeholder - you must implement upload to S3 (presigned or AWS JS SDK)
    await uploadToS3(capturedImage, s3Key);

    // 2) Notify backend / trigger lambda (if not automatic via S3 event)
    // If S3 event triggers Lambda, skip – otherwise call endpoint:
    // await fetch(`${API_GATEWAY_URL}/notify`, { method:'POST', body: JSON.stringify({ s3Key, customerId: selectedCustomer.id }) });

    // 3) Poll processing result (or call check-result endpoint)
    const result = await checkProcessingResult(s3Key);

    handleProcessingResult(result, s3Key);

  } catch (err) {
    console.error(err);
    showToast('Upload or processing failed', 'error');
    loadingState && loadingState.classList.add('hidden');
    imagePreview && imagePreview.classList.remove('hidden');
    submitBtn && (submitBtn.disabled = false);
  }
}

// ---------------- S3 Upload (placeholder) ----------------
async function uploadToS3(file, s3Key) {
  console.log('== uploadToS3 placeholder ==', s3Key);
  // Implement one of:
  // 1) Request presigned URL from API & PUT to it
  // 2) Use AWS SDK with Cognito credentials (not covered here)
  // 3) POST multipart to API Gateway that stores to S3

  // Example (presigned) skeleton:
  /*
    const ps = await fetch(`${API_GATEWAY_URL}/presign`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ key: s3Key, contentType: file.type })
    }).then(r=>r.json());

    await fetch(ps.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });

    return s3Key;
  */

  // For demo: simulate upload latency
  await new Promise(r => setTimeout(r, 800));
  return s3Key;
}

// ---------------- Poll / Check processing result ----------------
async function checkProcessingResult(s3Key) {
  // Replace with actual call to your backend which inspects RDS / Dynamo / a results table for the s3Key
  // Example:
  // const r = await fetch(`${API_GATEWAY_URL}/check-result`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ s3Key })
  // });
  // return await r.json();

  // Mock responses to demonstrate flow:
  const mockResponses = [
    { statusCode: 200, status: 'SUCCESS', meter_reading: '1234.5 kWh', s3_key: s3Key },
    { statusCode: 400, status: 'UNCLEAR', message: 'Image not clear, please retake' },
    { statusCode: 400, status: 'ANOMALY', message: 'Anomaly detected – please verify or override to continue' }
  ];
  // pick deterministic pseudo-random based on timestamp
  const idx = (s3Key.length + (new Date().getMilliseconds())) % mockResponses.length;
  await new Promise(r => setTimeout(r, 1000));
  return mockResponses[idx];
}

function handleProcessingResult(result, s3Key) {
  loadingState && loadingState.classList.add('hidden');
  submitBtn && (submitBtn.disabled = false);

  if (!result) {
    showToast('No result from backend', 'error');
    imagePreview && imagePreview.classList.remove('hidden');
    return;
  }

  if (result.status === 'SUCCESS') {
    showToast(`✓ Reading recorded: ${result.meter_reading}`, 'success');
    resetImageUpload();
  } else if (result.status === 'UNCLEAR') {
    showToast('Image not clear – retake photo.', 'error');
    imagePreview && imagePreview.classList.remove('hidden');
  } else if (result.status === 'ANOMALY') {
    showAnomalyModal(result.message || 'Anomaly detected – verify or override.');
  } else {
    showToast('Processing failed – try again.', 'error');
    imagePreview && imagePreview.classList.remove('hidden');
  }
}

// ---------------- Anomaly modal + override ----------------
function showAnomalyModal(message) {
  if (!anomalyModal) {
    showToast(message || 'Anomaly', 'warning');
    return;
  }
  const msgEl = el('anomalyMessage');
  if (msgEl) msgEl.textContent = message || '';
  anomalyModal.classList.remove('hidden');
}

function closeAnomalyModal() {
  anomalyModal && anomalyModal.classList.add('hidden');
}

function handleRetakeAfterAnomaly() {
  closeAnomalyModal();
  resetImageUpload();
}

async function handleOverride() {
  closeAnomalyModal();
  isAnomalyOverride = true;
  loadingState && loadingState.classList.remove('hidden');
  submitBtn && (submitBtn.disabled = true);

  try {
    // Re-upload with override flag (pattern depends on your backend)
    const s3Key = `${selectedCustomer.id}/${new Date().getTime()}-override-${(capturedImage && capturedImage.name) || 'image.jpg'}`;
    await uploadToS3(capturedImage, s3Key);

    // Notify backend to process override (placeholder)
    // await fetch(`${API_GATEWAY_URL}/process-override`, { method:'POST', body: JSON.stringify({ s3Key, customerId: selectedCustomer.id, override: true }) });

    // Simulate response
    await new Promise(r => setTimeout(r, 900));
    loadingState && loadingState.classList.add('hidden');
    submitBtn && (submitBtn.disabled = false);
    showToast('✓ Reading recorded with override', 'success');
    resetImageUpload();
  } catch (err) {
    console.error(err);
    loadingState && loadingState.classList.add('hidden');
    submitBtn && (submitBtn.disabled = false);
    showToast('Override failed, try again', 'error');
  }
}

// ---------------- Toast ----------------
function showToast(message, type = 'info') {
  if (!toast || !toastMessage) {
    alert(message);
    return;
  }
  toastMessage.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// ---------------- Local storage helpers ----------------
function saveCustomersToLocalStorage() {
  localStorage.setItem('meterCustomers', JSON.stringify(customersDatabase));
}

function loadCustomersFromLocalStorage() {
  const v = localStorage.getItem('meterCustomers');
  if (v) {
    try { customersDatabase = JSON.parse(v); } catch (e) { }
  }

}











