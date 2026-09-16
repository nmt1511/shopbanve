const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "EM",
  "H2",
  "H3",
  "H4",
  "I",
  "LI",
  "OL",
  "P",
  "PRE",
  "STRONG",
  "UL",
])

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function safeHref(value: string) {
  try {
    const trimmedValue = value.trim()
    const url = new URL(trimmedValue, "https://shopbanve.local")
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href
    }
  } catch {
    return ""
  }
  return ""
}

function sanitizeTag(source: string) {
  const match = source.match(/^<\s*(\/?)\s*([a-z0-9]+)([^>]*)>$/i)
  if (!match) return escapeText(source)

  const closing = match[1] === "/"
  const rawTagName = match[2]
  const attributes = match[3] || ""
  if (!rawTagName) return escapeText(source)
  const tagName = rawTagName.toUpperCase()
  if (!allowedTags.has(tagName)) return escapeText(source)
  if (closing) return `</${tagName.toLowerCase()}>`
  if (tagName === "BR") return "<br />"

  if (tagName !== "A") return `<${tagName.toLowerCase()}>`

  const hrefMatch = attributes.match(/\bhref\s*=\s*["']([^"']+)["']/i)
  const href = hrefMatch?.[1] ? safeHref(hrefMatch[1]) : ""
  if (!href) return ""

  const targetMatch = attributes.match(/\btarget\s*=\s*["']_blank["']/i)
  return targetMatch
    ? `<a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">`
    : `<a href="${escapeText(href)}">`
}

/**
 * Sanitizes the small HTML subset accepted by Shop Bản Vẽ articles.
 * The implementation is deterministic on server and client to avoid hydration differences.
 */
export function sanitizeShopArticleHtml(value: string) {
  const withoutDangerousBlocks = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form)[^>]*\/?>/gi, "")

  const tokenPattern = /<[^>]*>/g
  let output = ""
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(withoutDangerousBlocks))) {
    output += escapeText(withoutDangerousBlocks.slice(cursor, match.index))
    output += sanitizeTag(match[0])
    cursor = match.index + match[0].length
  }

  output += escapeText(withoutDangerousBlocks.slice(cursor))
  return output.replace(/\r?\n/g, "<br />")
}
