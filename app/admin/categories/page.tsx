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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, MoreHorizontal, Edit, Trash2, FolderOpen, Package } from "lucide-react"
import { FirebaseDB, type Category } from "@/lib/firebase-db"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/firebase-auth"

// Utility function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim()
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active" as "active" | "paused",
    display_order: 1,
  })
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = FirebaseDB.onCategoriesChange((updatedCategories) => {
      setCategories(updatedCategories.sort((a, b) => a.display_order - b.display_order))
      setLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (formData.name && !editingCategory) {
      const slug = generateSlug(formData.name)
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.name, editingCategory])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingCategory) {
        await FirebaseDB.updateCategory(
          editingCategory.id!,
          {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            status: formData.status,
            display_order: formData.display_order,
          },
          user?.uid || "admin",
        )
        toast({
          title: "Thành công",
          description: "Danh mục đã được cập nhật",
        })
      } else {
        const existingCategory = await FirebaseDB.getCategoryBySlug(formData.slug)
        if (existingCategory) {
          toast({
            title: "Lỗi",
            description: "Slug này đã tồn tại, vui lòng chọn slug khác",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        await FirebaseDB.addCategory(
          {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            status: formData.status,
            display_order: formData.display_order,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          user?.uid || "admin",
        )
        toast({
          title: "Thành công",
          description: "Danh mục mới đã được thêm",
        })
      }

      setIsDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: "", slug: "", description: "", status: "active", display_order: 1 })
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu danh mục",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      status: category.status,
      display_order: category.display_order,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return

    try {
      await FirebaseDB.deleteCategory(id, user?.uid || "admin")
      toast({
        title: "Thành công",
        description: "Danh mục đã được xóa",
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa danh mục",
        variant: "destructive",
      })
    }
  }

  const toggleStatus = async (id: string, currentStatus: "active" | "paused") => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active"
      await FirebaseDB.updateCategory(id, { status: newStatus }, user?.uid || "admin")
      toast({
        title: "Thành công",
        description: `Trạng thái danh mục đã được ${newStatus === "active" ? "kích hoạt" : "tạm dừng"}`,
      })
    } catch (error) {
      console.error("Error updating category status:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật trạng thái",
        variant: "destructive",
      })
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh mục...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Danh mục sản phẩm</h1>
          <p className="text-gray-600 mt-1">Quản lý danh mục và phân loại sản phẩm</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: "", slug: "", description: "", status: "active", display_order: 1 })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tên danh mục *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="VD: Tấm inox"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="tam-inox"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">URL thân thiện, chỉ chứa chữ thường, số và dấu gạch ngang</p>
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Mô tả về danh mục này"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="display_order">Thứ tự hiển thị *</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange("display_order", Number.parseInt(e.target.value))}
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  <option value="active">Hoạt động</option>
                  <option value="paused">Tạm dừng</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Đang lưu..." : editingCategory ? "Cập nhật" : "Thêm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng danh mục</p>
                <p className="text-xl sm:text-2xl font-bold">{categories.length}</p>
              </div>
              <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {categories.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tạm dừng</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {categories.filter((c) => c.status === "paused").length}
                </p>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Slug duy nhất</p>
                <p className="text-xl sm:text-2xl font-bold">{new Set(categories.map((c) => c.slug)).size}</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Tên danh mục</TableHead>
                  <TableHead className="min-w-[120px]">Slug</TableHead>
                  <TableHead className="min-w-[80px]">Thứ tự</TableHead>
                  <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                  <TableHead className="min-w-[100px]">Ngày tạo</TableHead>
                  <TableHead className="text-right min-w-[80px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{category.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                    </TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={category.status === "active"}
                          onCheckedChange={() => toggleStatus(category.id!, category.status)}
                         
                        />
                        <Badge
                          className={
                            category.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {category.status === "active" ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(category.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(category.id!)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {categories.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có danh mục nào</p>
              <p className="text-sm text-gray-400">Nhấn "Thêm danh mục" để tạo danh mục đầu tiên</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
