const API_BASE = 'http://127.0.0.1:8000/api';

const canvas = document.getElementById('knnCanvas');
const ctx = canvas.getContext('2d');
const clusterSelect = document.getElementById('clusterSelect');
const kInput = document.getElementById('kValue');
const addTestBtn = document.getElementById('addTestBtn');
const predictBtn = document.getElementById('predictBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMsg = document.getElementById('statusMsg');

let mode = 'train'; // 'train' or 'test'
let testPoints = [];
let predictedPoints = [];

const COLOR_MAP = {
  'A': '#ef4444', // Red
  'B': '#2563eb', // Blue
  'C': '#10b981'  // Green
};

// Canvas Click Event
canvas.addEventListener('click', async (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (mode === 'train') {
    const cluster = clusterSelect.value;
    await addTrainingPoint(x, y, cluster);
  } else {
    testPoints.push({ x, y });
    draw();
  }
});

// Mode Toggle Button
addTestBtn.addEventListener('click', () => {
  if (mode === 'train') {
    mode = 'test';
    addTestBtn.textContent = 'Mode: Add Training Points';
    addTestBtn.classList.add('active');
  } else {
    mode = 'train';
    addTestBtn.textContent = 'Mode: Add Test Points';
    addTestBtn.classList.remove('active');
  }
});

// Add Training Point via API
async function addTrainingPoint(x, y, cluster) {
  try {
    const res = await fetch(`${API_BASE}/dots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ x, y, cluster }])
    });
    if (res.ok) {
      statusMsg.textContent = 'Training point added';
      statusMsg.style.color = 'green';
      draw();
    }
  } catch (err) {
    statusMsg.textContent = 'Failed to connect to API';
    statusMsg.style.color = 'red';
  }
}

// Fetch and Draw All Data
async function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fetch training points
  try {
    const res = await fetch(`${API_BASE}/dots`);
    const trainData = await res.json();

    // Draw training points (Solid Circles)
    trainData.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_MAP[p.cluster] || '#000';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();
    });
  } catch (err) {
    console.error('Error loading points', err);
  }

  // Draw unpredicted test points (Hollow Circles)
  testPoints.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;
  });

  // Draw predicted test points (Filled with black border and ring)
  predictedPoints.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_MAP[p.predicted_cluster] || '#888';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.lineWidth = 1;
  });
}

// Predict Event
predictBtn.addEventListener('click', async () => {
  if (testPoints.length === 0) {
    statusMsg.textContent = 'Add test points first!';
    statusMsg.style.color = 'orange';
    return;
  }

  const k = kInput.value;

  try {
    const res = await fetch(`${API_BASE}/predict-knn?k=${k}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPoints)
    });

    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Prediction failed';
      statusMsg.style.color = 'red';
      return;
    }

    predictedPoints = data;
    testPoints = []; // Move resolved test points to predicted
    statusMsg.textContent = 'Prediction complete!';
    statusMsg.style.color = 'green';
    draw();
  } catch (err) {
    statusMsg.textContent = 'Error connecting to backend';
    statusMsg.style.color = 'red';
  }
});

// Clear Data Event
clearBtn.addEventListener('click', async () => {
  await fetch(`${API_BASE}/dots`, { method: 'DELETE' });
  testPoints = [];
  predictedPoints = [];
  statusMsg.textContent = 'Cleared all data';
  statusMsg.style.color = 'black';
  draw();
});

// Initial Render
draw();