/**
 * 场景题1: 图片懒加载组件实现
 * 
 * 业务场景：
 * - 电商网站商品列表页面有大量商品图片
 * - 需要实现图片懒加载以提升页面性能
 * - 支持占位图、加载失败重试、进度指示等功能
 * 
 * 考察点：
 * - Intersection Observer API 的使用
 * - 性能优化思维
 * - 错误处理和用户体验
 * - 组件化设计思想
 */

// 1. 基础图片懒加载实现
class ImageLazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',           // 提前50px开始加载
      threshold: 0.01,              // 1%可见时触发
      placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
      errorImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZhaWxlZDwvdGV4dD48L3N2Zz4=',
      retryCount: 3,                // 失败重试次数
      retryDelay: 1000,            // 重试延迟(ms)
      fadeInDuration: 300,         // 淡入动画时长
      ...options
    };
    
    this.observer = null;
    this.imageCache = new Map();     // 图片缓存
    this.loadingImages = new Set();  // 正在加载的图片
    this.init();
  }
  
  init() {
    // 检查浏览器支持
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to immediate loading');
      this.fallbackLoad();
      return;
    }
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );
    
    this.observeImages();
  }
  
  // 处理图片进入视口
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }
  
  // 观察所有懒加载图片
  observeImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      // 设置占位图
      if (!img.src && this.options.placeholder) {
        img.src = this.options.placeholder;
      }
      
      // 添加加载类名
      img.classList.add('lazy-loading');
      
      this.observer.observe(img);
    });
  }
  
  // 加载单张图片
  async loadImage(img) {
    const src = img.dataset.src;
    if (!src || this.loadingImages.has(src)) return;
    
    this.loadingImages.add(src);
    
    try {
      // 检查缓存
      if (this.imageCache.has(src)) {
        this.setImageSrc(img, src);
        return;
      }
      
      // 预加载图片
      const loadedImage = await this.preloadImage(src);
      
      // 缓存图片
      this.imageCache.set(src, loadedImage);
      
      // 设置图片源并添加动画
      this.setImageSrc(img, src);
      
    } catch (error) {
      console.error('Image load failed:', error);
      this.handleImageError(img, src);
    } finally {
      this.loadingImages.delete(src);
    }
  }
  
  // 预加载图片
  preloadImage(src, retryCount = this.options.retryCount) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      const onLoad = () => {
        cleanup();
        resolve(img);
      };
      
      const onError = () => {
        cleanup();
        if (retryCount > 0) {
          console.log(`Image load failed, retrying... (${retryCount} attempts left)`);
          setTimeout(() => {
            this.preloadImage(src, retryCount - 1)
              .then(resolve)
              .catch(reject);
          }, this.options.retryDelay);
        } else {
          reject(new Error(`Failed to load image: ${src}`));
        }
      };
      
      const cleanup = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      };
      
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      img.src = src;
    });
  }
  
  // 设置图片源并添加动画效果
  setImageSrc(img, src) {
    // 淡入动画
    img.style.opacity = '0';
    img.style.transition = `opacity ${this.options.fadeInDuration}ms ease-in-out`;
    
    img.onload = () => {
      img.style.opacity = '1';
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // 触发自定义事件
      img.dispatchEvent(new CustomEvent('lazyload:loaded', {
        detail: { src, img }
      }));
    };
    
    img.src = src;
  }
  
  // 处理图片加载失败
  handleImageError(img, src) {
    if (this.options.errorImage) {
      img.src = this.options.errorImage;
    }
    
    img.classList.remove('lazy-loading');
    img.classList.add('lazy-error');
    
    // 触发错误事件
    img.dispatchEvent(new CustomEvent('lazyload:error', {
      detail: { src, img }
    }));
  }
  
  // 降级处理（不支持 IntersectionObserver）
  fallbackLoad() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      this.loadImage(img);
    });
  }
  
  // 添加新图片到观察列表
  observe(img) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      this.loadImage(img);
    }
  }
  
  // 停止观察
  unobserve(img) {
    if (this.observer) {
      this.observer.unobserve(img);
    }
  }
  
  // 销毁实例
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.imageCache.clear();
    this.loadingImages.clear();
  }
  
  // 获取加载统计
  getStats() {
    return {
      cached: this.imageCache.size,
      loading: this.loadingImages.size,
      total: document.querySelectorAll('img[data-src]').length
    };
  }
}

