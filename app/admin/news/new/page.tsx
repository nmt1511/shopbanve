"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X, Save, Tag } from "lucide-react"
import { FirebaseDB, type NewsArticle } from "@/lib/firebase-db"
import { CloudinaryUploader } from "@/lib/cloudinary"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/firebase-auth"
import { RichTextEditor } from "@/components/rich-text-editor"

export default function NewNewsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const unsubscribe = FirebaseDB.onTagsChange((tags) => {
      setAvailableTags(tags.filter((tag) => Boolean(tag.id)).map((tag) => ({ id: tag.id!, name: tag.name })))
    })
    return unsubscribe
  }, [])

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    author_id: "admin", // Default author, should be dynamic in real app
    status: "draft" as "published" | "draft" | "scheduled",
    view_count: 0,
    published_at: "",
    tag_ids: [] as string[],
  })

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const response = await CloudinaryUploader.uploadImage(file, "news-featured")
      const imageUrl = response.secure_url
      setFormData((prev) => ({ ...prev, featured_image_url: imageUrl }))
      toast({
        title: "Thành công",
        description: "Đã tải ảnh lên thành công",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải ảnh lên",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleTagToggle = (tagId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: checked ? [...prev.tag_ids, tagId] : prev.tag_ids.filter((id) => id !== tagId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và nội dung bài viết",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const articleData: Omit<NewsArticle, "id"> = {
        ...formData,
        status: isDraft ? "draft" : formData.status,
        published_at:
          formData.status === "published" && !isDraft ? new Date().toISOString() : formData.published_at || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await FirebaseDB.addNewsArticle(articleData, user?.uid || "admin")

      toast({
        title: "Thành công",
        description: isDraft ? "Đã lưu bản nháp" : "Đã tạo bài viết thành công",
      })

      router.push("/admin/news")
    } catch (error) {
      console.error("Error saving article:", error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu bài viết",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
      .replace(/[èéẹẻẽêềếệểễ]/g, "e")
      .replace(/[ìíịỉĩ]/g, "i")
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
      .replace(/[ùúụủũưừứựửữ]/g, "u")
      .replace(/[ỳýỵỷỹ]/g, "y")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleTitleChange = (title: string) => {
    handleInputChange("title", title)
    if (!formData.slug) {
      handleInputChange("slug", generateSlug(title))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Viết bài mới</h1>
          <p className="text-gray-600 mt-1">Tạo bài viết tin tức hoặc dự án mới</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nội dung bài viết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Tiêu đề bài viết *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="VD: Xu hướng thị trường inox 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug URL</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    placeholder="xu-huong-thi-truong-inox-2024"
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Tóm tắt bài viết</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange("excerpt", e.target.value)}
                    placeholder="Tóm tắt ngắn gọn về nội dung bài viết..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Nội dung bài viết *</Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => handleInputChange("content", value)}
                    placeholder="Viết nội dung chi tiết của bài viết..."
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Sử dụng thanh công cụ để định dạng văn bản và chèn hình ảnh.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Ảnh đại diện</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.featured_image_url ? (
                  <div className="relative">
                    <img
                      src={formData.featured_image_url || "/placeholder.svg"}
                      alt="Featured"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData((prev) => ({ ...prev, featured_image_url: "" }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Tải ảnh đại diện cho bài viết</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="featured-image"
                      disabled={uploadingImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("featured-image")?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Đang tải..." : "Chọn ảnh"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Xuất bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "published" | "draft" | "scheduled") => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="published">Đã xuất bản</SelectItem>
                      <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === "scheduled" && (
                  <div>
                    <Label htmlFor="published_at">Ngày xuất bản</Label>
                    <Input
                      id="published_at"
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) => handleInputChange("published_at", e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Thẻ bài viết
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có thẻ nào</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={formData.tag_ids.includes(tag.id!)}
                          onCheckedChange={(checked) => handleTagToggle(tag.id!, checked as boolean)}
                        />
                        <Label htmlFor={`tag-${tag.id}`} className="text-sm font-normal cursor-pointer">
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/tags")}>
                    Quản lý thẻ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <div className="flex items-center space-x-2">
            <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, true)} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Lưu nháp
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Xuất bản"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
