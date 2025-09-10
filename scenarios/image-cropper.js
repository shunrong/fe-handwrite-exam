/**
 * 场景题13: 图片裁剪组件实现
 * 
 * 业务场景：
 * - 用户头像上传和裁剪
 * - 商品图片编辑和优化
 * - 社交媒体图片处理
 * 
 * 考察点：
 * - Canvas API 和图像处理
 * - 鼠标/触摸事件处理
 * - 坐标变换和数学计算
 * - File API 和 Blob 操作
 * - 图片压缩和格式转换
 */

// 1. 图片裁剪器核心类
class ImageCropper {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      aspectRatio: null,          // 裁剪比例 (width/height)
      minWidth: 50,               // 最小裁剪宽度
      minHeight: 50,              // 最小裁剪高度
      maxWidth: Infinity,         // 最大裁剪宽度
      maxHeight: Infinity,        // 最大裁剪高度
      cropBoxResizable: true,     // 裁剪框可调整大小
      cropBoxMovable: true,       // 裁剪框可移动
      zoomable: true,             // 支持缩放
      rotatable: true,            // 支持旋转
      scalable: true,             // 支持翻转
      responsive: true,           // 响应式
      background: true,           // 显示网格背景
      guides: true,               // 显示辅助线
      center: true,               // 居中显示
      highlight: true,            // 高亮裁剪区域
      autoCrop: true,             // 自动裁剪
      quality: 0.9,               // 输出质量
      outputFormat: 'image/jpeg', // 输出格式
      ...options
    };
    
    this.state = {
      image: null,                // 原始图片
      canvas: null,               // 画布
      ctx: null,                  // 画布上下文
      imageData: {                // 图片数据
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        naturalWidth: 0,
        naturalHeight: 0,
        rotate: 0,
        scaleX: 1,
        scaleY: 1
      },
      cropBox: {                  // 裁剪框数据
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      container: {                // 容器数据
        width: 0,
        height: 0
      },
      isDragging: false,          // 是否拖拽中
      isResizing: false,          // 是否调整大小中
      dragStart: { x: 0, y: 0 },  // 拖拽起始点
      resizeHandle: null          // 调整大小手柄
    };
    
    this.callbacks = {
      onReady: options.onReady || (() => {}),
      onCrop: options.onCrop || (() => {}),
      onMove: options.onMove || (() => {}),
      onResize: options.onResize || (() => {}),
      onRotate: options.onRotate || (() => {}),
      onScale: options.onScale || (() => {})
    };
    
    this.elements = {};
    
    this.init();
  }
  
  init() {
    this.createElements();
    this.bindEvents();
  }
  
  // 创建DOM元素
  createElements() {
    this.container.innerHTML = `
      <div class="image-cropper">
        <div class="cropper-container">
          <div class="cropper-canvas-container">
            <canvas class="cropper-canvas"></canvas>
          </div>
          <div class="cropper-crop-box" style="display: none;">
            <div class="cropper-view-box">
              <canvas class="cropper-preview"></canvas>
            </div>
            <div class="cropper-dashed dashed-h"></div>
            <div class="cropper-dashed dashed-v"></div>
            <div class="cropper-center"></div>
            <div class="cropper-face"></div>
            <div class="cropper-line line-e" data-direction="e"></div>
            <div class="cropper-line line-n" data-direction="n"></div>
            <div class="cropper-line line-w" data-direction="w"></div>
            <div class="cropper-line line-s" data-direction="s"></div>
            <div class="cropper-point point-e" data-direction="e"></div>
            <div class="cropper-point point-n" data-direction="n"></div>
            <div class="cropper-point point-w" data-direction="w"></div>
            <div class="cropper-point point-s" data-direction="s"></div>
            <div class="cropper-point point-ne" data-direction="ne"></div>
            <div class="cropper-point point-nw" data-direction="nw"></div>
            <div class="cropper-point point-sw" data-direction="sw"></div>
            <div class="cropper-point point-se" data-direction="se"></div>
          </div>
        </div>
        
        <div class="cropper-toolbar">
          <div class="toolbar-group">
            <button class="toolbar-btn" id="move-btn" title="移动">✋</button>
            <button class="toolbar-btn" id="crop-btn" title="裁剪">✂️</button>
          </div>
          
          <div class="toolbar-group">
            <button class="toolbar-btn" id="zoom-in-btn" title="放大">🔍+</button>
            <button class="toolbar-btn" id="zoom-out-btn" title="缩小">🔍-</button>
            <button class="toolbar-btn" id="reset-btn" title="重置">🔄</button>
          </div>
          
          <div class="toolbar-group">
            <button class="toolbar-btn" id="rotate-left-btn" title="左转90°">↶</button>
            <button class="toolbar-btn" id="rotate-right-btn" title="右转90°">↷</button>
          </div>
          
          <div class="toolbar-group">
            <button class="toolbar-btn" id="flip-h-btn" title="水平翻转">↔️</button>
            <button class="toolbar-btn" id="flip-v-btn" title="垂直翻转">↕️</button>
          </div>
          
          <div class="toolbar-group">
            <select id="aspect-ratio-select" title="裁剪比例">
              <option value="">自由比例</option>
              <option value="1">1:1 (正方形)</option>
              <option value="1.33">4:3</option>
              <option value="1.78">16:9</option>
              <option value="0.75">3:4</option>
              <option value="0.56">9:16</option>
            </select>
          </div>
          
          <div class="toolbar-group">
            <button class="toolbar-btn primary" id="confirm-btn" title="确认裁剪">✓ 确认</button>
            <button class="toolbar-btn secondary" id="cancel-btn" title="取消">✗ 取消</button>
          </div>
        </div>
      </div>
    `;
    
    // 缓存DOM元素
    this.elements = {
      container: this.container.querySelector('.cropper-container'),
      canvas: this.container.querySelector('.cropper-canvas'),
      preview: this.container.querySelector('.cropper-preview'),
      cropBox: this.container.querySelector('.cropper-crop-box'),
      viewBox: this.container.querySelector('.cropper-view-box'),
      face: this.container.querySelector('.cropper-face'),
      toolbar: this.container.querySelector('.cropper-toolbar')
    };
    
    this.state.canvas = this.elements.canvas;
    this.state.ctx = this.elements.canvas.getContext('2d');
    this.previewCtx = this.elements.preview.getContext('2d');
    
    this.addStyles();
  }
  
  // 添加样式
  addStyles() {
    if (document.getElementById('image-cropper-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'image-cropper-styles';
    styles.textContent = `
      .image-cropper {
        font-family: Arial, sans-serif;
        background: #f8f9fa;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .cropper-container {
        position: relative;
        width: 100%;
        height: 400px;
        background: #000;
        overflow: hidden;
        user-select: none;
      }
      
      .cropper-canvas-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      .cropper-canvas {
        display: block;
        width: 100%;
        height: 100%;
        cursor: crosshair;
      }
      
      .cropper-crop-box {
        position: absolute;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #39f;
        cursor: move;
      }
      
      .cropper-view-box {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 50%;
      }
      
      .cropper-preview {
        display: block;
        width: 100%;
        height: 100%;
      }
      
      .cropper-dashed {
        position: absolute;
        border: 0 dashed #eee;
        opacity: 0.5;
        pointer-events: none;
      }
      
      .dashed-h {
        top: 33.33333%;
        left: 0;
        width: 100%;
        height: 33.33333%;
        border-top-width: 1px;
        border-bottom-width: 1px;
      }
      
      .dashed-v {
        top: 0;
        left: 33.33333%;
        width: 33.33333%;
        height: 100%;
        border-left-width: 1px;
        border-right-width: 1px;
      }
      
      .cropper-center {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        opacity: 0.75;
        pointer-events: none;
      }
      
      .cropper-face {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        cursor: move;
      }
      
      .cropper-line {
        position: absolute;
        background: #39f;
        opacity: 0.1;
      }
      
      .line-e {
        top: 0;
        right: -3px;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
      }
      
      .line-n {
        top: -3px;
        left: 0;
        width: 100%;
        height: 5px;
        cursor: ns-resize;
      }
      
      .line-w {
        top: 0;
        left: -3px;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
      }
      
      .line-s {
        bottom: -3px;
        left: 0;
        width: 100%;
        height: 5px;
        cursor: ns-resize;
      }
      
      .cropper-point {
        position: absolute;
        width: 5px;
        height: 5px;
        background: #39f;
        border-radius: 100%;
        opacity: 0.75;
      }
      
      .point-e {
        top: 50%;
        right: -3px;
        margin-top: -3px;
        cursor: ew-resize;
      }
      
      .point-n {
        top: -3px;
        left: 50%;
        margin-left: -3px;
        cursor: ns-resize;
      }
      
      .point-w {
        top: 50%;
        left: -3px;
        margin-top: -3px;
        cursor: ew-resize;
      }
      
      .point-s {
        bottom: -3px;
        left: 50%;
        margin-left: -3px;
        cursor: ns-resize;
      }
      
      .point-ne {
        top: -3px;
        right: -3px;
        cursor: nesw-resize;
      }
      
      .point-nw {
        top: -3px;
        left: -3px;
        cursor: nwse-resize;
      }
      
      .point-sw {
        bottom: -3px;
        left: -3px;
        cursor: nesw-resize;
      }
      
      .point-se {
        bottom: -3px;
        right: -3px;
        cursor: nwse-resize;
      }
      
      .cropper-toolbar {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #ddd;
        flex-wrap: wrap;
      }
      
      .toolbar-group {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      
      .toolbar-btn {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
        min-width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .toolbar-btn:hover {
        background: #f0f0f0;
        border-color: #007bff;
      }
      
      .toolbar-btn.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      
      .toolbar-btn.primary {
        background: #28a745;
        color: white;
        border-color: #28a745;
      }
      
      .toolbar-btn.secondary {
        background: #6c757d;
        color: white;
        border-color: #6c757d;
      }
      
      #aspect-ratio-select {
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        min-width: 120px;
      }
      
      /* 响应式 */
      @media (max-width: 768px) {
        .cropper-toolbar {
          flex-direction: column;
          gap: 8px;
        }
        
        .toolbar-group {
          width: 100%;
          justify-content: center;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  // 绑定事件
  bindEvents() {
    const { container, cropBox, face } = this.elements;
    
    // 鼠标事件
    container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // 触摸事件
    container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // 滚轮缩放
    container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
    // 工具栏按钮
    this.bindToolbarEvents();
    
    // 窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  // 绑定工具栏事件
  bindToolbarEvents() {
    document.getElementById('move-btn').addEventListener('click', () => {
      this.setDragMode('move');
    });
    
    document.getElementById('crop-btn').addEventListener('click', () => {
      this.setDragMode('crop');
    });
    
    document.getElementById('zoom-in-btn').addEventListener('click', () => {
      this.zoom(0.1);
    });
    
    document.getElementById('zoom-out-btn').addEventListener('click', () => {
      this.zoom(-0.1);
    });
    
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.reset();
    });
    
    document.getElementById('rotate-left-btn').addEventListener('click', () => {
      this.rotate(-90);
    });
    
    document.getElementById('rotate-right-btn').addEventListener('click', () => {
      this.rotate(90);
    });
    
    document.getElementById('flip-h-btn').addEventListener('click', () => {
      this.scaleX(-this.state.imageData.scaleX);
    });
    
    document.getElementById('flip-v-btn').addEventListener('click', () => {
      this.scaleY(-this.state.imageData.scaleY);
    });
    
    document.getElementById('aspect-ratio-select').addEventListener('change', (e) => {
      const ratio = e.target.value ? parseFloat(e.target.value) : null;
      this.setAspectRatio(ratio);
    });
    
    document.getElementById('confirm-btn').addEventListener('click', () => {
      this.getCroppedCanvas().then(canvas => {
        this.callbacks.onCrop(canvas);
      });
    });
    
    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.reset();
    });
  }
  
  // 处理鼠标按下
  handleMouseDown(e) {
    if (e.button !== 0) return; // 只处理左键
    
    e.preventDefault();
    
    const rect = this.elements.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.startDrag(x, y, e.target);
  }
  
  // 处理触摸开始
  handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.elements.container.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.startDrag(x, y, e.target);
    }
  }
  
  // 开始拖拽
  startDrag(x, y, target) {
    this.state.dragStart = { x, y };
    
    if (target.classList.contains('cropper-point') || target.classList.contains('cropper-line')) {
      this.state.isResizing = true;
      this.state.resizeHandle = target.dataset.direction;
    } else if (target.classList.contains('cropper-face')) {
      this.state.isDragging = true;
    } else {
      // 开始创建新的裁剪框
      this.createCropBox(x, y);
    }
  }
  
  // 处理鼠标移动
  handleMouseMove(e) {
    if (!this.state.isDragging && !this.state.isResizing) return;
    
    const rect = this.elements.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.drag(x, y);
  }
  
  // 处理触摸移动
  handleTouchMove(e) {
    if (!this.state.isDragging && !this.state.isResizing) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = this.elements.container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.drag(x, y);
  }
  
  // 拖拽处理
  drag(x, y) {
    const deltaX = x - this.state.dragStart.x;
    const deltaY = y - this.state.dragStart.y;
    
    if (this.state.isDragging) {
      this.moveCropBox(deltaX, deltaY);
    } else if (this.state.isResizing) {
      this.resizeCropBox(deltaX, deltaY);
    }
    
    this.state.dragStart = { x, y };
  }
  
  // 处理鼠标释放
  handleMouseUp() {
    this.endDrag();
  }
  
  // 处理触摸结束
  handleTouchEnd() {
    this.endDrag();
  }
  
  // 结束拖拽
  endDrag() {
    this.state.isDragging = false;
    this.state.isResizing = false;
    this.state.resizeHandle = null;
  }
  
  // 处理滚轮缩放
  handleWheel(e) {
    if (!this.options.zoomable) return;
    
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.zoom(delta);
  }
  
  // 处理窗口大小变化
  handleResize() {
    if (this.options.responsive) {
      this.resize();
    }
  }
  
  // 加载图片
  loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => {
        this.state.image = image;
        this.initializeCanvas();
        this.initializeCropBox();
        this.render();
        this.callbacks.onReady(this);
        resolve(this);
      };
      
      image.onerror = reject;
      
      if (typeof source === 'string') {
        image.src = source;
      } else if (source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          image.src = e.target.result;
        };
        reader.readAsDataURL(source);
      } else if (source instanceof HTMLImageElement) {
        if (source.complete) {
          this.state.image = source;
          this.initializeCanvas();
          this.initializeCropBox();
          this.render();
          this.callbacks.onReady(this);
          resolve(this);
        } else {
          image.src = source.src;
        }
      }
    });
  }
  
  // 初始化画布
  initializeCanvas() {
    const { image } = this.state;
    const container = this.elements.container;
    
    // 设置容器尺寸
    this.state.container.width = container.clientWidth;
    this.state.container.height = container.clientHeight;
    
    // 计算图片适配尺寸
    const scale = Math.min(
      this.state.container.width / image.naturalWidth,
      this.state.container.height / image.naturalHeight
    );
    
    this.state.imageData = {
      x: (this.state.container.width - image.naturalWidth * scale) / 2,
      y: (this.state.container.height - image.naturalHeight * scale) / 2,
      width: image.naturalWidth * scale,
      height: image.naturalHeight * scale,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      rotate: 0,
      scaleX: 1,
      scaleY: 1
    };
    
    // 设置画布尺寸
    this.state.canvas.width = this.state.container.width;
    this.state.canvas.height = this.state.container.height;
  }
  
  // 初始化裁剪框
  initializeCropBox() {
    if (!this.options.autoCrop) return;
    
    const { imageData } = this.state;
    const size = Math.min(imageData.width, imageData.height) * 0.8;
    
    this.state.cropBox = {
      x: imageData.x + (imageData.width - size) / 2,
      y: imageData.y + (imageData.height - size) / 2,
      width: size,
      height: size
    };
    
    this.updateCropBox();
    this.elements.cropBox.style.display = 'block';
  }
  
  // 创建裁剪框
  createCropBox(x, y) {
    this.state.cropBox = { x, y, width: 0, height: 0 };
    this.state.isDragging = true;
    this.elements.cropBox.style.display = 'block';
  }
  
  // 移动裁剪框
  moveCropBox(deltaX, deltaY) {
    const { cropBox, imageData } = this.state;
    
    let newX = cropBox.x + deltaX;
    let newY = cropBox.y + deltaY;
    
    // 边界限制
    newX = Math.max(imageData.x, Math.min(newX, imageData.x + imageData.width - cropBox.width));
    newY = Math.max(imageData.y, Math.min(newY, imageData.y + imageData.height - cropBox.height));
    
    this.state.cropBox.x = newX;
    this.state.cropBox.y = newY;
    
    this.updateCropBox();
    this.updatePreview();
    this.callbacks.onMove(this.getCropBoxData());
  }
  
  // 调整裁剪框大小
  resizeCropBox(deltaX, deltaY) {
    const { cropBox } = this.state;
    const { resizeHandle } = this.state;
    
    let newX = cropBox.x;
    let newY = cropBox.y;
    let newWidth = cropBox.width;
    let newHeight = cropBox.height;
    
    // 根据调整手柄方向调整尺寸
    switch (resizeHandle) {
      case 'e':
        newWidth += deltaX;
        break;
      case 'w':
        newX += deltaX;
        newWidth -= deltaX;
        break;
      case 's':
        newHeight += deltaY;
        break;
      case 'n':
        newY += deltaY;
        newHeight -= deltaY;
        break;
      case 'se':
        newWidth += deltaX;
        newHeight += deltaY;
        break;
      case 'sw':
        newX += deltaX;
        newWidth -= deltaX;
        newHeight += deltaY;
        break;
      case 'ne':
        newWidth += deltaX;
        newY += deltaY;
        newHeight -= deltaY;
        break;
      case 'nw':
        newX += deltaX;
        newWidth -= deltaX;
        newY += deltaY;
        newHeight -= deltaY;
        break;
    }
    
    // 应用宽高比约束
    if (this.options.aspectRatio) {
      if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
        newHeight = newWidth / this.options.aspectRatio;
      } else {
        newWidth = newHeight * this.options.aspectRatio;
      }
    }
    
    // 尺寸限制
    newWidth = Math.max(this.options.minWidth, Math.min(newWidth, this.options.maxWidth));
    newHeight = Math.max(this.options.minHeight, Math.min(newHeight, this.options.maxHeight));
    
    // 边界限制
    const { imageData } = this.state;
    newX = Math.max(imageData.x, Math.min(newX, imageData.x + imageData.width - newWidth));
    newY = Math.max(imageData.y, Math.min(newY, imageData.y + imageData.height - newHeight));
    
    this.state.cropBox = { x: newX, y: newY, width: newWidth, height: newHeight };
    
    this.updateCropBox();
    this.updatePreview();
    this.callbacks.onResize(this.getCropBoxData());
  }
  
  // 更新裁剪框显示
  updateCropBox() {
    const { cropBox } = this.state;
    const { cropBox: element } = this.elements;
    
    element.style.left = cropBox.x + 'px';
    element.style.top = cropBox.y + 'px';
    element.style.width = cropBox.width + 'px';
    element.style.height = cropBox.height + 'px';
  }
  
  // 更新预览
  updatePreview() {
    const { cropBox, imageData } = this.state;
    const preview = this.elements.preview;
    
    // 设置预览画布尺寸
    const previewSize = Math.min(cropBox.width, cropBox.height);
    preview.width = previewSize;
    preview.height = previewSize;
    
    // 计算裁剪区域在原图中的位置
    const scaleX = imageData.naturalWidth / imageData.width;
    const scaleY = imageData.naturalHeight / imageData.height;
    
    const sourceX = (cropBox.x - imageData.x) * scaleX;
    const sourceY = (cropBox.y - imageData.y) * scaleY;
    const sourceWidth = cropBox.width * scaleX;
    const sourceHeight = cropBox.height * scaleY;
    
    // 绘制预览
    this.previewCtx.clearRect(0, 0, previewSize, previewSize);
    this.previewCtx.drawImage(
      this.state.image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, previewSize, previewSize
    );
  }
  
  // 渲染画布
  render() {
    const { canvas, ctx, imageData, image } = this.state;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 保存上下文状态
    ctx.save();
    
    // 设置变换
    ctx.translate(imageData.x + imageData.width / 2, imageData.y + imageData.height / 2);
    ctx.rotate(imageData.rotate * Math.PI / 180);
    ctx.scale(imageData.scaleX, imageData.scaleY);
    
    // 绘制图片
    ctx.drawImage(
      image,
      -imageData.width / 2,
      -imageData.height / 2,
      imageData.width,
      imageData.height
    );
    
    // 恢复上下文状态
    ctx.restore();
    
    // 更新预览
    if (this.elements.cropBox.style.display !== 'none') {
      this.updatePreview();
    }
  }
  
  // 缩放
  zoom(ratio) {
    const { imageData } = this.state;
    
    const newWidth = imageData.width * (1 + ratio);
    const newHeight = imageData.height * (1 + ratio);
    
    // 限制缩放范围
    if (newWidth < 50 || newHeight < 50 || newWidth > 3000 || newHeight > 3000) {
      return;
    }
    
    const deltaX = (newWidth - imageData.width) / 2;
    const deltaY = (newHeight - imageData.height) / 2;
    
    imageData.x -= deltaX;
    imageData.y -= deltaY;
    imageData.width = newWidth;
    imageData.height = newHeight;
    
    this.render();
  }
  
  // 旋转
  rotate(degree) {
    this.state.imageData.rotate += degree;
    this.render();
    this.callbacks.onRotate(this.state.imageData.rotate);
  }
  
  // 水平翻转
  scaleX(scaleX) {
    this.state.imageData.scaleX = scaleX;
    this.render();
    this.callbacks.onScale(this.state.imageData.scaleX, this.state.imageData.scaleY);
  }
  
  // 垂直翻转
  scaleY(scaleY) {
    this.state.imageData.scaleY = scaleY;
    this.render();
    this.callbacks.onScale(this.state.imageData.scaleX, this.state.imageData.scaleY);
  }
  
  // 设置宽高比
  setAspectRatio(aspectRatio) {
    this.options.aspectRatio = aspectRatio;
    
    if (aspectRatio && this.state.cropBox.width > 0) {
      // 调整现有裁剪框
      const { cropBox } = this.state;
      cropBox.height = cropBox.width / aspectRatio;
      this.updateCropBox();
      this.updatePreview();
    }
  }
  
  // 设置拖拽模式
  setDragMode(mode) {
    // 这里可以实现不同的拖拽模式
    console.log('设置拖拽模式:', mode);
  }
  
  // 重置
  reset() {
    if (this.state.image) {
      this.initializeCanvas();
      this.initializeCropBox();
      this.render();
    }
  }
  
  // 调整大小
  resize() {
    if (this.state.image) {
      this.initializeCanvas();
      this.render();
    }
  }
  
  // 获取裁剪框数据
  getCropBoxData() {
    const { cropBox, imageData } = this.state;
    
    // 转换为相对于原图的坐标
    const scaleX = imageData.naturalWidth / imageData.width;
    const scaleY = imageData.naturalHeight / imageData.height;
    
    return {
      x: (cropBox.x - imageData.x) * scaleX,
      y: (cropBox.y - imageData.y) * scaleY,
      width: cropBox.width * scaleX,
      height: cropBox.height * scaleY
    };
  }
  
  // 获取裁剪后的画布
  getCroppedCanvas(options = {}) {
    return new Promise((resolve) => {
      const {
        width = this.state.cropBox.width,
        height = this.state.cropBox.height,
        fillColor = 'white'
      } = options;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = width;
      canvas.height = height;
      
      // 填充背景色
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, width, height);
      }
      
      const cropData = this.getCropBoxData();
      
      // 绘制裁剪后的图片
      ctx.drawImage(
        this.state.image,
        cropData.x, cropData.y, cropData.width, cropData.height,
        0, 0, width, height
      );
      
      resolve(canvas);
    });
  }
  
  // 获取裁剪后的Blob
  getCroppedBlob(options = {}) {
    return this.getCroppedCanvas(options).then(canvas => {
      return new Promise(resolve => {
        canvas.toBlob(resolve, this.options.outputFormat, this.options.quality);
      });
    });
  }
  
  // 销毁裁剪器
  destroy() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize);
    
    // 清空容器
    this.container.innerHTML = '';
  }
}

// 2. 演示应用
class ImageCropperDemo {
  constructor() {
    this.cropper = null;
    this.setupUI();
    this.bindEvents();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 1000px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>图片裁剪器演示</h1>
        
        <div style="margin-bottom: 20px;">
          <input type="file" id="image-input" accept="image/*" style="margin-right: 12px;">
          <button id="load-sample" class="demo-btn">加载示例图片</button>
          <button id="download-result" class="demo-btn" disabled>下载裁剪结果</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div>
            <div id="cropper-container" style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
              <div style="padding: 40px; text-align: center; color: #666;">
                请选择图片开始裁剪
              </div>
            </div>
          </div>
          
          <div>
            <h3>裁剪结果预览</h3>
            <div id="result-preview" style="
              width: 200px;
              height: 200px;
              border: 2px dashed #ddd;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
              margin-bottom: 20px;
            ">
              裁剪预览
            </div>
            
            <h3>裁剪信息</h3>
            <div id="crop-info" style="
              background: #f8f9fa;
              padding: 16px;
              border-radius: 8px;
              font-size: 14px;
              font-family: monospace;
            ">
              <div>X: 0</div>
              <div>Y: 0</div>
              <div>宽度: 0</div>
              <div>高度: 0</div>
              <div>旋转: 0°</div>
              <div>缩放: 1x</div>
            </div>
            
            <h3>快捷操作</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button class="quick-btn" data-ratio="">自由比例</button>
              <button class="quick-btn" data-ratio="1">1:1 正方形</button>
              <button class="quick-btn" data-ratio="1.33">4:3 横向</button>
              <button class="quick-btn" data-ratio="0.75">3:4 竖向</button>
              <button class="quick-btn" data-ratio="1.78">16:9 宽屏</button>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>功能特点</h3>
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            font-size: 14px;
          ">
            <div>✓ 支持鼠标和触摸操作</div>
            <div>✓ 自由调整裁剪框大小</div>
            <div>✓ 多种宽高比预设</div>
            <div>✓ 图片缩放和旋转</div>
            <div>✓ 水平/垂直翻转</div>
            <div>✓ 实时预览效果</div>
            <div>✓ 高质量输出</div>
            <div>✓ 移动端适配</div>
          </div>
        </div>
      </div>
      
      <style>
        .demo-btn, .quick-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .demo-btn:hover, .quick-btn:hover {
          background: #f0f0f0;
          border-color: #007bff;
        }
        
        .demo-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .quick-btn {
          text-align: left;
          width: 100%;
        }
        
        .quick-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
      </style>
    `;
  }
  
  bindEvents() {
    // 文件选择
    document.getElementById('image-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadImage(file);
      }
    });
    
    // 加载示例图片
    document.getElementById('load-sample').addEventListener('click', () => {
      this.loadSampleImage();
    });
    
    // 下载结果
    document.getElementById('download-result').addEventListener('click', () => {
      this.downloadResult();
    });
    
    // 快捷比例按钮
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ratio = e.target.dataset.ratio;
        this.setAspectRatio(ratio ? parseFloat(ratio) : null);
        
        // 更新按钮状态
        document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  }
  
  loadImage(source) {
    // 初始化裁剪器
    this.cropper = new ImageCropper('#cropper-container', {
      aspectRatio: null,
      autoCrop: true,
      responsive: true,
      onReady: () => {
        console.log('裁剪器已准备就绪');
        document.getElementById('download-result').disabled = false;
        this.updateCropInfo();
      },
      onCrop: (canvas) => {
        this.updateResultPreview(canvas);
      },
      onMove: (data) => {
        this.updateCropInfo(data);
      },
      onResize: (data) => {
        this.updateCropInfo(data);
      },
      onRotate: (degree) => {
        this.updateCropInfo();
      },
      onScale: (scaleX, scaleY) => {
        this.updateCropInfo();
      }
    });
    
    this.cropper.loadImage(source);
  }
  
  loadSampleImage() {
    // 创建示例图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 600;
    
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#4ecdc4');
    gradient.addColorStop(1, '#45b7d1');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制一些图形
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(100, 100, 200, 150);
    ctx.fillRect(500, 200, 150, 200);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('示例图片', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '24px Arial';
    ctx.fillText('请尝试裁剪功能', canvas.width / 2, canvas.height / 2 + 60);
    
    // 转换为图片并加载
    canvas.toBlob((blob) => {
      this.loadImage(blob);
    });
  }
  
  setAspectRatio(ratio) {
    if (this.cropper) {
      this.cropper.setAspectRatio(ratio);
    }
  }
  
  updateResultPreview(canvas) {
    const preview = document.getElementById('result-preview');
    
    // 清空预览区域
    preview.innerHTML = '';
    
    // 创建预览图片
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;
    
    preview.appendChild(img);
  }
  
  updateCropInfo(data) {
    if (!this.cropper) return;
    
    const cropData = data || this.cropper.getCropBoxData();
    const imageData = this.cropper.state.imageData;
    
    document.getElementById('crop-info').innerHTML = `
      <div>X: ${Math.round(cropData.x)}</div>
      <div>Y: ${Math.round(cropData.y)}</div>
      <div>宽度: ${Math.round(cropData.width)}</div>
      <div>高度: ${Math.round(cropData.height)}</div>
      <div>旋转: ${imageData.rotate}°</div>
      <div>缩放: ${imageData.scaleX.toFixed(2)}x</div>
    `;
  }
  
  async downloadResult() {
    if (!this.cropper) return;
    
    try {
      const canvas = await this.cropper.getCroppedCanvas({
        width: 400,
        height: 400
      });
      
      // 创建下载链接
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cropped-image-${Date.now()}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  }
}

// 运行演示
console.log('=== 图片裁剪组件测试 ===\n');

const demo = new ImageCropperDemo();

console.log('图片裁剪组件功能特点：');
console.log('✓ 自由调整裁剪框大小和位置');
console.log('✓ 多种宽高比预设');
console.log('✓ 图片缩放、旋转、翻转');
console.log('✓ 实时预览和高质量输出');
console.log('✓ 鼠标和触摸事件支持');
console.log('✓ 响应式设计');
console.log('✓ Canvas 高性能渲染');
console.log('✓ 可自定义的工具栏');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ImageCropper
  };
}
