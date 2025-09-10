/**
 * 场景题14: 数据可视化图表实现
 * 
 * 业务场景：
 * - 数据报表和仪表盘
 * - 销售分析和统计图表
 * - 实时监控数据展示
 * 
 * 考察点：
 * - SVG 和 Canvas 绘图技术
 * - 数据处理和数学计算
 * - 动画和交互效果
 * - 坐标系统和比例缩放
 * - 响应式图表设计
 */

// 1. 基础图表类
class BaseChart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 40 },
      background: '#ffffff',
      title: '',
      theme: 'default',
      animation: true,
      animationDuration: 1000,
      responsive: true,
      legend: true,
      tooltip: true,
      ...options
    };
    
    this.state = {
      data: [],
      scales: {},
      elements: {},
      isAnimating: false
    };
    
    this.callbacks = {
      onHover: options.onHover || (() => {}),
      onClick: options.onClick || (() => {}),
      onAnimationEnd: options.onAnimationEnd || (() => {})
    };
    
    this.colors = this.getColorPalette();
    this.init();
  }
  
  init() {
    this.createContainer();
    this.createSVG();
    this.bindEvents();
  }
  
  // 创建容器
  createContainer() {
    this.container.innerHTML = `
      <div class="chart-container">
        <div class="chart-header">
          <h3 class="chart-title">${this.options.title}</h3>
          <div class="chart-controls"></div>
        </div>
        <div class="chart-content">
          <svg class="chart-svg"></svg>
          <canvas class="chart-canvas" style="display: none;"></canvas>
        </div>
        <div class="chart-legend" style="display: ${this.options.legend ? 'block' : 'none'};"></div>
        <div class="chart-tooltip" style="display: none;"></div>
      </div>
    `;
    
    this.elements = {
      container: this.container.querySelector('.chart-container'),
      header: this.container.querySelector('.chart-header'),
      title: this.container.querySelector('.chart-title'),
      controls: this.container.querySelector('.chart-controls'),
      content: this.container.querySelector('.chart-content'),
      svg: this.container.querySelector('.chart-svg'),
      canvas: this.container.querySelector('.chart-canvas'),
      legend: this.container.querySelector('.chart-legend'),
      tooltip: this.container.querySelector('.chart-tooltip')
    };
    
    this.addStyles();
  }
  
  // 创建SVG
  createSVG() {
    const { svg } = this.elements;
    const { width, height } = this.options;
    
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // 创建基础分组
    this.svgGroups = {
      background: this.createSVGGroup(svg, 'background'),
      grid: this.createSVGGroup(svg, 'grid'),
      axes: this.createSVGGroup(svg, 'axes'),
      data: this.createSVGGroup(svg, 'data'),
      overlay: this.createSVGGroup(svg, 'overlay')
    };
  }
  
  // 创建SVG分组
  createSVGGroup(parent, className) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', className);
    parent.appendChild(g);
    return g;
  }
  
  // 绑定事件
  bindEvents() {
    if (this.options.responsive) {
      window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    // 鼠标事件
    this.elements.svg.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.elements.svg.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.elements.svg.addEventListener('click', this.handleClick.bind(this));
  }
  
  // 处理鼠标移动
  handleMouseMove(e) {
    if (this.options.tooltip) {
      this.showTooltip(e);
    }
    this.callbacks.onHover(e, this.getDataAtPoint(e));
  }
  
  // 处理鼠标离开
  handleMouseLeave() {
    this.hideTooltip();
  }
  
  // 处理点击
  handleClick(e) {
    const data = this.getDataAtPoint(e);
    this.callbacks.onClick(e, data);
  }
  
  // 处理窗口大小变化
  handleResize() {
    // 子类实现
  }
  
  // 获取鼠标位置的数据
  getDataAtPoint(e) {
    // 子类实现
    return null;
  }
  
  // 显示提示框
  showTooltip(e) {
    const data = this.getDataAtPoint(e);
    if (!data) return;
    
    const tooltip = this.elements.tooltip;
    const rect = this.container.getBoundingClientRect();
    
    tooltip.innerHTML = this.formatTooltip(data);
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
    tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
  }
  
  // 隐藏提示框
  hideTooltip() {
    this.elements.tooltip.style.display = 'none';
  }
  
  // 格式化提示框内容
  formatTooltip(data) {
    return `<div><strong>${data.label}</strong><br>值: ${data.value}</div>`;
  }
  
  // 设置数据
  setData(data) {
    this.state.data = data;
    this.render();
  }
  
  // 渲染图表
  render() {
    this.renderBackground();
    this.renderGrid();
    this.renderAxes();
    this.renderData();
    this.renderLegend();
  }
  
  // 渲染背景
  renderBackground() {
    const { background } = this.svgGroups;
    const { width, height } = this.options;
    
    background.innerHTML = `
      <rect width="${width}" height="${height}" fill="${this.options.background}" />
    `;
  }
  
  // 渲染网格
  renderGrid() {
    // 子类实现
  }
  
  // 渲染坐标轴
  renderAxes() {
    // 子类实现
  }
  
  // 渲染数据
  renderData() {
    // 子类实现
  }
  
  // 渲染图例
  renderLegend() {
    if (!this.options.legend || !this.state.data.length) return;
    
    const legend = this.elements.legend;
    const legendItems = this.getLegendItems();
    
    legend.innerHTML = legendItems.map((item, index) => `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${this.colors[index % this.colors.length]};"></div>
        <span class="legend-label">${item}</span>
      </div>
    `).join('');
  }
  
  // 获取图例项目
  getLegendItems() {
    // 子类实现
    return [];
  }
  
  // 获取颜色调色板
  getColorPalette() {
    const palettes = {
      default: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'],
      pastel: ['#a8e6cf', '#dcedc1', '#fed1b8', '#ffc3a0', '#f8b3d3', '#d4a5a5', '#a8b5d1'],
      vibrant: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']
    };
    
    return palettes[this.options.theme] || palettes.default;
  }
  
  // 添加样式
  addStyles() {
    if (document.getElementById('chart-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'chart-styles';
    styles.textContent = `
      .chart-container {
        font-family: Arial, sans-serif;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      
      .chart-header {
        padding: 16px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      
      .chart-controls {
        display: flex;
        gap: 8px;
      }
      
      .chart-content {
        position: relative;
        padding: 16px;
      }
      
      .chart-svg {
        display: block;
        width: 100%;
        height: auto;
      }
      
      .chart-legend {
        padding: 16px 20px;
        background: #f8f9fa;
        border-top: 1px solid #ddd;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      
      .chart-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .axis-label {
        font-size: 12px;
        fill: #666;
      }
      
      .grid-line {
        stroke: #eee;
        stroke-width: 1;
      }
      
      .axis-line {
        stroke: #333;
        stroke-width: 1;
      }
      
      .data-element {
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .data-element:hover {
        opacity: 0.8;
        filter: brightness(1.1);
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  // 动画辅助函数
  animate(from, to, duration, callback) {
    if (!this.options.animation) {
      callback(to);
      return;
    }
    
    this.state.isAnimating = true;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);
      
      const value = from + (to - from) * eased;
      callback(value);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.state.isAnimating = false;
        this.callbacks.onAnimationEnd();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  // 缓动函数
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
  
  // 销毁图表
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.container.innerHTML = '';
  }
}

// 2. 柱状图
class BarChart extends BaseChart {
  constructor(container, options = {}) {
    super(container, {
      barPadding: 0.1,
      groupPadding: 0.2,
      orientation: 'vertical', // 'vertical' | 'horizontal'
      ...options
    });
  }
  
  renderGrid() {
    const { grid } = this.svgGroups;
    const { margin, width, height } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // 水平网格线
    const yScale = this.getYScale();
    const yTicks = yScale.ticks || [];
    
    const gridLines = yTicks.map(tick => {
      const y = margin.top + chartHeight - (tick / yScale.max) * chartHeight;
      return `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" class="grid-line" />`;
    }).join('');
    
    grid.innerHTML = gridLines;
  }
  
  renderAxes() {
    const { axes } = this.svgGroups;
    const { margin, width, height } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // X轴
    const xAxisY = height - margin.bottom;
    let xAxis = `<line x1="${margin.left}" x2="${width - margin.right}" y1="${xAxisY}" y2="${xAxisY}" class="axis-line" />`;
    
    // X轴标签
    this.state.data.forEach((item, index) => {
      const x = margin.left + (index + 0.5) * (chartWidth / this.state.data.length);
      xAxis += `<text x="${x}" y="${xAxisY + 20}" text-anchor="middle" class="axis-label">${item.label}</text>`;
    });
    
    // Y轴
    const yScale = this.getYScale();
    let yAxis = `<line x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}" class="axis-line" />`;
    
    // Y轴标签
    const yTicks = yScale.ticks || [];
    yTicks.forEach(tick => {
      const y = margin.top + chartHeight - (tick / yScale.max) * chartHeight;
      yAxis += `<text x="${margin.left - 10}" y="${y + 5}" text-anchor="end" class="axis-label">${tick}</text>`;
    });
    
    axes.innerHTML = xAxis + yAxis;
  }
  
  renderData() {
    const { data: dataGroup } = this.svgGroups;
    const { margin, width, height } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const yScale = this.getYScale();
    
    const barWidth = chartWidth / this.state.data.length * (1 - this.options.barPadding);
    
    const bars = this.state.data.map((item, index) => {
      const x = margin.left + index * (chartWidth / this.state.data.length) + 
                (chartWidth / this.state.data.length - barWidth) / 2;
      const barHeight = (item.value / yScale.max) * chartHeight;
      const y = height - margin.bottom - barHeight;
      
      const color = this.colors[index % this.colors.length];
      
      return `
        <rect 
          x="${x}" 
          y="${y}" 
          width="${barWidth}" 
          height="${barHeight}" 
          fill="${color}" 
          class="data-element bar"
          data-index="${index}"
          data-value="${item.value}"
          data-label="${item.label}"
        >
          <animate attributeName="height" from="0" to="${barHeight}" dur="${this.options.animationDuration}ms" />
          <animate attributeName="y" from="${height - margin.bottom}" to="${y}" dur="${this.options.animationDuration}ms" />
        </rect>
      `;
    }).join('');
    
    dataGroup.innerHTML = bars;
  }
  
  getYScale() {
    const maxValue = Math.max(...this.state.data.map(d => d.value));
    const max = Math.ceil(maxValue * 1.1 / 10) * 10; // 向上取整到10的倍数
    
    const ticks = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      ticks.push((max / tickCount) * i);
    }
    
    return { max, ticks };
  }
  
  getDataAtPoint(e) {
    const rect = this.elements.svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const bars = this.elements.svg.querySelectorAll('.bar');
    for (const bar of bars) {
      const barRect = bar.getBoundingClientRect();
      const svgRect = this.elements.svg.getBoundingClientRect();
      
      if (x >= barRect.left - svgRect.left && 
          x <= barRect.right - svgRect.left &&
          y >= barRect.top - svgRect.top && 
          y <= barRect.bottom - svgRect.top) {
        return {
          label: bar.dataset.label,
          value: bar.dataset.value,
          index: parseInt(bar.dataset.index)
        };
      }
    }
    
    return null;
  }
  
  getLegendItems() {
    return this.state.data.map(item => item.label);
  }
}

