// Vite 插件：/api/analyze 中间件，把前端请求转发到商汤 SenseNova（OpenAI 兼容）。
// key 只存在于服务端 .env.local，绝不下发到前端 bundle。
import { loadEnv } from 'vite'
import { SYSTEM_PROMPT } from './sensenova-prompt.js'

export function sensenovaPlugin() {
  let env = {}
  return {
    name: 'sensenova-analyze',
    configResolved(config) {
      env = loadEnv(config.mode, config.root, '')
    },
    configureServer(server) {
      // 调试端点：查询当前 key 可用的模型列表（不暴露 key）
      server.middlewares.use('/api/models', async (req, res) => {
        const apiKey = env.SENSENOVA_API_KEY
        const baseUrl = env.SENSENOVA_BASE_URL || 'https://api.sensenova.cn/compatible-mode/v1'
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'SENSENOVA_API_KEY 未配置' }))
          return
        }
        try {
          const r = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
          const data = await r.json()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: r.ok, status: r.status, data }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'method not allowed' }))
          return
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', async () => {
          try {
            const { text } = JSON.parse(body || '{}')
            if (!text || typeof text !== 'string') {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'missing text' }))
              return
            }
            const apiKey = env.SENSENOVA_API_KEY
            const baseUrl = env.SENSENOVA_BASE_URL || 'https://api.sensenova.cn/compatible-mode/v1'
            const model = env.SENSENOVA_MODEL
            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'SENSENOVA_API_KEY 未配置，请在 .env.local 填写' }))
              return
            }
            // 兼容两种写法：填完整端点（.../chat/completions）或只填 base（.../v1）
            let apiUrl = baseUrl.replace(/\/$/, '')
            if (!apiUrl.endsWith('/chat/completions')) apiUrl += '/chat/completions'
            const r = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: text },
                ],
                temperature: 0.6,
              }),
            })
            const rawText = await r.text()
            let data
            try {
              data = JSON.parse(rawText)
            } catch {
              // 诊断：商汤返回非 JSON（可能 base_url 不对，返回了错误页）
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '商汤返回非 JSON', status: r.status, rawText: rawText.slice(0, 400) }))
              return
            }
            const content = data?.choices?.[0]?.message?.content
            let parsed
            try {
              parsed = JSON.parse(content)
            } catch {
              // 诊断：返回原始 message 结构，便于排查商汤响应格式
              parsed = {
                parseError: 'content 非合法 JSON',
                rawMessage: data?.choices?.[0]?.message ?? null,
                rawError: data?.error ?? null,
                rawKeys: data ? Object.keys(data) : null,
              }
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, analysis: parsed }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}
