import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage"
import { storage } from "@/lib/firebase"

/** Uploads images to the configured Firebase Storage bucket. */
export interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  url: string
  format: string
  width: number
  height: number
  bytes: number
  created_at: string
}

function safeName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image"
  )
}

export class StorageImageUploader {
  static async uploadImage(file: File, folder = "uploads"): Promise<CloudinaryUploadResponse> {
    if (!file.type.startsWith("image/")) {
      throw new Error("Vui lòng chọn file hình ảnh.")
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Kích thước ảnh không được vượt quá 10MB.")
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const path = `uploads/${safeName(folder)}/${id}-${safeName(file.name)}`

    try {
      const uploaded = await uploadBytes(storageRef(storage, path), file, {
        contentType: file.type,
        customMetadata: { originalName: file.name },
      })
      const url = await getDownloadURL(uploaded.ref)

      return {
        public_id: path,
        secure_url: url,
        url,
        format: file.type.split("/")[1] || "image",
        width: 0,
        height: 0,
        bytes: file.size,
        created_at: new Date().toISOString(),
      }
    } catch (reason) {
      throw new Error(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.")
    }
  }

  static async deleteImage(publicId: string): Promise<void> {
    console.warn("Storage deletion requires an explicit server-side cleanup flow:", publicId)
  }

  static getOptimizedUrl(publicId: string): string {
    return publicId
  }
}

export const CloudinaryUploader = StorageImageUploader
