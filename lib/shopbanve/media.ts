import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { storage } from "@/lib/firebase"
import type { DrawingImage } from "./types"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Không thể đọc ảnh ${file.name}.`))
    }
    image.src = objectUrl
  })
}

function safeFileName(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "image"
}

export async function uploadDrawingImage(file: File, userId?: string): Promise<DrawingImage> {
  if (!file.type.startsWith("image/")) throw new Error(`Tệp ${file.name} không phải là hình ảnh.`)
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`Ảnh ${file.name} vượt quá giới hạn 10MB.`)
  const dimensions = await imageDimensions(file)
  if (dimensions.width < 320 || dimensions.height < 240) throw new Error(`Ảnh ${file.name} có kích thước quá nhỏ.`)

  const id = `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path = `shopbanve/drawings/${userId || "admin"}/${id}-${safeFileName(file.name)}`
  const uploaded = await uploadBytes(ref(storage, path), file, {
    contentType: file.type,
    customMetadata: { originalName: file.name },
  })
  const url = await getDownloadURL(uploaded.ref)
  return {
    id,
    url,
    alt: file.name.replace(/\.[^.]+$/, "").trim() || "Ảnh bản vẽ",
    width: dimensions.width,
    height: dimensions.height,
    bytes: file.size,
    format: file.type.split("/")[1] || "image",
    sortOrder: 0,
  }
}
