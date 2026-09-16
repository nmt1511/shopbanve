"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, AlertTriangle, BarChart3, Calendar, Clock, Eye, MessageSquare, Newspaper, Package, Settings, TrendingUp, UserPlus } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FirebaseDB, type ActivityLog, type Agent, type Contact, type NewsArticle, type Product } from "@/lib/firebase-db"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { Drawing, PurchaseInquiry, ShopArticle } from "@/lib/shopbanve/types"

interface DashboardStats {
  products: Product[]
  news: NewsArticle[]
  contacts: Contact[]
  agents: Agent[]
  logs: ActivityLog[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ products: [], news: [], contacts: [], agents: [], logs: [] })
  const [loading, setLoading] = useState(true)
  const [shopStats, setShopStats] = useState<{ drawings: Drawing[]; articles: ShopArticle[]; inquiries: PurchaseInquiry[] }>({ drawings: [], articles: [], inquiries: [] })

  useEffect(() => {
    let active = true
    const loadDashboardData = async () => {
      try {
        const [products, news, contacts, agents, drawings, articles, inquiries] = await Promise.all([
          FirebaseDB.getProducts(), FirebaseDB.getNews(), FirebaseDB.getContacts(), FirebaseDB.getAgents(),
          ShopBanVeRepository.getDrawings(), ShopBanVeRepository.getArticles(), ShopBanVeRepository.getPurchaseInquiries(),
        ])
        if (!active) return
        setShopStats({ drawings, articles, inquiries })
        setStats({ products, news, contacts, agents, logs: [] })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardData()
    const unsubscribe = FirebaseDB.onActivityLogsChange((logs) => {
      if (active) setStats((previous) => ({ ...previous, logs }))
    })
    return () => { active = false; unsubscribe() }
  }, [])

  const totalProducts = stats.products.length
  const activeProducts = stats.products.filter((product) => product.status === "active").length
  const outOfStockProducts = stats.products.filter((product) => product.stock === 0).length
  const totalNews = stats.news.length
  const publishedNews = stats.news.filter((article) => article.status === "published").length
  const totalViews = stats.news.reduce((sum, article) => sum + (article.view_count || 0), 0)
  const totalContacts = stats.contacts.length
  const unreadContacts = stats.contacts.filter((contact) => contact.status === "new").length
  const urgentContacts = stats.contacts.filter((contact) => contact.priority === "high").length
  const totalAgents = stats.agents.length
  const approvedAgents = stats.agents.filter((agent) => agent.status === "approved").length
  const recentLogs = stats.logs.slice(0, 10)

  const productCategoryData = stats.products.reduce<Record<string, number>>((accumulator, product) => {
    const category = product.category || "Khác"
    accumulator[category] = (accumulator[category] || 0) + 1
    return accumulator
  }, {})
  const pieChartData = Object.entries(productCategoryData).map(([name, value]) => ({ name, value }))
  const contactStatusData = [
    { name: "Mới", value: stats.contacts.filter((contact) => contact.status === "new").length },
    { name: "Đang xử lý", value: stats.contacts.filter((contact) => contact.status === "processing").length },
    { name: "Đã phản hồi", value: stats.contacts.filter((contact) => contact.status === "replied").length },
    { name: "Đã đóng", value: stats.contacts.filter((contact) => contact.status === "closed").length },
  ]
  const activityData = recentLogs.slice(0, 7).reverse().map((log, index) => ({
    name: `${index + 1}`,
    date: new Date(log.created_at).toLocaleDateString("vi-VN"),
    errors: log.level === "Error" ? 1 : 0,
    success: log.level === "Success" ? 1 : 0,
  }))
  const monthlyNewsData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    const monthNews = stats.news.filter((article) => {
      const articleDate = new Date(article.created_at)
      return articleDate.getMonth() === date.getMonth() && articleDate.getFullYear() === date.getFullYear()
    })
    return { month: date.toLocaleDateString("vi-VN", { month: "short" }), articles: monthNews.length, views: monthNews.reduce((sum, article) => sum + (article.view_count || 0), 0) }
  }).reverse()

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /><p className="text-gray-600">Đang tải dashboard...</p></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1><p className="text-gray-600">Tổng quan hệ thống quản lý website</p></div><div className="flex items-center gap-2 text-sm text-gray-500"><Calendar className="h-4 w-4" />{new Date().toLocaleDateString("vi-VN")}</div></div>
      <section className="rounded-xl border border-orange-200 bg-orange-50 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Shop Bản Vẽ</p><h2 className="mt-1 text-xl font-bold text-slate-900">Tổng quan nội dung và yêu cầu mua</h2></div><Link href="/admin/drawings" className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white">Mở thư viện tài liệu</Link></div><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><Link href="/admin/drawings" className="rounded-lg bg-white p-4"><p className="text-sm text-slate-500">Tài liệu</p><p className="mt-1 text-2xl font-bold">{shopStats.drawings.length}</p></Link><Link href="/admin/articles" className="rounded-lg bg-white p-4"><p className="text-sm text-slate-500">Bài viết</p><p className="mt-1 text-2xl font-bold">{shopStats.articles.length}</p></Link><Link href="/admin/purchase-inquiries" className="rounded-lg bg-white p-4"><p className="text-sm text-slate-500">Yêu cầu chưa đóng</p><p className="mt-1 text-2xl font-bold">{shopStats.inquiries.filter((item) => item.status !== "closed" && item.status !== "spam").length}</p></Link></div></section>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{[["Tổng tài liệu", totalProducts, `${activeProducts} đang hoạt động`, Package], ["Bài viết & dự án", totalNews, `${publishedNews} đã xuất bản`, Newspaper], ["Liên hệ", totalContacts, `${unreadContacts} chưa đọc`, MessageSquare], ["Đại lý", totalAgents, `${approvedAgents} đã duyệt`, UserPlus]].map(([label, value, note, Icon]) => { const MetricIcon = Icon as typeof Package; return <Card key={label as string}><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{label as string}</p><p className="mt-2 text-2xl font-bold">{value as number}</p><p className="text-xs text-green-600">{note as string}</p></div><div className="rounded-full bg-blue-500 p-2"><MetricIcon className="h-5 w-5 text-white" /></div></div></CardContent></Card> })}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"><Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Tổng lượt xem</p><p className="text-2xl font-bold">{totalViews.toLocaleString("vi-VN")}</p></div><Eye className="h-8 w-8 text-blue-500" /></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Hết hàng</p><p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Liên hệ khẩn cấp</p><p className="text-2xl font-bold text-orange-600">{urgentContacts}</p></div><Clock className="h-8 w-8 text-orange-500" /></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Hoạt động gần đây</p><p className="text-2xl font-bold">{recentLogs.length}</p></div><Activity className="h-8 w-8 text-green-500" /></div></CardContent></Card></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Phân bố sản phẩm theo danh mục</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">{pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Trạng thái liên hệ</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={contactStatusData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#8884d8" /></BarChart></ResponsiveContainer></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Xu hướng bài viết 6 tháng</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={monthlyNewsData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="articles" stroke="#8884d8" name="Bài viết" /><Line type="monotone" dataKey="views" stroke="#82ca9d" name="Lượt xem" /></LineChart></ResponsiveContainer></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Hoạt động hệ thống</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><AreaChart data={activityData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Area type="monotone" dataKey="success" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Thành công" /><Area type="monotone" dataKey="errors" stackId="1" stroke="#ff7c7c" fill="#ff7c7c" name="Lỗi" /></AreaChart></ResponsiveContainer></CardContent></Card></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Hoạt động gần đây</CardTitle></CardHeader><CardContent><div className="space-y-4">{recentLogs.length === 0 ? <p className="py-4 text-center text-gray-500">Chưa có hoạt động nào</p> : recentLogs.map((log) => <div key={log.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-blue-500" /><div><p className="font-medium">{log.action}</p><p className="text-sm text-gray-500">{log.details}</p></div></div><div className="text-right"><Badge variant={log.level === "Error" ? "destructive" : "secondary"}>{log.level}</Badge><p className="mt-1 text-xs text-gray-500">{new Date(log.created_at).toLocaleString("vi-VN")}</p></div></div>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Thao tác nhanh</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4 md:grid-cols-4"><Button variant="outline" asChild className="h-20 flex-col bg-transparent"><Link href="/admin/drawings/new"><Package className="mb-2 h-6 w-6" />Thêm tài liệu</Link></Button><Button variant="outline" asChild className="h-20 flex-col bg-transparent"><Link href="/admin/articles/new"><Newspaper className="mb-2 h-6 w-6" />Viết bài mới</Link></Button><Button variant="outline" asChild className="h-20 flex-col bg-transparent"><Link href="/admin/purchase-inquiries"><MessageSquare className="mb-2 h-6 w-6" />Yêu cầu mua</Link></Button><Button variant="outline" asChild className="h-20 flex-col bg-transparent"><Link href="/admin/shop-settings"><Settings className="mb-2 h-6 w-6" />Cấu hình thư viện</Link></Button></div></CardContent></Card>
    </div>
  )
}