// 3. 折线图
class LineChart extends BaseChart {
  constructor(container, options = {}) {
    super(container, {
      smooth: true,
      showPoints: true,
      pointRadius: 4,
      lineWidth: 2,
      ...options
    });
  }
  
  renderGrid() {
    const { grid } = this.svgGroups;
    const { margin, width, height } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // 网格线
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    
    let gridHTML = '';
    
    // 垂直网格线
    xScale.ticks.forEach(tick => {
      const x = margin.left + (tick / xScale.max) * chartWidth;
      gridHTML += `<line x1="${x}" x2="${x}" y1="${margin.top}" y2="${height - margin.bottom}" class="grid-line" />`;
    });
    
    // 水平网格线
    yScale.ticks.forEach(tick => {
      const y = margin.top + chartHeight - (tick / yScale.max) * chartHeight;
      gridHTML += `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" class="grid-line" />`;
    });
    
    grid.innerHTML = gridHTML;
  }
  
  renderAxes() {
    const { axes } = this.svgGroups;
    const { margin, width, height } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // 坐标轴
    let axesHTML = `
      <line x1="${margin.left}" x2="${width - margin.right}" y1="${height - margin.bottom}" y2="${height - margin.bottom}" class="axis-line" />
      <line x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}" class="axis-line" />
    `;
    
    // X轴标签
    const xScale = this.getXScale();
    xScale.ticks.forEach(tick => {
      const x = margin.left + (tick / xScale.max) * chartWidth;
      axesHTML += `<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" class="axis-label">${tick}</text>`;
    });
    
    // Y轴标签
    const yScale = this.getYScale();
    yScale.ticks.forEach(tick => {
      const y = margin.top + chartHeight - (tick / yScale.max) * chartHeight;
      axesHTML += `<text x="${margin.left - 10}" y="${y + 5}" text-anchor="end" class="axis-label">${tick}</text>`;
    });
    
    axes.innerHTML = axesHTML;
  }
  
