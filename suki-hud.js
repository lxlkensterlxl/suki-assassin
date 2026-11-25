const HUD_MODES = ['IDLE', 'ACTIVE', 'STEALTH', 'COMBAT'];

class SukiHudController {
  constructor(elements = {}) {
    this.el = elements;
    this.modeIndex = 0;
    this.frames = 0;
    this.lastFpsTime = performance.now();
    this.currentFps = 60;
    this.assetReady = false;
    this.rafId = null;
  }

  async init({ loadAsset, avatarTarget } = {}) {
    this.setMode(this.modeIndex);
    this.setStatus('READY');
    this.checkGpu();
    this.bindAvatarTap(avatarTarget);
    this.startLoop();

    if (typeof loadAsset === 'function') {
      this.setAssetState('LOADING');
      try {
        await loadAsset();
        this.assetReady = true;
        this.setAssetState('ONLINE');
      } catch (err) {
        console.error('HUD asset load failed:', err);
        this.setAssetState('FALLBACK');
      }
    }
  }

  setStatus(text) {
    if (this.el.status) this.el.status.textContent = text;
  }

  setAssetState(state) {
    if (this.el.asset) this.el.asset.textContent = state;
  }

  setMode(index) {
    this.modeIndex = ((index % HUD_MODES.length) + HUD_MODES.length) % HUD_MODES.length;
    const mode = HUD_MODES[this.modeIndex];
    if (this.el.mode) this.el.mode.textContent = mode;
    document.body.dataset.sukiMode = mode.toLowerCase();
  }

  cycleMode() {
    this.setMode(this.modeIndex + 1);
  }

  bindAvatarTap(target) {
    const node = target || this.el.avatar || this.el.stage;
    if (!node) return;
    node.addEventListener('pointerup', () => this.cycleMode(), { passive: true });
  }

  async checkGpu() {
    if (!this.el.gpu) return;
    try {
      if (navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        this.el.gpu.textContent = adapter ? 'WEBGPU READY' : 'UNAVAILABLE';
      } else {
        const glCanvas = document.createElement('canvas');
        const gl = glCanvas.getContext('webgl2') || glCanvas.getContext('webgl');
        this.el.gpu.textContent = gl ? 'WEBGL (NO WEBGPU)' : 'CPU / NONE';
      }
    } catch {
      this.el.gpu.textContent = 'FALLBACK';
    }
  }

  updateNeuralSync() {
    if (!this.el.neuralSync) return;
    // Example: tie sync percentage to asset + engine readiness instead of a static 100%
    const sync = this.assetReady ? 100 : 45;
    this.el.neuralSync.textContent = `${sync}%`;
  }

  startLoop() {
    const tick = (now) => {
      this.frames += 1;
      const elapsed = now - this.lastFpsTime;
      if (elapsed >= 500) {
        this.currentFps = Math.round((this.frames * 1000) / elapsed);
        if (this.el.fps) this.el.fps.textContent = String(this.currentFps);
        this.updateNeuralSync();
        this.frames = 0;
        this.lastFpsTime = now;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
