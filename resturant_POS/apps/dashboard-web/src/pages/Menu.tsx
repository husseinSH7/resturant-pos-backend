import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, X, ImageIcon, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '../services/api'

interface Category {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  isActive: boolean
  imageUrl: string | null
}

export default function Menu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [showCategories, setShowCategories] = useState(true)

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: 0, isActive: true })
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    isActive: true,
    imageFile: null as File | null,
  })

  // Loading states for buttons
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load data once
  const loadData = useCallback(async () => {
    try {
      setError('')
      const [categoriesRes, productsRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu/products'),
      ])
      const normalizeCategories = (data: any[]) =>
        data.map((c) => ({ ...c, isActive: c.isActive ?? c.active ?? true }))
      const normalizeProducts = (data: any[]) =>
        data.map((p) => ({ ...p, isActive: p.isActive ?? p.active ?? true }))

      setCategories(normalizeCategories(categoriesRes.data))
      setProducts(normalizeProducts(productsRes.data))
    } catch (err: any) {
      console.error('Failed to load menu data', err)
      setError('Could not load menu. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------- Category handlers ----------
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingCategory(true)
    try {
      const res = await api.post('/menu/categories', categoryForm)
      setCategories(prev => [...prev, { ...res.data, isActive: res.data.isActive ?? true }])
      setShowCategoryModal(false)
      resetCategoryForm()
      loadData()
    } catch (err: any) {
      setError('Failed to add category: ' + (err?.response?.data?.message || err.message))
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    setIsSubmittingCategory(true)
    try {
      const res = await api.put(`/menu/categories/${editingCategory.id}`, categoryForm)
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...res.data } : c))
      setShowCategoryModal(false)
      resetCategoryForm()
      loadData()
    } catch (err: any) {
      setError('Failed to update category: ' + (err?.response?.data?.message || err.message))
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its products?')) return
    setDeletingCategoryId(id)
    try {
      await api.delete(`/menu/categories/${id}`)
      setCategories(prev => prev.filter(c => c.id !== id))
      setProducts(prev => prev.filter(p => p.categoryId !== id))
      loadData()
    } catch (err: any) {
      setError('Failed to delete category: ' + (err?.response?.data?.message || err.message))
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', sortOrder: 0, isActive: true })
    setEditingCategory(null)
    setError('')
  }

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({ name: category.name, sortOrder: category.sortOrder, isActive: category.isActive })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', sortOrder: 0, isActive: true })
    }
    setError('')
    setShowCategoryModal(true)
  }

  // ---------- Product handlers ----------
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingProduct(true)
    try {
      const { imageFile, ...productData } = productForm
      const res = await api.post('/menu/products', productData)
      const newProduct = { ...res.data, isActive: res.data.isActive ?? true }

      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        await api.post(`/menu/products/${newProduct.id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const imgRes = await api.get(`/menu/products/${newProduct.id}`)
        newProduct.imageUrl = imgRes.data.imageUrl
      }

      setProducts(prev => [...prev, newProduct])
      setShowProductModal(false)
      resetProductForm()
      loadData()
    } catch (err: any) {
      setError('Failed to add product: ' + (err?.response?.data?.message || err.message))
    } finally {
      setIsSubmittingProduct(false)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setIsSubmittingProduct(true)
    try {
      const { imageFile, ...productData } = productForm
      const res = await api.put(`/menu/products/${editingProduct.id}`, productData)
      const updatedProduct = { ...editingProduct, ...res.data }

      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        await api.post(`/menu/products/${editingProduct.id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const imgRes = await api.get(`/menu/products/${editingProduct.id}`)
        updatedProduct.imageUrl = imgRes.data.imageUrl
      }

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p))
      setShowProductModal(false)
      resetProductForm()
      loadData()
    } catch (err: any) {
      setError('Failed to update product: ' + (err?.response?.data?.message || err.message))
    } finally {
      setIsSubmittingProduct(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setDeletingProductId(id)
    try {
      await api.delete(`/menu/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
      loadData()
    } catch (err: any) {
      setError('Failed to delete product: ' + (err?.response?.data?.message || err.message))
    } finally {
      setDeletingProductId(null)
    }
  }

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      categoryId: categories[0]?.id || '',
      isActive: true,
      imageFile: null,
    })
    setEditingProduct(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        categoryId: product.categoryId,
        isActive: product.isActive,
        imageFile: null,
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        description: '',
        price: 0,
        categoryId: categories[0]?.id || '',
        isActive: true,
        imageFile: null,
      })
    }
    setError('')
    setShowProductModal(true)
  }

  // ---------- Render ----------
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Menu Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your restaurant menu items and categories</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            <Plus className="h-5 w-5" /> Add Category
          </button>
          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30"
          >
            <Plus className="h-5 w-5" /> Add Product
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowCategories(!showCategories)}
          className="w-full flex items-center justify-between px-6 py-3 bg-gray-700/50 hover:bg-gray-700 transition"
        >
          <span className="font-medium text-gray-300">Categories</span>
          {showCategories ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
        </button>
        {showCategories && (
          <div className="p-4">
            {categories.length === 0 ? (
              <p className="text-gray-400 text-sm">No categories yet. Add one above.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:bg-gray-700/50">
                    <div>
                      <span className="font-medium text-white">{c.name}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        c.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">Order: {c.sortOrder}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openCategoryModal(c)}
                        className="p-1 text-blue-400 hover:bg-blue-900/30 rounded"
                        disabled={deletingCategoryId === c.id}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-1 text-red-400 hover:bg-red-900/30 rounded disabled:opacity-50"
                        disabled={deletingCategoryId === c.id}
                      >
                        {deletingCategoryId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredProducts.map(p => {
                const category = categories.find(c => c.id === p.categoryId)
                return (
                  <tr key={p.id} className="hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-700 flex items-center justify-center text-gray-500">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-sm text-gray-400">{p.description || 'No description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        p.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => openProductModal(p)}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-900/30"
                        disabled={deletingProductId === p.id}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30 disabled:opacity-50"
                        disabled={deletingProductId === p.id}
                      >
                        {deletingProductId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button
                onClick={() => { setShowCategoryModal(false); resetCategoryForm() }}
                className="p-1 hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Category Name</label>
                  <input
                    value={categoryForm.name}
                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Sort Order</label>
                  <input
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={e => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={categoryForm.isActive}
                    onChange={e => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="catActive" className="text-sm font-medium text-gray-300">Active</label>
                </div>
              </div>
              {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCategoryModal(false); resetCategoryForm() }}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingCategory && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmittingCategory ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button
                onClick={() => { setShowProductModal(false); resetProductForm() }}
                className="p-1 hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Category</label>
                    <select
                      value={productForm.categoryId}
                      onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Product Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null
                        setProductForm({ ...productForm, imageFile: file })
                      }}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-900/30 file:text-orange-400 hover:file:bg-orange-800/30 bg-gray-700 border border-gray-600 rounded-lg"
                    />
                    {editingProduct?.imageUrl && (
                      <img src={editingProduct.imageUrl} alt="current" className="h-10 w-10 rounded object-cover" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingProduct?.imageUrl ? 'Upload a new image to replace the current one.' : 'Select an image to upload.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prodActive"
                    checked={productForm.isActive}
                    onChange={e => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="prodActive" className="text-sm font-medium text-gray-300">Active</label>
                </div>
              </div>
              {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowProductModal(false); resetProductForm() }}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmittingProduct ? 'Saving...' : (editingProduct ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}