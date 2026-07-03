import { createServer } from "node:http"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, "dist")
const port = Number(process.env.PORT || 4173)

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

function isInsideDist(resolvedPath) {
  const relativePath = path.relative(distDir, resolvedPath)
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase()
  const contentType = contentTypes[extension] || "application/octet-stream"

  return fs.readFile(filePath).then((data) => {
    response.writeHead(200, { "Content-Type": contentType })
    response.end(data)
  })
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = request.url ? new URL(request.url, `http://${request.headers.host || "localhost"}`) : new URL("/", "http://localhost")
    const urlPath = decodeURIComponent(requestUrl.pathname)
    const relativePath = urlPath === "/" ? "index.html" : urlPath.slice(1)
    const filePath = path.resolve(distDir, relativePath)

    if (!isInsideDist(filePath)) {
      await sendFile(response, path.join(distDir, "index.html"))
      return
    }

    try {
      const stats = await fs.stat(filePath)
      if (stats.isFile()) {
        await sendFile(response, filePath)
        return
      }
    } catch {
      // Fall through to SPA fallback below.
    }

    await sendFile(response, path.join(distDir, "index.html"))
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
    response.end(`Server error: ${error.message}`)
  }
})

server.listen(port, "0.0.0.0", () => {
  console.log(`Frontend server listening on port ${port}`)
})