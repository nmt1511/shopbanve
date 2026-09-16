"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Upload, X, ImageIcon, Eye, Search, Filter, Loader2 } from "lucide-react"
import { FirebaseDB, type Slider } from "@/lib/firebase-db"
import { useAuth } from "@/lib/firebase-auth"
import { CloudinaryUploader } from "@/lib/cloudinary"
import { toast } from "sonner"

const SLIDER_TYPES = ["Hero", "Banner", "Promotion", "Product Showcase"]
const SLIDER_POSITIONS = ["Top", "Middle", "Bottom", "Sidebar"]

export default function SlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("Tất cả")
  const [selectedStatus, setSelectedStatus] = useState("Tất cả")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewSlider, setPreviewSlider] = useState<Slider | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    buttonText: "",
    type: "Hero",
    position: "Top",
    order: 1,
    isActive: true,
  })

  useEffect(() => {
    loadSliders()
  }, [])

  const loadSliders = async () => {
    try {
      setLoading(true)
      const data = await FirebaseDB.getSliders()
      setSliders(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error("Error loading sliders:", error)
      toast.error("Không thể tải danh sách slider")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      link: "",
      buttonText: "",
      type: "Hero",
      position: "Top",
      order: 1,
      isActive: true,
    })
    setEditingSlider(null)
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB")
      return
    }

    setIsUploadingImage(true)
    try {
      const uploadResult = await CloudinaryUploader.uploadImage(file, "sliders")
      handleInputChange("image", uploadResult.secure_url)
      toast.success("Tải ảnh lên thành công")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại.")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.image) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    try {
      if (editingSlider) {
        await FirebaseDB.updateSlider(editingSlider.id!, formData, user?.uid)
        toast.success("Cập nhật slider thành công")
      } else {
        await FirebaseDB.addSlider(formData, user?.uid)
        toast.success("Thêm slider thành công")
      }

      setIsDialogOpen(false)
      resetForm()
      loadSliders()
    } catch (error) {
      console.error("Error saving slider:", error)
      toast.error("Có lỗi xảy ra khi lưu slider")
    }
  }

  const handleEdit = (slider: Slider) => {
    setEditingSlider(slider)
    setFormData({
      title: slider.title,
      description: slider.description || "",
      image: slider.image,
      link: slider.link || "",
      buttonText: slider.buttonText || "",
      type: (slider as any).type || "Hero",
      position: (slider as any).position || "Top",
      order: slider.order,
      isActive: slider.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa slider này?")) return

    try {
      await FirebaseDB.deleteSlider(id, user?.uid)
      toast.success("Xóa slider thành công")
      loadSliders()
    } catch (error) {
      console.error("Error deleting slider:", error)
      toast.error("Có lỗi xảy ra khi xóa slider")
    }
  }

  const toggleStatus = async (slider: Slider) => {
    try {
      await FirebaseDB.updateSlider(slider.id!, { isActive: !slider.isActive }, user?.uid)
      toast.success(`Đã ${!slider.isActive ? "kích hoạt" : "tắt"} slider`)
      loadSliders()
    } catch (error) {
      console.error("Error toggling slider status:", error)
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái")
    }
  }

  const handlePreview = (slider: Slider) => {
    setPreviewSlider(slider)
    setIsPreviewOpen(true)
  }

  const filteredSliders = sliders.filter((slider) => {
    const matchesSearch =
      slider.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (slider.description || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === "Tất cả" || (slider as any).type === selectedType

    const matchesStatus =
      selectedStatus === "Tất cả" ||
      (selectedStatus === "Hoạt động" && slider.isActive) ||
      (selectedStatus === "Tạm dừng" && !slider.isActive)

    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Slider & Banner</h1>
          <p className="text-gray-600 mt-1">Quản lý hình ảnh slider và banner trên trang chủ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm slider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlider ? "Chỉnh sửa slider" : "Thêm slider mới"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="VD: Chào mừng đến với Inox Phương Thuận Phát"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Loại slider</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLIDER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Mô tả ngắn gọn về slider"
                  rows={3}
                />
              </div>

              <div>
                <Label>Hình ảnh * (Khuyến nghị: 1920x600px)</Label>
                {formData.image ? (
                  <div className="relative mt-2">
                    <img
                      src={formData.image || "/placeholder.svg"}
                      alt="Slider"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                     
                      className="absolute top-2 right-2"
                      onClick={() => handleInputChange("image", "")}
                      disabled={isUploadingImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2">
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                        <p className="text-gray-600 mb-2">Đang tải ảnh lên...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Tải ảnh slider</p>
                        <p className="text-xs text-gray-500 mb-4">Hỗ trợ: JPG, PNG, WebP. Tối đa 5MB</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="slider-image"
                      disabled={isUploadingImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("slider-image")?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? "Đang tải..." : "Chọn ảnh"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="link">Liên kết</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => handleInputChange("link", e.target.value)}
                    placeholder="/san-pham"
                  />
                </div>
                <div>
                  <Label htmlFor="buttonText">Text nút</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => handleInputChange("buttonText", e.target.value)}
                    placeholder="Xem sản phẩm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="position">Vị trí</Label>
                  <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLIDER_POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order">Thứ tự hiển thị</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => handleInputChange("order", Number.parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label htmlFor="isActive">Kích hoạt</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">{editingSlider ? "Cập nhật" : "Thêm"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng slider</p>
                <p className="text-2xl font-bold">{sliders.length}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{sliders.filter((s) => s.isActive).length}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tạm dừng</p>
                <p className="text-2xl font-bold text-yellow-600">{sliders.filter((s) => !s.isActive).length}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Loại slider</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(sliders.map((s) => (s as any).type || "Hero")).size}
                </p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm slider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Loại slider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả">Tất cả loại</SelectItem>
                {SLIDER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả">Tất cả</SelectItem>
                <SelectItem value="Hoạt động">Hoạt động</SelectItem>
                <SelectItem value="Tạm dừng">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sliders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách slider ({filteredSliders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSliders.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {sliders.length === 0 ? "Chưa có slider nào" : "Không tìm thấy slider phù hợp"}
              </p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={resetForm}>
                {sliders.length === 0 ? "Tạo slider đầu tiên" : "Tạo slider mới"}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slider</TableHead>
                  <TableHead>Loại & Vị trí</TableHead>
                  <TableHead>Liên kết</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSliders.map((slider) => (
                  <TableRow key={slider.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={slider.image || "/placeholder.svg"}
                          alt={slider.title}
                          className="h-16 w-24 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{slider.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{slider.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{(slider as any).type || "Hero"}</Badge>
                        <p className="text-xs text-gray-500">{(slider as any).position || "Top"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{slider.link || "Không có"}</p>
                        {slider.buttonText && <p className="text-xs text-gray-500">"{slider.buttonText}"</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{slider.order}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch checked={slider.isActive} onCheckedChange={() => toggleStatus(slider)} />
                        <Badge
                          className={slider.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {slider.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(slider.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" onClick={() => handlePreview(slider)} className="h-8 px-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleEdit(slider)} className="h-8 px-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                         
                          onClick={() => handleDelete(slider.id!)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Xem trước slider: {previewSlider?.title}</DialogTitle>
          </DialogHeader>
          {previewSlider && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewSlider.image || "/placeholder.svg"}
                  alt={previewSlider.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <h2 className="text-3xl font-bold mb-2">{previewSlider.title}</h2>
                    {previewSlider.description && <p className="text-lg mb-4">{previewSlider.description}</p>}
                    {previewSlider.buttonText && (
                      <Button variant="secondary" size="lg">
                        {previewSlider.buttonText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Loại:</strong> {(previewSlider as any).type || "Hero"}
                  </p>
                  <p>
                    <strong>Vị trí:</strong> {(previewSlider as any).position || "Top"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Thứ tự:</strong> {previewSlider.order}
                  </p>
                  <p>
                    <strong>Liên kết:</strong> {previewSlider.link || "Không có"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
