#!/usr/bin/env node
/**
 * 将 VuePress 构建产物中的文章页面发布到微信公众号草稿箱。
 *
 * 原理：
 *   1. 从构建产物 HTML（docs/.vuepress/dist/...）中抽取 <div id="content"> 正文
 *   2. 把正文里的本地图片（/images/...）上传到微信，替换为可用的 https 地址
 *   3. 清理 VuePress 特有标签，转换为微信公众号富文本支持的 HTML
 *   4. 调 draft/add 接口写入草稿箱
 *
 * 用法：
 *   # 方式一：通过环境变量提供凭证
 *   WECHAT_APPID=wx... WECHAT_SECRET=... node scripts/publish-wechat.mjs \
 *     --html docs/.vuepress/dist/model-access/ai-tech-stack.html
 *
 *   # 方式二：命令行参数（也可混合使用）
 *   node scripts/publish-wechat.mjs \
 *     --appid wx... --secret ... \
 *     --html docs/.vuepress/dist/model-access/ai-tech-stack.html
 *
 * 可选参数：
 *   --title   文章标题（默认取正文第一个 H1）
 *   --author  作者
 *   --digest  摘要（默认取第一个段落，最长 120 字）
 *   --cover   封面图路径（默认取正文第一张图上传为永久素材作封面）
 *   --thumb   复用已有封面素材的 thumb_media_id，跳过封面上传
 *   --update  传入草稿 media_id 时更新该草稿（不新建）
 *   --url     原文链接 content_source_url
 *   --token   复用已有 access_token，跳过获取
 *   --no-comment  关闭留言（默认开启留言）
 *   --dry-run 只做本地转换并输出 wechat.html，不发网络请求
 *
 * 凭证也可从 .env 读取（WECHAT_APPID / WECHAT_SECRET / WECHAT_ACCESS_TOKEN）。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const API = {
  token: 'https://api.weixin.qq.com/cgi-bin/token',
  uploadImg: 'https://api.weixin.qq.com/cgi-bin/media/uploadimg',
  addMaterial: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
  draftAdd: 'https://api.weixin.qq.com/cgi-bin/draft/add',
  draftUpdate: 'https://api.weixin.qq.com/cgi-bin/draft/update',
}

function loadEnv() {
  const envFile = path.join(ROOT, '.env')
  if (!fs.existsSync(envFile)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(envFile, 'utf8')
      .split('\n')
      .filter((l) => l && !l.trim().startsWith('#'))
      .map((l) => l.split('='))
      .filter((kv) => kv[0].trim() && kv[1])
      .map(([k, v]) => [k.trim(), v.trim()]),
  )
}

function parseArgs(argv) {
  const env = loadEnv()
  const args = {
    appid: process.env.WECHAT_APPID || env.WECHAT_APPID,
    secret: process.env.WECHAT_SECRET || env.WECHAT_SECRET,
    token: process.env.WECHAT_ACCESS_TOKEN || env.WECHAT_ACCESS_TOKEN,
    html: null,
    title: null,
    author: '',
    digest: null,
    cover: null,
    thumb: null,
    update: null,
    url: '',
    comment: true,
    dryRun: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const [k, v] = [argv[i], argv[i + 1]]
    switch (k) {
      case '--appid': args.appid = v; i++; break
      case '--secret': args.secret = v; i++; break
      case '--token': args.token = v; i++; break
      case '--html': args.html = v; i++; break
      case '--title': args.title = v; i++; break
      case '--author': args.author = v; i++; break
      case '--digest': args.digest = v; i++; break
      case '--cover': args.cover = v; i++; break
      case '--thumb': args.thumb = v; i++; break
      case '--update': args.update = v; i++; break
      case '--url': args.url = v; i++; break
      case '--no-comment': args.comment = false; break
      case '--dry-run': args.dryRun = true; break
    }
  }
  return args
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

// 抽取 <div id="content"> 内部正文（按标签深度匹配，避免被内部嵌套 div 干扰）
function extractContent(html) {
  const marker = '<div id="content">'
  const start = html.indexOf(marker)
  if (start === -1) throw new Error('未找到正文容器 <div id="content">，请确认是构建产物 HTML')
  let i = start + marker.length
  let depth = 1
  while (i < html.length && depth > 0) {
    const open = html.indexOf('<div', i)
    const close = html.indexOf('</div>', i)
    if (close === -1) throw new Error('正文容器闭合标签不完整')
    if (open !== -1 && open < close) {
      depth++
      i = open + 4
    } else {
      depth--
      i = close + 6
    }
  }
  return html.slice(start + marker.length, i - 6)
}

function getTitle(html, content, fallback) {
  if (fallback) return fallback
  const h1 = content.match(/<h1[^>]*>(.*?)<\/h1>/s)
  if (h1) return stripTags(h1[1])
  const t = html.match(/<title>([^<]*)<\/title>/)
  if (t) return t[1].split('|')[0].trim()
  return '未命名文章'
}

function getDigest(content, fallback) {
  if (fallback) return fallback
  for (const p of content.matchAll(/<p[^>]*>(.*?)<\/p>/gs)) {
    const text = stripTags(p[1])
    if (text.length > 10) return text.slice(0, 120)
  }
  return ''
}

function resolveLocalFile(src, distRoot, publicRoot) {
  const candidates = []
  if (src.startsWith('/')) {
    candidates.push(path.join(distRoot, src))
    candidates.push(path.join(publicRoot, src))
  } else {
    candidates.push(path.resolve(distRoot, src))
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

const STYLES = {
  h1: 'font-size:20px;font-weight:bold;color:#1f2d3d;text-align:center;margin:28px 0 16px;padding-bottom:10px;border-bottom:2px solid #3a78c2;',
  h2: 'font-size:18px;font-weight:bold;color:#3a78c2;margin:26px 0 14px;padding:7px 10px 7px 12px;border-left:5px solid #3a78c2;background:#f4f8fd;',
  h3: 'font-size:17px;font-weight:bold;color:#d97706;margin:22px 0 12px;padding:4px 0 4px 10px;border-left:4px solid #f59e0b;',
  h4: 'font-size:16px;font-weight:bold;color:#475569;margin:18px 0 10px;',
  h5: 'font-size:15px;font-weight:bold;color:#64748b;margin:16px 0 8px;',
  h6: 'font-size:15px;font-weight:bold;color:#94a3b8;margin:14px 0 8px;',
  p: 'font-size:16px;line-height:1.75;color:#333;margin:12px 0;',
  blockquote: 'margin:14px 0;padding:10px 14px;border-left:4px solid #3a78c2;background:#f7f9fc;color:#555;',
  table: 'width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;',
  th: 'border:1px solid #d1d5db;padding:7px 10px;background:#f3f4f6;text-align:left;font-weight:bold;color:#1f2d3d;',
  td: 'border:1px solid #d1d5db;padding:7px 10px;color:#333;line-height:1.6;',
  hr: 'border:none;border-top:1px solid #e5e7eb;margin:24px 0;',
  img: 'max-width:100%;border-radius:6px;margin:12px auto;display:block;',
  pre: 'background:#f6f8fa;color:#24292e;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;font-size:14px;line-height:1.7;overflow-x:auto;margin:12px 0;',
  code: 'background:#f3f4f6;color:#c7254e;padding:2px 5px;border-radius:4px;font-size:14px;',
  ul: 'padding-left:22px;margin:10px 0;',
  ol: 'padding-left:22px;margin:10px 0;',
  li: 'margin:6px 0;line-height:1.7;',
}

function normalizeContent(c) {
  c = c
    // 去掉 VuePress 的标题锚点，保留文字
    .replace(/<a class="header-anchor"[^>]*>(.*?)<\/a>/gs, '$1')
    // 外链在公众号文章里不可点击，去掉 href 保留文字
    .replace(/<a [^>]*>(.*?)<\/a>/gs, '$1')
    // 清理多余属性
    .replace(/\s(?:id|tabindex|class|role|target|rel|data-[a-z-]+|aria-[a-z-]+)="[^"]*"/g, '')
  // 代码块：先保护 <pre> 块，再处理行内 <code>
  const pres = []
  c = c.replace(/<pre>[\s\S]*?<\/pre>/g, (m) => {
    pres.push(m.replace('<pre>', `<pre style="${STYLES.pre}">`))
    return `\x00PRE${pres.length - 1}\x00`
  })
  c = c.replace(/<code>/g, `<code style="${STYLES.code}">`)
  c = c.replace(/\x00PRE(\d+)\x00/g, (_, i) => pres[+i])
  // 标题、段落、列表、表格等美化
  c = c
    .replace(/<h1>/g, `<h1 style="${STYLES.h1}">`)
    .replace(/<h2>/g, `<h2 style="${STYLES.h2}">`)
    .replace(/<h3>/g, `<h3 style="${STYLES.h3}">`)
    .replace(/<h4>/g, `<h4 style="${STYLES.h4}">`)
    .replace(/<h5>/g, `<h5 style="${STYLES.h5}">`)
    .replace(/<h6>/g, `<h6 style="${STYLES.h6}">`)
    .replace(/<p>/g, `<p style="${STYLES.p}">`)
    .replace(/<blockquote>/g, `<blockquote style="${STYLES.blockquote}">`)
    .replace(/<ul>/g, `<ul style="${STYLES.ul}">`)
    .replace(/<ol>/g, `<ol style="${STYLES.ol}">`)
    .replace(/<li>/g, `<li style="${STYLES.li}">`)
    .replace(/<table>/g, `<table style="${STYLES.table}">`)
    .replace(/<th>/g, `<th style="${STYLES.th}">`)
    .replace(/<td>/g, `<td style="${STYLES.td}">`)
    .replace(/<hr>/g, `<hr style="${STYLES.hr}">`)
    .replace(/<img /g, `<img style="${STYLES.img}" `)
  return c
}

async function getAccessToken(appid, secret) {
  const url = new URL(API.token)
  url.searchParams.set('grant_type', 'client_credential')
  url.searchParams.set('appid', appid)
  url.searchParams.set('secret', secret)
  const res = await fetch(url)
  const data = await res.json()
  if (!data.access_token) throw new Error(`获取 access_token 失败: ${JSON.stringify(data)}`)
  return data.access_token
}

async function uploadMedia(accessToken, filePath, kind) {
  const url = new URL(kind === 'content' ? API.uploadImg : API.addMaterial)
  url.searchParams.set('access_token', accessToken)
  if (kind === 'thumb') url.searchParams.set('type', 'image')
  const form = new FormData()
  form.append('media', new Blob([fs.readFileSync(filePath)]), path.basename(filePath))
  const res = await fetch(url, { method: 'POST', body: form })
  const data = await res.json()
  if (data.errcode) throw new Error(`上传图片失败(${path.basename(filePath)}): ${JSON.stringify(data)}`)
  return data
}

async function createDraft(accessToken, article) {
  const res = await fetch(API.draftAdd + '?access_token=' + accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articles: [article] }),
    signal: AbortSignal.timeout(10 * 60 * 1000),
  })
  const data = await res.json()
  if (data.errcode) throw new Error(`创建草稿失败: ${JSON.stringify(data)}`)
  return data
}

async function updateDraft(accessToken, mediaId, article) {
  const res = await fetch(API.draftUpdate + '?access_token=' + accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_id: mediaId, index: 0, articles: article }),
    signal: AbortSignal.timeout(10 * 60 * 1000),
  })
  const data = await res.json()
  if (data.errcode) throw new Error(`更新草稿失败: ${JSON.stringify(data)}`)
  return data
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.html) {
    console.error('缺少 --html 参数（构建产物 HTML 路径）')
    process.exit(1)
  }
  const htmlFile = path.resolve(ROOT, args.html)
  if (!fs.existsSync(htmlFile)) {
    console.error(`文件不存在: ${htmlFile}`)
    process.exit(1)
  }

  const distRoot = path.resolve(path.dirname(htmlFile), '..')
  const publicRoot = path.join(ROOT, 'docs', '.vuepress', 'public')
  const rawHtml = fs.readFileSync(htmlFile, 'utf8')

  let content = normalizeContent(extractContent(rawHtml))
  const title = getTitle(rawHtml, content, args.title)
  const digest = getDigest(content, args.digest)

  console.log(`文章: ${title}`)
  console.log(`摘要: ${digest || '(自动生成失败)'}`)

  if (args.dryRun) {
    const out = path.join(ROOT, 'wechat-dryrun.html')
    fs.writeFileSync(out, content)
    console.log(`[dry-run] 已输出转换后正文: ${out}`)
    return
  }

  if (!args.token) {
    if (!args.appid || !args.secret) {
      console.error('需要凭证：请提供 --appid/--secret（或 WECHAT_APPID/WECHAT_SECRET），或 --token 复用已有 token')
      process.exit(1)
    }
    console.log('获取 access_token ...')
    args.token = await getAccessToken(args.appid, args.secret)
  }

  const imgs = [...content.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)]
  for (const m of imgs) {
    const src = m[1]
    if (/^https?:\/\//.test(src)) continue
    const file = resolveLocalFile(src, distRoot, publicRoot)
    if (!file) {
      console.warn(`  跳过图片(找不到文件): ${src}`)
      continue
    }
    const { url } = await uploadMedia(args.token, file, 'content')
    console.log(`  上传正文图片: ${path.basename(file)} -> ${url.slice(0, 60)}...`)
    content = content.replace(m[0], m[0].replace(`src="${src}"`, `src="${url}"`))
  }

  let thumbMediaId
  if (args.thumb) {
    thumbMediaId = args.thumb
  } else if (args.cover) {
    const cover = path.resolve(ROOT, args.cover)
    if (!fs.existsSync(cover)) throw new Error(`封面不存在: ${cover}`)
    const data = await uploadMedia(args.token, cover, 'thumb')
    thumbMediaId = data.media_id
  } else if (imgs.length > 0) {
    const src = imgs[0][1]
    const file = resolveLocalFile(src, distRoot, publicRoot)
    if (file) {
      const data = await uploadMedia(args.token, file, 'thumb')
      thumbMediaId = data.media_id
      console.log(`  上传封面: ${path.basename(file)}`)
    }
  }
  if (!thumbMediaId) {
    console.error('无法确定封面图（thumb_media_id 必填），请用 --cover 指定封面图片')
    process.exit(1)
  }

  const article = {
    title,
    author: args.author,
    digest,
    content,
    content_source_url: args.url,
    thumb_media_id: thumbMediaId,
    need_open_comment: args.comment ? 1 : 0,
    only_fans_can_comment: 0,
  }

  if (args.update) {
    console.log(`更新草稿 ${args.update} ...`)
    await updateDraft(args.token, args.update, article)
    console.log(`成功！已更新草稿 media_id: ${args.update}`)
  } else {
    console.log('创建草稿 ...')
    const result = await createDraft(args.token, article)
    console.log(`成功！草稿 media_id: ${result.media_id}`)
  }
  console.log('可在公众号后台「草稿箱」中查看、编辑后发布。')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
