const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let currentFilter = 'none';
let facingMode = 'user';
let drawing = false;

async function startCamera() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (!drawing) {
        drawing = true;
        draw();
      }
    };
  } catch (err) {
    alert('Caméra inaccessible : ' + err.message);
  }
}

function applyFilter(data, filter) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];

    if (filter === 'gray') {
      const v = 0.3 * r + 0.59 * g + 0.11 * b;
      data[i] = data[i + 1] = data[i + 2] = v;
    } else if (filter === 'sepia') {
      data[i]     = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
      data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
      data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    } else if (filter === 'invert') {
      data[i] = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    } else if (filter === 'red') {
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }
}

function draw() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  if (currentFilter !== 'none') {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyFilter(frame.data, currentFilter);
    ctx.putImageData(frame, 0, 0);
  }
  requestAnimationFrame(draw);
}

document.querySelectorAll('#filters button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.getElementById('capture').addEventListener('click', () => {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'funpictures-' + Date.now() + '.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

document.getElementById('switch').addEventListener('click', () => {
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  startCamera();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

startCamera();
