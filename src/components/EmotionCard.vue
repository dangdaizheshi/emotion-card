<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  analysis: { type: Object, default: null },
})

// ---------- 工具：亮度 → 可读文字色（WCAG） ----------
function luminance(hex) {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// ---------- 派生数据 ----------
const analysis = computed(() => props.analysis || {})
const visual = computed(() => analysis.value.visual || {})
const emotion = computed(() => analysis.value.emotion || {})

const palette = computed(() => {
  const p = visual.value.colorPalette
  if (Array.isArray(p) && p.length >= 3) return p
  return ['#1a1a2e', '#16213e', '#e8c4a0']
})
const bg = computed(() => palette.value[0])
const accent = computed(() => palette.value[2])
const isLight = computed(() => luminance(bg.value) > 0.5)
const textColor = computed(() => (isLight.value ? '#2b2b30' : '#f0ebe3'))
const dimColor = computed(() => (isLight.value ? 'rgba(43,43,48,0.5)' : 'rgba(240,235,227,0.45)'))

// ---------- 尺寸自适应（基础版，第 4 轮细化） ----------
const len = computed(() => props.text?.length || 0)
const cardSize = computed(() => {
  if (len.value < 50) return { w: 400, h: 420 }
  if (len.value < 150) return { w: 400, h: 560 }
  return { w: 420, h: 720 }
})

// ---------- 字体（第 3 轮用系统中文栈，第 4 轮换 CDN 艺术字体） ----------
const fontMood = computed(() => visual.value.fontMood || '')
const fontFamily = computed(() => {
  const m = fontMood.value
  const light = isLight.value
  // 浅底（宣纸）用墨色系宋体/楷体；深底用现代感字体
  if (/elegant|serif|classic|诗|雅|衬线/i.test(m)) {
    return "'Songti SC', 'SimSun', 'Noto Serif SC', serif"
  }
  if (/hand|写|楷/i.test(m)) {
    return "'Kaiti SC', 'KaiTi', 'STKaiti', cursive"
  }
  if (/bold|硬|黑|粗/i.test(m)) {
    return "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
  }
  return light
    ? "'Songti SC', 'SimSun', serif"
    : "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
})

// ---------- 字号：文字多则小（自适应，避免孤立换行） ----------
const fontSize = computed(() => {
  const l = len.value
  const base = l < 25 ? 28 : l < 80 ? 22 : l < 250 ? 17 : 14
  return `${base}px`
})

// ---------- 诗意关键词 / 印章 ----------
const poeticKeyword = computed(() => visual.value.poeticKeyword || '')
const sealChar = computed(() => {
  const kw = poeticKeyword.value
  return kw ? kw.slice(0, 2) : '情'
})

// ---------- 背景（情绪色渐变 + 水墨纸纹） ----------
const bgStyle = computed(() => {
  const g = `linear-gradient(155deg, ${bg.value} 0%, ${palette.value[1] || bg.value} 100%)`
  return { background: g }
})

// 水墨纸纹：SVG feTurbulence 噪点，叠加在底色上
const textureStyle = computed(() => ({
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
  opacity: isLight.value ? 0.04 : 0.08,
}))

// 墨晕：角落柔和的 radial 晕染
const inkWashStyle = computed(() => ({
  background: `radial-gradient(circle at 82% 18%, ${accent.value}22 0%, transparent 55%)`,
}))
</script>

<template>
  <div class="card" :style="[{ width: cardSize.w + 'px', height: cardSize.h + 'px' }, bgStyle]">
    <!-- Layer1 水墨纸纹 -->
    <div class="layer-texture" :style="textureStyle"></div>
    <!-- Layer1.5 墨晕 -->
    <div class="layer-inkwash" :style="inkWashStyle"></div>

    <!-- Layer4 文字 -->
    <div class="layer-text">
      <div v-if="poeticKeyword" class="poetic" :style="{ color: dimColor }">
        {{ poeticKeyword }}
      </div>
      <div class="main-text" :style="{ color: textColor, fontFamily, fontSize }">
        {{ text }}
      </div>
      <div class="divider" :style="{ background: dimColor }"></div>
    </div>

    <!-- Layer5 印章 -->
    <div class="layer-seal" :style="{ color: textColor, borderColor: dimColor }">
      <span class="seal-box" :style="{ color: isLight ? '#b03a2e' : '#e8a49a' }">{{ sealChar }}</span>
      <span class="seal-label" :style="{ color: dimColor }">情绪 · {{ emotion.primary || 'neutral' }}</span>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.layer-texture,
.layer-inkwash {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.layer-text {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 20px;
  text-align: center;
}

.poetic {
  font-size: 13px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
}

.main-text {
  line-height: 1.9;
  letter-spacing: 0.04em;
  max-width: 100%;
  white-space: pre-line;
  text-wrap: balance; /* 均衡断行，避免单字孤立 */
}

.divider {
  width: 48px;
  height: 1px;
  opacity: 0.5;
}

.layer-seal {
  position: absolute;
  right: 24px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.seal-box {
  width: 34px;
  height: 34px;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Kaiti SC', 'KaiTi', serif;
}

.seal-label {
  font-size: 10px;
  letter-spacing: 0.2em;
}
</style>
