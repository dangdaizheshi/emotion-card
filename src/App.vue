<script setup>
import { ref } from 'vue'

const text = ref('')
const loading = ref(false)
const analysis = ref(null)
const error = ref('')

async function generate() {
  if (!text.value.trim()) return
  loading.value = true
  error.value = ''
  analysis.value = null
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '分析失败')
    analysis.value = data.analysis
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app">
    <!-- 左侧：输入区 -->
    <section class="input-panel">
      <h1 class="title">情绪卡片生成器</h1>
      <p class="subtitle">输入任意文字，AI 读懂情绪与意境，渲染一张有艺术感的水墨卡片</p>

      <textarea
        v-model="text"
        class="input-area"
        placeholder="在此输入你的文字… 一句名言、一首诗、一段文章，甚至一句牢骚话"
      ></textarea>

      <div class="toolbar">
        <span class="count">{{ text.length }} 字</span>
        <button class="generate-btn" :disabled="loading" @click="generate">
          {{ loading ? '分析中…' : '生成卡片' }}
        </button>
      </div>
    </section>

    <!-- 右侧：卡片预览区（第 2 轮先显示 JSON，第 3 轮换成卡片） -->
    <section class="preview-panel">
      <div v-if="loading" class="preview-msg">正在分析文字的情绪与意境…</div>
      <div v-else-if="error" class="preview-msg error">{{ error }}</div>
      <div v-else-if="analysis" class="preview-json">
        <pre>{{ JSON.stringify(analysis, null, 2) }}</pre>
      </div>
      <div v-else class="preview-placeholder">
        <span class="ph-icon">◻</span>
        <span class="ph-text">卡片预览区</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: minmax(320px, 5fr) minmax(360px, 6fr);
  gap: 48px;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 56px 40px;
}

.input-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.subtitle {
  font-size: 14px;
  color: var(--ink-dim);
  line-height: 1.7;
}

.input-area {
  flex: 1;
  min-height: 260px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  font-size: 18px;
  line-height: 1.9;
  color: var(--ink);
  resize: none;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.input-area::placeholder {
  color: rgba(232, 232, 240, 0.35);
}

.input-area:focus {
  border-color: rgba(179, 136, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.count {
  font-size: 12px;
  color: var(--ink-dim);
}

.generate-btn {
  background: linear-gradient(135deg, var(--accent), var(--bg-purple-3));
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s;
}

.generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(123, 45, 142, 0.4);
}

.preview-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ink-dim);
}

.ph-icon {
  font-size: 40px;
  opacity: 0.5;
}

.ph-text {
  font-size: 14px;
  letter-spacing: 0.1em;
}
</style>