  renderData() {
    const { data: dataGroup } = this.svgGroups;
    const { margin, width, height } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    
    // 生成路径点
    const points = this.state.data.map((item, index) => {
      const x = margin.left + (index / (this.state.data.length - 1)) * chartWidth;
      const y = margin.top + chartHeight - (item.value / yScale.max) * chartHeight;
      return { x, y, value: item.value, label: item.label };
    });
    
    // 生成路径
    let pathData = '';
    if (this.options.smooth) {
      pathData = this.generateSmoothPath(points);
    } else {
      pathData = this.generateLinearPath(points);
    }
    
    const color = this.colors[0];
    
    let dataHTML = `
      <path 
        d="${pathData}" 
        fill="none" 
        stroke="${color}" 
        stroke-width="${this.options.lineWidth}"
        class="data-element line"
      >
        <animate attributeName="stroke-dasharray" 
                 values="0,1000;1000,0" 
                 dur="${this.options.animationDuration}ms" />
      </path>
    `;
    
    // 添加数据点
    if (this.options.showPoints) {
      points.forEach((point, index) => {
        dataHTML += `
          <circle 
            cx="${point.x}" 
            cy="${point.y}" 
            r="${this.options.pointRadius}" 
            fill="${color}"
            class="data-element point"
            data-index="${index}"
            data-value="${point.value}"
            data-label="${point.label}"
          >
            <animate attributeName="r" from="0" to="${this.options.pointRadius}" dur="${this.options.animationDuration}ms" />
          </circle>
        `;
      });
    }
    
    dataGroup.innerHTML = dataHTML;
  }
  