// 2. 增强版懒加载 - 支持响应式图片
class ResponsiveImageLazyLoader extends ImageLazyLoader {
  constructor(options = {}) {
    super(options);
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.viewportWidth = window.innerWidth;
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  handleResize() {
    this.viewportWidth = window.innerWidth;
    // 重新评估已加载的响应式图片
    this.updateResponsiveImages();
  }
  
  // 获取最适合的图片源
  getBestImageSrc(img) {
    const srcset = img.dataset.srcset;
    const sizes = img.dataset.sizes;
    
    if (!srcset) {
      return img.dataset.src;
    }
    
    // 解析 srcset
    const sources = this.parseSrcset(srcset);
    const targetWidth = this.calculateTargetWidth(img, sizes);
    
    // 选择最合适的图片
    return this.selectBestSource(sources, targetWidth);
  }
  
  parseSrcset(srcset) {
    return srcset.split(',').map(src => {
      const [url, descriptor] = src.trim().split(' ');
      const width = descriptor ? parseInt(descriptor.replace('w', '')) : 1;
      return { url, width };
    });
  }
  
  calculateTargetWidth(img, sizes) {
    if (sizes) {
      // 简化的 sizes 解析
      const sizeValue = sizes.split(',')[0].trim();
      if (sizeValue.includes('vw')) {
        const percentage = parseInt(sizeValue.replace('vw', '')) / 100;
        return this.viewportWidth * percentage * this.devicePixelRatio;
      }
    }
    
    // 回退到图片的显示宽度
    const rect = img.getBoundingClientRect();
    return rect.width * this.devicePixelRatio;
  }
  
  selectBestSource(sources, targetWidth) {
    // 选择大于等于目标宽度的最小图片
    const suitable = sources.filter(source => source.width >= targetWidth);
    
    if (suitable.length > 0) {
      return suitable.reduce((prev, curr) => 
        curr.width < prev.width ? curr : prev
      ).url;
    }
    
    // 如果没有合适的，选择最大的
    return sources.reduce((prev, curr) => 
      curr.width > prev.width ? curr : prev
    ).url;
  }
  
  loadImage(img) {
    // 获取最适合的图片源
    const bestSrc = this.getBestImageSrc(img);
    img.dataset.src = bestSrc;
    
    return super.loadImage(img);
  }
  
  updateResponsiveImages() {
    const loadedImages = document.querySelectorAll('img.lazy-loaded[data-srcset]');
    loadedImages.forEach(img => {
      const currentSrc = img.src;
      const bestSrc = this.getBestImageSrc(img);
      
      if (currentSrc !== bestSrc) {
        img.dataset.src = bestSrc;
        img.classList.remove('lazy-loaded');
        img.classList.add('lazy-loading');
        this.loadImage(img);
      }
    });
  }
}

// 3. 图片懒加载 React Hook (如果是React项目)
function useImageLazyLoad(options = {}) {
  const [loader, setLoader] = useState(null);
  const [stats, setStats] = useState({ cached: 0, loading: 0, total: 0 });
  
  useEffect(() => {
    const lazyLoader = new ResponsiveImageLazyLoader(options);
    setLoader(lazyLoader);
    
    // 定期更新统计
    const updateStats = () => {
      setStats(lazyLoader.getStats());
    };
    
    const intervalId = setInterval(updateStats, 1000);
    updateStats();
    
    return () => {
      clearInterval(intervalId);
      lazyLoader.destroy();
    };
  }, []);
  
  return { loader, stats };
}

// 4. 实际使用示例和测试
class ImageLazyLoadDemo {
  constructor() {
    this.loader = new ResponsiveImageLazyLoader({
      rootMargin: '100px',
      retryCount: 2,
      fadeInDuration: 500
    });
    
    this.setupEventListeners();
    this.createTestImages();
  }
  
  setupEventListeners() {
    // 监听加载成功事件
    document.addEventListener('lazyload:loaded', (e) => {
      console.log('Image loaded:', e.detail.src);
      this.updateProgressBar();
    });
    
    // 监听加载失败事件
    document.addEventListener('lazyload:error', (e) => {
      console.error('Image failed to load:', e.detail.src);
    });
  }
  
  createTestImages() {
    const container = document.getElementById('image-container') || this.createContainer();
    
    // 模拟商品图片列表
    const imageData = [
      {
        src: 'https://picsum.photos/400/300?random=1',
        srcset: 'https://picsum.photos/200/150?random=1 200w, https://picsum.photos/400/300?random=1 400w, https://picsum.photos/800/600?random=1 800w',
        sizes: '(max-width: 768px) 100vw, 50vw',
        alt: 'Product 1'
      },
      {
        src: 'https://picsum.photos/400/300?random=2',
        srcset: 'https://picsum.photos/200/150?random=2 200w, https://picsum.photos/400/300?random=2 400w, https://picsum.photos/800/600?random=2 800w',
        sizes: '(max-width: 768px) 100vw, 50vw',
        alt: 'Product 2'
      },
      // 模拟失败的图片
      {
        src: 'https://invalid-url/image.jpg',
        alt: 'Failed Image'
      }
    ];
    
    imageData.forEach((data, index) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'image-wrapper';
      imgWrapper.style.cssText = `
        margin: 20px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        display: inline-block;
        width: 300px;
      `;
      
      const img = document.createElement('img');
      img.dataset.src = data.src;
      if (data.srcset) img.dataset.srcset = data.srcset;
      if (data.sizes) img.dataset.sizes = data.sizes;
      img.alt = data.alt;
      img.style.cssText = `
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 4px;
      `;
      
      const label = document.createElement('p');
      label.textContent = `Image ${index + 1}: ${data.alt}`;
      label.style.cssText = 'margin: 10px 0 0 0; text-align: center;';
      
      imgWrapper.appendChild(img);
      imgWrapper.appendChild(label);
      container.appendChild(imgWrapper);
    });
  }
  
  createContainer() {
    const container = document.createElement('div');
    container.id = 'image-container';
    container.style.cssText = `
      padding: 20px;
      text-align: center;
    `;
    
    // 创建标题
    const title = document.createElement('h2');
    title.textContent = '图片懒加载演示';
    title.style.cssText = 'margin-bottom: 20px;';
    
    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.style.cssText = `
      width: 100%;
      height: 20px;
      background: #f0f0f0;
      border-radius: 10px;
      margin: 20px 0;
      overflow: hidden;
    `;
    
    const progress = document.createElement('div');
    progress.id = 'progress';
    progress.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #45a049);
      transition: width 0.3s ease;
    `;
    
    progressBar.appendChild(progress);
    
    // 创建统计信息
    const stats = document.createElement('div');
    stats.id = 'stats';
    stats.style.cssText = `
      margin: 20px 0;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    `;
    
    document.body.appendChild(title);
    document.body.appendChild(progressBar);
    document.body.appendChild(stats);
    document.body.appendChild(container);
    
    return container;
  }
  
  updateProgressBar() {
    const stats = this.loader.getStats();
    const progress = document.getElementById('progress');
    const statsDiv = document.getElementById('stats');
    
    if (progress && statsDiv) {
      const percentage = stats.total > 0 ? ((stats.cached / stats.total) * 100) : 0;
      progress.style.width = `${percentage}%`;
      
      statsDiv.innerHTML = `
        <strong>加载统计:</strong><br>
        已缓存: ${stats.cached} | 加载中: ${stats.loading} | 总计: ${stats.total}<br>
        进度: ${percentage.toFixed(1)}%
      `;
    }
  }
}

// CSS 样式
const lazyLoadStyles = `
<style>
.lazy-loading {
  filter: blur(2px);
  transition: filter 0.3s ease;
}

.lazy-loaded {
  filter: none;
}

.lazy-error {
  border: 2px solid #ff4444;
  filter: grayscale(100%);
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.lazy-loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 1.5s infinite;
}
</style>
`;

// 使用示例
console.log('=== 图片懒加载组件测试 ===\n');

// 添加样式
document.head.insertAdjacentHTML('beforeend', lazyLoadStyles);

// 创建演示
const demo = new ImageLazyLoadDemo();

console.log('图片懒加载功能特点：');
console.log('✓ 基于 Intersection Observer API');
console.log('✓ 支持响应式图片 (srcset/sizes)');
console.log('✓ 失败重试机制');
console.log('✓ 图片缓存');
console.log('✓ 淡入动画效果');
console.log('✓ 加载进度指示');
console.log('✓ 错误处理和降级方案');
console.log('✓ 性能监控和统计');

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ImageLazyLoader,
    ResponsiveImageLazyLoader,
    useImageLazyLoad
  };
}