  generateLinearPath(points) {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return path;
  }
  
  generateSmoothPath(points) {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (i === 1) {
        // 第一个控制点
        const cp1x = prev.x + (curr.x - prev.x) * 0.3;
        const cp1y = prev.y + (curr.y - prev.y) * 0.3;
        path += ` Q ${cp1x} ${cp1y} ${curr.x} ${curr.y}`;
      } else {
        // 贝塞尔曲线
        const cp1x = prev.x + (curr.x - points[i - 2].x) * 0.1;
        const cp1y = prev.y + (curr.y - points[i - 2].y) * 0.1;
        const cp2x = curr.x - (next ? (next.x - prev.x) * 0.1 : 0);
        const cp2y = curr.y - (next ? (next.y - prev.y) * 0.1 : 0);
        path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  }
  
  getXScale() {
    const max = this.state.data.length - 1;
    const ticks = [];
    const step = Math.max(1, Math.floor(max / 5));
    
    for (let i = 0; i <= max; i += step) {
      ticks.push(i);
    }
    
    return { max, ticks };
  }
  
  getYScale() {
    const maxValue = Math.max(...this.state.data.map(d => d.value));
    const max = Math.ceil(maxValue * 1.1 / 10) * 10;
    
    const ticks = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      ticks.push((max / tickCount) * i);
    }
    
    return { max, ticks };
  }
  
  getDataAtPoint(e) {
    const rect = this.elements.svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const points = this.elements.svg.querySelectorAll('.point');
    for (const point of points) {
      const cx = parseFloat(point.getAttribute('cx'));
      const cy = parseFloat(point.getAttribute('cy'));
      const r = parseFloat(point.getAttribute('r'));
      
      const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (distance <= r + 5) {
        return {
          label: point.dataset.label,
          value: point.dataset.value,
          index: parseInt(point.dataset.index)
        };
      }
    }
    
    return null;
  }
  
  getLegendItems() {
    return ['数据系列'];
  }
}

// 4. 饼图
class PieChart extends BaseChart {
  constructor(container, options = {}) {
    super(container, {
      innerRadius: 0,        // 内半径，0为饼图，>0为环形图
      startAngle: -90,       // 起始角度
      labelDistance: 1.2,    // 标签距离
      showLabels: true,      // 显示标签
      showValues: true,      // 显示数值
      ...options
    });
  }
  
  renderData() {
    const { data: dataGroup } = this.svgGroups;
    const { width, height } = this.options;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const innerRadius = this.options.innerRadius;
    
    const total = this.state.data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = this.options.startAngle;
    
    let dataHTML = '';
    
    this.state.data.forEach((item, index) => {
      const angle = (item.value / total) * 360;
      const color = this.colors[index % this.colors.length];
      
      // 计算路径
      const path = this.createArcPath(centerX, centerY, innerRadius, radius, currentAngle, currentAngle + angle);
      
      dataHTML += `
        <path 
          d="${path}" 
          fill="${color}" 
          class="data-element slice"
          data-index="${index}"
          data-value="${item.value}"
          data-label="${item.label}"
          data-percentage="${((item.value / total) * 100).toFixed(1)}"
        >
          <animateTransform
            attributeName="transform"
            type="scale"
            values="0,0;1,1"
            dur="${this.options.animationDuration}ms"
            transformOrigin="${centerX} ${centerY}"
          />
        </path>
      `;
      
      // 添加标签
      if (this.options.showLabels) {
        const labelAngle = currentAngle + angle / 2;
        const labelRadius = radius * this.options.labelDistance;
        const labelX = centerX + Math.cos((labelAngle - 90) * Math.PI / 180) * labelRadius;
        const labelY = centerY + Math.sin((labelAngle - 90) * Math.PI / 180) * labelRadius;
        
        const labelText = this.options.showValues 
          ? `${item.label}\n${item.value} (${((item.value / total) * 100).toFixed(1)}%)`
          : item.label;
        
        dataHTML += `
          <text 
            x="${labelX}" 
            y="${labelY}" 
            text-anchor="middle" 
            dominant-baseline="middle"
            class="pie-label"
            fill="#333"
            font-size="12"
          >${labelText}</text>
        `;
      }
      
      currentAngle += angle;
    });
    
    dataGroup.innerHTML = dataHTML;
  }
  
  createArcPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    const x1 = centerX + Math.cos(startAngleRad) * outerRadius;
    const y1 = centerY + Math.sin(startAngleRad) * outerRadius;
    const x2 = centerX + Math.cos(endAngleRad) * outerRadius;
    const y2 = centerY + Math.sin(endAngleRad) * outerRadius;
    
    if (innerRadius === 0) {
      // 饼图
      return [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    } else {
      // 环形图
      const x3 = centerX + Math.cos(endAngleRad) * innerRadius;
      const y3 = centerY + Math.sin(endAngleRad) * innerRadius;
      const x4 = centerX + Math.cos(startAngleRad) * innerRadius;
      const y4 = centerY + Math.sin(startAngleRad) * innerRadius;
      
      return [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');
    }
  }
  
  getDataAtPoint(e) {
    const rect = this.elements.svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const slices = this.elements.svg.querySelectorAll('.slice');
    for (const slice of slices) {
      if (this.isPointInPath(slice, x, y)) {
        return {
          label: slice.dataset.label,
          value: slice.dataset.value,
          percentage: slice.dataset.percentage,
          index: parseInt(slice.dataset.index)
        };
      }
    }
    
    return null;
  }
  
  isPointInPath(pathElement, x, y) {
    // 简化的点在路径内检测
    const bbox = pathElement.getBBox();
    return x >= bbox.x && x <= bbox.x + bbox.width && 
           y >= bbox.y && y <= bbox.y + bbox.height;
  }
  
  formatTooltip(data) {
    return `<div><strong>${data.label}</strong><br>值: ${data.value}<br>占比: ${data.percentage}%</div>`;
  }
  
  getLegendItems() {
    return this.state.data.map(item => item.label);
  }
}

// 5. 演示应用
class DataVisualizationDemo {
  constructor() {
    this.charts = {};
    this.setupUI();
    this.initCharts();
    this.bindEvents();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>数据可视化图表演示</h1>
        
        <div style="margin-bottom: 20px;">
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <button id="generate-data" class="demo-btn">生成随机数据</button>
            <button id="export-charts" class="demo-btn">导出图表</button>
            <select id="theme-select">
              <option value="default">默认主题</option>
              <option value="pastel">柔和主题</option>
              <option value="vibrant">鲜艳主题</option>
            </select>
            <label>
              <input type="checkbox" id="animation-toggle" checked>
              启用动画
            </label>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 20px;">
          <div>
            <div id="bar-chart" style="height: 400px;"></div>
          </div>
          
          <div>
            <div id="line-chart" style="height: 400px;"></div>
          </div>
          
          <div>
            <div id="pie-chart" style="height: 400px;"></div>
          </div>
          
          <div>
            <div id="donut-chart" style="height: 400px;"></div>
          </div>
        </div>
        
        <div style="margin-top: 40px;">
          <h2>数据统计</h2>
          <div id="data-stats" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          "></div>
          
          <h3>原始数据</h3>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; overflow: auto;">
            <table id="data-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #e9ecef;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">项目</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">数值</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">占比</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style>
        .demo-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .demo-btn:hover {
          background: #f0f0f0;
          border-color: #007bff;
        }
        
        #theme-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }
        
        .stat-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
      </style>
    `;
  }
  
  initCharts() {
    // 生成示例数据
    this.generateSampleData();
    
    // 初始化图表
    this.charts.bar = new BarChart('#bar-chart', {
      title: '销售额对比',
      animation: true,
      onHover: (e, data) => {
        if (data) {
          console.log('柱状图悬停:', data);
        }
      },
      onClick: (e, data) => {
        if (data) {
          console.log('柱状图点击:', data);
        }
      }
    });
    
    this.charts.line = new LineChart('#line-chart', {
      title: '增长趋势',
      smooth: true,
      showPoints: true,
      onHover: (e, data) => {
        if (data) {
          console.log('折线图悬停:', data);
        }
      }
    });
    
    this.charts.pie = new PieChart('#pie-chart', {
      title: '市场份额',
      showLabels: true,
      showValues: true,
      onHover: (e, data) => {
        if (data) {
          console.log('饼图悬停:', data);
        }
      }
    });
    
    this.charts.donut = new PieChart('#donut-chart', {
      title: '用户分布',
      innerRadius: 60,
      showLabels: false,
      onHover: (e, data) => {
        if (data) {
          console.log('环形图悬停:', data);
        }
      }
    });
    
    // 设置数据
    this.updateCharts();
  }
  
  generateSampleData() {
    const categories = ['产品A', '产品B', '产品C', '产品D', '产品E'];
    
    this.data = categories.map(category => ({
      label: category,
      value: Math.floor(Math.random() * 100) + 10
    }));
    
    // 为折线图生成时间序列数据
    this.timeSeriesData = Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}月`,
      value: Math.floor(Math.random() * 50) + 20 + Math.sin(i / 2) * 10
    }));
  }
  
  updateCharts() {
    this.charts.bar.setData(this.data);
    this.charts.line.setData(this.timeSeriesData);
    this.charts.pie.setData(this.data);
    this.charts.donut.setData(this.data);
    
    this.updateStats();
    this.updateDataTable();
  }
  
  updateStats() {
    const total = this.data.reduce((sum, item) => sum + item.value, 0);
    const avg = total / this.data.length;
    const max = Math.max(...this.data.map(d => d.value));
    const min = Math.min(...this.data.map(d => d.value));
    
    document.getElementById('data-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${total}</div>
        <div class="stat-label">总计</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avg.toFixed(1)}</div>
        <div class="stat-label">平均值</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${max}</div>
        <div class="stat-label">最大值</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${min}</div>
        <div class="stat-label">最小值</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.data.length}</div>
        <div class="stat-label">项目数</div>
      </div>
    `;
  }
  
  updateDataTable() {
    const total = this.data.reduce((sum, item) => sum + item.value, 0);
    const tbody = document.querySelector('#data-table tbody');
    
    tbody.innerHTML = this.data.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.label}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.value}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${((item.value / total) * 100).toFixed(1)}%</td>
      </tr>
    `).join('');
  }
  
  bindEvents() {
    // 生成随机数据
    document.getElementById('generate-data').addEventListener('click', () => {
      this.generateSampleData();
      this.updateCharts();
    });
    
    // 主题切换
    document.getElementById('theme-select').addEventListener('change', (e) => {
      const theme = e.target.value;
      Object.values(this.charts).forEach(chart => {
        chart.options.theme = theme;
        chart.colors = chart.getColorPalette();
        chart.render();
      });
    });
    
    // 动画开关
    document.getElementById('animation-toggle').addEventListener('change', (e) => {
      const animation = e.target.checked;
      Object.values(this.charts).forEach(chart => {
        chart.options.animation = animation;
      });
    });
    
    // 导出图表
    document.getElementById('export-charts').addEventListener('click', () => {
      this.exportCharts();
    });
  }
  
  exportCharts() {
    Object.entries(this.charts).forEach(([name, chart]) => {
      const svg = chart.elements.svg;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = chart.options.width;
      canvas.height = chart.options.height;
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        // 下载图片
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${name}-chart.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  }
}

// 运行演示
console.log('=== 数据可视化图表测试 ===\n');

const demo = new DataVisualizationDemo();

console.log('数据可视化图表功能特点：');
console.log('✓ 多种图表类型（柱状图、折线图、饼图）');
console.log('✓ SVG 矢量图形绘制');
console.log('✓ 平滑动画和交互效果');
console.log('✓ 响应式设计和主题切换');
console.log('✓ 数据提示和点击事件');
console.log('✓ 图例和网格线');
console.log('✓ 图表导出功能');
console.log('✓ 可扩展的架构设计');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseChart,
    BarChart,
    LineChart,
    PieChart
  };
}
