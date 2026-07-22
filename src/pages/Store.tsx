/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import { exportCsv, formatCurrency } from '../lib/reportUtils'
import type { AuthUser, Student } from '../types'

export type StoreView =
  | 'dashboard'
  | 'categories'
  | 'tax'
  | 'products'
  | 'inventory'
  | 'pos'
  | 'held'
  | 'orders'
  | 'sessions'
  | 'account-mapping'
  | 'reports'

type AnyRow = Record<string, any>

const today = () => new Date().toISOString().slice(0, 10)

const storeTabs: { id: StoreView; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'categories', label: 'Categories' },
  { id: 'tax', label: 'Tax Rates' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'pos', label: 'Point of Sale' },
  { id: 'held', label: 'Held Orders' },
  { id: 'orders', label: 'Sales History' },
  { id: 'sessions', label: 'Cashier Sessions' },
  { id: 'account-mapping', label: 'Account Mapping' },
  { id: 'reports', label: 'Reports' },
]

export function Store({
  currentUser,
  initialView = 'dashboard',
}: {
  currentUser: AuthUser
  initialView?: StoreView
}) {
  const [activeView, setActiveView] = useState<StoreView>(initialView)
  const [categories, setCategories] = useState<AnyRow[]>([])
  const [taxRates, setTaxRates] = useState<AnyRow[]>([])
  const [products, setProducts] = useState<AnyRow[]>([])
  const [orders, setOrders] = useState<AnyRow[]>([])
  const [ledger, setLedger] = useState<AnyRow[]>([])
  const [reports, setReports] = useState<AnyRow | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [accountCategories, setAccountCategories] = useState<AnyRow[]>([])
  const [accountMappings, setAccountMappings] = useState<AnyRow[]>([])
  const [currentSession, setCurrentSession] = useState<AnyRow | null>(null)
  const [posSessions, setPosSessions] = useState<AnyRow[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [taxForm, setTaxForm] = useState({ name: '', rate: '0' })
  const [productForm, setProductForm] = useState({
    categoryId: '',
    taxRateId: '',
    sku: '',
    barcode: '',
    name: '',
    description: '',
    price: '0',
    costPrice: '0',
    minimumStock: '0',
    status: 'Active',
  })
  const [stockForm, setStockForm] = useState({
    productId: '',
    transactionType: 'Opening Stock',
    quantity: '1',
    notes: '',
  })
  const [cart, setCart] = useState<AnyRow[]>([])
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [studentId, setStudentId] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [resumingOrderId, setResumingOrderId] = useState('')
  const [openingCash, setOpeningCash] = useState('0')
  const [countedCash, setCountedCash] = useState('0')
  const [sessionNotes, setSessionNotes] = useState('')

  const canManage = ['Owner', 'Admin', 'Accountant'].includes(currentUser.role)

  const load = async () => {
    setError('')
    try {
      const api = getErpApi()
      const [
        categoryRows,
        taxRows,
        productRows,
        orderRows,
        ledgerRows,
        reportRows,
        studentRows,
        categoryAccountRows,
        mappingRows,
        sessionRows,
        openSession,
      ] = await Promise.all([
        api.getStoreCategories(),
        api.getStoreTaxRates(),
        api.getStoreProducts({}),
        api.getStoreOrders({}),
        api.getStoreInventoryLedger({}),
        api.getStoreReports({}),
        api.getStudents(),
        canManage ? api.getAccountCategories() : Promise.resolve([]),
        api.getStoreAccountMappings(),
        api.getStorePosSessions({}),
        canManage ? api.getCurrentStorePosSession() : Promise.resolve(null),
      ])
      setCategories(categoryRows)
      setTaxRates(taxRows)
      setProducts(productRows)
      setOrders(orderRows)
      setLedger(ledgerRows)
      setReports(reportRows)
      setStudents(studentRows)
      setAccountCategories(categoryAccountRows)
      setAccountMappings(mappingRows)
      setPosSessions(sessionRows)
      setCurrentSession(openSession)
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveCategory = async () => {
    try {
      await getErpApi().saveStoreCategory({ ...categoryForm, status: 'Active' })
      setCategoryForm({ name: '', description: '' })
      setNotice('Category saved.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const saveTaxRate = async () => {
    try {
      await getErpApi().saveStoreTaxRate({
        ...taxForm,
        rate: Number(taxForm.rate),
        status: 'Active',
      })
      setTaxForm({ name: '', rate: '0' })
      setNotice('Tax rate saved.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const saveProduct = async () => {
    try {
      await getErpApi().saveStoreProduct({
        ...productForm,
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice),
        minimumStock: Number(productForm.minimumStock),
      })
      setProductForm({
        categoryId: '',
        taxRateId: '',
        sku: '',
        barcode: '',
        name: '',
        description: '',
        price: '0',
        costPrice: '0',
        minimumStock: '0',
        status: 'Active',
      })
      setNotice('Product saved.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const createStockTransaction = async () => {
    try {
      await getErpApi().createStoreInventoryTransaction({
        ...stockForm,
        quantity: Number(stockForm.quantity),
        transactionDate: today(),
      })
      setNotice('Stock transaction saved.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const addToCart = (product: AnyRow) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.price,
          taxRate: product.taxRate ?? 0,
          discountAmount: 0,
        },
      ]
    })
  }

  const cartTotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const taxable =
          item.quantity * item.unitPrice - Number(item.discountAmount ?? 0)
        return total + taxable + Math.round((taxable * Number(item.taxRate ?? 0)) / 100)
      }, 0),
    [cart],
  )

  const completeSale = async () => {
    try {
      if (!currentSession?.session?.id) {
        setError('Open a cashier session before completing a POS sale.')
        return
      }
      const payload = {
        customerName,
        studentId,
        posSessionId: currentSession.session.id,
        orderDate: today(),
        status: 'Completed',
        items: cart,
        payments: [{ paymentMode, amount: cartTotal, paymentDate: today() }],
      }
      if (resumingOrderId) {
        await getErpApi().resumeHeldStoreOrder(resumingOrderId, payload)
      } else {
        await getErpApi().createStoreOrder(payload)
      }
      setCart([])
      setResumingOrderId('')
      setNotice('Sale completed, stock updated and account entry posted.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const holdSale = async () => {
    try {
      await getErpApi().createStoreOrder({
        customerName,
        studentId,
        orderDate: today(),
        status: 'Held',
        items: cart,
        payments: [],
      })
      setCart([])
      setResumingOrderId('')
      setNotice('Sale held without stock or account posting.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const resumeHeldOrder = (order: AnyRow) => {
    setCart(
      (order.items ?? []).map((item: AnyRow) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate ?? 0,
        discountAmount: item.discountAmount ?? 0,
      })),
    )
    setCustomerName(order.customerName || 'Walk-in Customer')
    setStudentId(order.studentId || '')
    setResumingOrderId(order.id)
    setActiveView('pos')
    setNotice(`Resumed ${order.orderNo}. Review stock and collect payment before completion.`)
  }

  const cancelHeldOrder = async (order: AnyRow) => {
    const reason = window.prompt(`Reason for cancelling held order ${order.orderNo}`)
    if (!reason) return
    try {
      await getErpApi().cancelHeldStoreOrder(order.id, reason)
      setNotice('Held order cancelled without stock or accounting changes.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const openSession = async () => {
    try {
      await getErpApi().openStorePosSession({
        openingCash: Number(openingCash),
        notes: sessionNotes,
      })
      setOpeningCash('0')
      setSessionNotes('')
      setNotice('Cashier session opened.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const closeSession = async () => {
    if (!currentSession?.session?.id) return
    try {
      await getErpApi().closeStorePosSession(currentSession.session.id, {
        countedCash: Number(countedCash),
        notes: sessionNotes,
      })
      setCountedCash('0')
      setSessionNotes('')
      setNotice('Cashier session closed.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const saveAccountMapping = async (mapping: AnyRow, accountCategoryId: string) => {
    try {
      await getErpApi().saveStoreAccountMapping({
        mappingKey: mapping.mappingKey,
        accountCategoryId,
        status: 'Active',
      })
      setNotice('POS account mapping saved.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const reverseOrder = async (order: AnyRow) => {
    const reason = window.prompt(`Reason for reversing ${order.orderNo}`)
    if (!reason) return
    try {
      await getErpApi().reverseStoreOrder(order.id, reason)
      setNotice('Sale reversed and stock restored.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const categoryColumns: TableColumn<AnyRow>[] = [
    { key: 'name', header: 'Category', render: (row) => row.name },
    { key: 'description', header: 'Description', render: (row) => row.description || '--' },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.status}</span> },
  ]
  const taxColumns: TableColumn<AnyRow>[] = [
    { key: 'name', header: 'Tax Rate', render: (row) => row.name },
    { key: 'rate', header: 'Rate', render: (row) => `${row.rate}%` },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.status}</span> },
  ]
  const productColumns: TableColumn<AnyRow>[] = [
    { key: 'sku', header: 'SKU', render: (row) => row.sku || '--' },
    { key: 'name', header: 'Product', render: (row) => <span className="table-primary">{row.name}</span> },
    { key: 'category', header: 'Category', render: (row) => row.categoryName || '--' },
    { key: 'price', header: 'Price', render: (row) => formatCurrency(row.price) },
    { key: 'stock', header: 'Stock', render: (row) => row.currentStock },
    { key: 'minimum', header: 'Minimum', render: (row) => row.minimumStock },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.status}</span> },
    {
      key: 'add',
      header: 'POS',
      render: (row) => (
        <button className="secondary-button secondary-button--compact" type="button" onClick={() => addToCart(row)}>
          Add
        </button>
      ),
    },
  ]
  const orderColumns: TableColumn<AnyRow>[] = [
    { key: 'order', header: 'Order No', render: (row) => <span className="table-primary">{row.orderNo}</span> },
    { key: 'date', header: 'Date', render: (row) => row.orderDate },
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'total', header: 'Total', render: (row) => formatCurrency(row.grandTotal) },
    { key: 'paid', header: 'Paid', render: (row) => formatCurrency(row.paidAmount) },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.status}</span> },
    {
      key: 'reverse',
      header: 'Action',
      render: (row) =>
        row.status === 'Completed' && canManage ? (
          <button className="secondary-button secondary-button--compact" type="button" onClick={() => void reverseOrder(row)}>
            Reverse
          </button>
        ) : '--',
    },
  ]
  const heldOrderColumns: TableColumn<AnyRow>[] = [
    { key: 'order', header: 'Held No', render: (row) => <span className="table-primary">{row.orderNo}</span> },
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'items', header: 'Items', render: (row) => row.items?.length ?? 0 },
    { key: 'total', header: 'Total', render: (row) => formatCurrency(row.grandTotal) },
    { key: 'heldAt', header: 'Held At', render: (row) => row.heldAt || row.createdAt || '--' },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <div className="table-actions">
          <button className="secondary-button secondary-button--compact" type="button" onClick={() => resumeHeldOrder(row)}>Resume</button>
          <button className="secondary-button secondary-button--compact" type="button" onClick={() => void cancelHeldOrder(row)}>Cancel</button>
        </div>
      ),
    },
  ]
  const sessionColumns: TableColumn<AnyRow>[] = [
    { key: 'session', header: 'Session', render: (row) => <span className="table-primary">{row.session.sessionNo}</span> },
    { key: 'cashier', header: 'Cashier', render: (row) => row.session.cashierName || row.session.displayName || '--' },
    { key: 'opened', header: 'Opened', render: (row) => row.session.openedAt },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.session.status}</span> },
    { key: 'sales', header: 'Sales', render: (row) => formatCurrency(row.totalSales) },
    { key: 'cash', header: 'Cash', render: (row) => formatCurrency(row.cashCollected) },
    { key: 'expected', header: 'Expected Cash', render: (row) => formatCurrency(row.session.status === 'Closed' ? row.session.expectedCash : row.expectedCash) },
    { key: 'variance', header: 'Variance', render: (row) => formatCurrency(row.session.cashVariance ?? 0) },
  ]
  const mappingColumns: TableColumn<AnyRow>[] = [
    { key: 'label', header: 'Mapping', render: (row) => <span className="table-primary">{row.label}</span> },
    { key: 'type', header: 'Type', render: (row) => row.accountType },
    {
      key: 'category',
      header: 'Account Category',
      render: (row) => (
        <select
          disabled={!canManage}
          value={row.accountCategoryId || ''}
          onChange={(event) => void saveAccountMapping(row, event.target.value)}
        >
          <option value="">Select category</option>
          {row.accountCategoryId && !accountCategories.some((category) => category.id === row.accountCategoryId) && (
            <option value={row.accountCategoryId}>{row.accountCategoryName || 'Configured category'}</option>
          )}
          {accountCategories
            .filter((category) => category.type === row.accountType)
            .map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
        </select>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.status}</span> },
  ]
  const ledgerColumns: TableColumn<AnyRow>[] = [
    { key: 'date', header: 'Date', render: (row) => row.transactionDate },
    { key: 'product', header: 'Product', render: (row) => row.productName },
    { key: 'type', header: 'Type', render: (row) => row.transactionType },
    { key: 'qty', header: 'Qty', render: (row) => row.quantity },
    { key: 'stock', header: 'Stock After', render: (row) => row.stockAfter },
    { key: 'notes', header: 'Notes', render: (row) => row.notes || '--' },
  ]

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>School Store & POS</h2>
          <p>Manage products, inventory and offline point-of-sale orders.</p>
        </div>
      </section>

      <nav className="report-tabs" aria-label="Store sections">
        {storeTabs.map((tab) => (
          <button
            className={`report-tab${activeView === tab.id ? ' report-tab--active' : ''}`}
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && <div className="inline-message inline-message--error"><Icon name="close" size={17} /><span>{error}</span></div>}
      {notice && <div className="inline-message"><Icon name="check" size={17} /><span>{notice}</span></div>}

      {activeView === 'dashboard' && (
        <section className="panel">
          <div className="report-summary-grid">
            <div className="report-summary-card"><span>Products</span><strong>{products.length}</strong></div>
            <div className="report-summary-card"><span>Orders</span><strong>{orders.length}</strong></div>
            <div className="report-summary-card"><span>Stock Valuation</span><strong>{formatCurrency(reports?.stockValuation ?? 0)}</strong></div>
            <div className="report-summary-card"><span>Low Stock</span><strong>{reports?.lowStock?.length ?? 0}</strong></div>
            <div className="report-summary-card"><span>Cashier Session</span><strong>{currentSession ? 'Open' : 'Closed'}</strong></div>
            <div className="report-summary-card"><span>Held Orders</span><strong>{orders.filter((order) => order.status === 'Held').length}</strong></div>
          </div>
        </section>
      )}

      {activeView === 'categories' && (
        <section className="panel">
          {canManage && (
            <div className="report-filter-fields">
              <label className="form-field"><span>Name</span><input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></label>
              <label className="form-field"><span>Description</span><input value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} /></label>
              <button className="primary-button" type="button" onClick={() => void saveCategory()}><Icon name="check" size={16} />Save</button>
            </div>
          )}
          <DataTable columns={categoryColumns} rows={categories} getRowKey={(row) => row.id} emptyMessage="No product categories." />
        </section>
      )}

      {activeView === 'tax' && (
        <section className="panel">
          {canManage && (
            <div className="report-filter-fields">
              <label className="form-field"><span>Name</span><input value={taxForm.name} onChange={(event) => setTaxForm({ ...taxForm, name: event.target.value })} /></label>
              <label className="form-field"><span>Rate %</span><input type="number" value={taxForm.rate} onChange={(event) => setTaxForm({ ...taxForm, rate: event.target.value })} /></label>
              <button className="primary-button" type="button" onClick={() => void saveTaxRate()}><Icon name="check" size={16} />Save</button>
            </div>
          )}
          <DataTable columns={taxColumns} rows={taxRates} getRowKey={(row) => row.id} emptyMessage="No tax rates." />
        </section>
      )}

      {activeView === 'products' && (
        <section className="panel">
          {canManage && (
            <div className="report-filter-fields">
              <label className="form-field"><span>Category</span><select value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}><option value="">No category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="form-field"><span>Tax</span><select value={productForm.taxRateId} onChange={(event) => setProductForm({ ...productForm, taxRateId: event.target.value })}><option value="">No tax</option>{taxRates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="form-field"><span>SKU</span><input value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} /></label>
              <label className="form-field"><span>Name</span><input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
              <label className="form-field"><span>Price</span><input type="number" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></label>
              <label className="form-field"><span>Cost</span><input type="number" value={productForm.costPrice} onChange={(event) => setProductForm({ ...productForm, costPrice: event.target.value })} /></label>
              <label className="form-field"><span>Minimum Stock</span><input type="number" value={productForm.minimumStock} onChange={(event) => setProductForm({ ...productForm, minimumStock: event.target.value })} /></label>
              <button className="primary-button" type="button" onClick={() => void saveProduct()}><Icon name="check" size={16} />Save Product</button>
            </div>
          )}
          <DataTable columns={productColumns} rows={products} getRowKey={(row) => row.id} emptyMessage="No store products." />
        </section>
      )}

      {activeView === 'inventory' && (
        <section className="panel">
          {canManage && (
            <div className="report-filter-fields">
              <label className="form-field"><span>Product</span><select value={stockForm.productId} onChange={(event) => setStockForm({ ...stockForm, productId: event.target.value })}><option value="">Select product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="form-field"><span>Type</span><select value={stockForm.transactionType} onChange={(event) => setStockForm({ ...stockForm, transactionType: event.target.value })}><option>Opening Stock</option><option>Purchase</option><option>Stock In</option><option>Return</option><option>Adjustment Increase</option><option>Adjustment Decrease</option><option>Damage</option></select></label>
              <label className="form-field"><span>Quantity</span><input type="number" value={stockForm.quantity} onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })} /></label>
              <label className="form-field"><span>Notes</span><input value={stockForm.notes} onChange={(event) => setStockForm({ ...stockForm, notes: event.target.value })} /></label>
              <button className="primary-button" type="button" onClick={() => void createStockTransaction()}><Icon name="check" size={16} />Save Stock</button>
            </div>
          )}
          <DataTable columns={ledgerColumns} rows={ledger} getRowKey={(row) => row.id} emptyMessage="No stock ledger rows." />
        </section>
      )}

      {activeView === 'pos' && (
        <section className="panel">
          <div className="report-toolbar">
            <div>
              <strong>{resumingOrderId ? 'Resume Held Sale' : 'Point of Sale'}</strong>
              <span>
                {currentSession
                  ? `Open session ${currentSession.session.sessionNo} · Expected cash ${formatCurrency(currentSession.expectedCash)}`
                  : 'Open a cashier session before completing a sale.'}
              </span>
            </div>
            <button className="secondary-button" type="button" onClick={() => setActiveView('sessions')}>
              <Icon name="settings" size={16} />Cashier Session
            </button>
          </div>
          <div className="report-filter-fields">
            <label className="form-field"><span>Customer</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
            <label className="form-field"><span>Student</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">Walk-in</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.admissionNo})</option>)}</select></label>
            <label className="form-field"><span>Payment</span><select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}><option>Cash</option><option>Manual UPI</option><option>Manual Card</option></select></label>
          </div>
          <DataTable
            columns={[
              { key: 'product', header: 'Product', render: (row) => row.productName },
              { key: 'qty', header: 'Qty', render: (row) => <input type="number" min={1} value={row.quantity} onChange={(event) => setCart((current) => current.map((item) => item.productId === row.productId ? { ...item, quantity: Number(event.target.value) } : item))} /> },
              { key: 'price', header: 'Price', render: (row) => formatCurrency(row.unitPrice) },
              { key: 'total', header: 'Total', render: (row) => formatCurrency(row.quantity * row.unitPrice - Number(row.discountAmount ?? 0)) },
            ]}
            rows={cart}
            getRowKey={(row) => row.productId}
            emptyMessage="Add products from the Products tab to start a sale."
          />
          <div className="report-toolbar">
            <div><strong>Total: {formatCurrency(cartTotal)}</strong><span>Completed sale deducts stock once.</span></div>
            <div className="report-actions">
              <button className="secondary-button" disabled={cart.length === 0 || !canManage || Boolean(resumingOrderId)} type="button" onClick={() => void holdSale()}><Icon name="clock" size={16} />Hold Sale</button>
              {resumingOrderId && <button className="secondary-button" type="button" onClick={() => { setCart([]); setResumingOrderId('') }}>Clear Resume</button>}
              <button className="primary-button" disabled={cart.length === 0 || !canManage || !currentSession} type="button" onClick={() => void completeSale()}><Icon name="check" size={16} />Complete Sale</button>
            </div>
          </div>
        </section>
      )}

      {activeView === 'held' && (
        <section className="panel">
          <div className="report-toolbar">
            <div><strong>Held Orders</strong><span>Held orders do not deduct stock, post accounts or issue final receipts.</span></div>
            <button className="secondary-button" type="button" onClick={() => exportCsv('held-pos-orders.csv', ['Order No', 'Customer', 'Total', 'Held At'], orders.filter((row) => row.status === 'Held').map((row) => [row.orderNo, row.customerName, row.grandTotal, row.heldAt || row.createdAt]))}><Icon name="download" size={16} />Export CSV</button>
          </div>
          <DataTable columns={heldOrderColumns} rows={orders.filter((row) => row.status === 'Held')} getRowKey={(row) => row.id} emptyMessage="No held POS orders." />
        </section>
      )}

      {activeView === 'orders' && (
        <section className="panel">
          <DataTable columns={orderColumns} rows={orders} getRowKey={(row) => row.id} emptyMessage="No POS orders." />
        </section>
      )}

      {activeView === 'sessions' && (
        <section className="panel">
          <div className="report-toolbar">
            <div>
              <strong>Cashier Sessions</strong>
              <span>{currentSession ? `Current session ${currentSession.session.sessionNo}` : 'No open session for current user.'}</span>
            </div>
            <div className="report-actions">
              <button className="secondary-button" type="button" onClick={() => exportCsv('store-pos-sessions.csv', ['Session', 'Cashier', 'Opened', 'Closed', 'Status', 'Sales', 'Cash', 'Expected', 'Variance'], posSessions.map((row) => [row.session.sessionNo, row.session.cashierName, row.session.openedAt, row.session.closedAt, row.session.status, row.totalSales, row.cashCollected, row.session.status === 'Closed' ? row.session.expectedCash : row.expectedCash, row.session.cashVariance]))}><Icon name="download" size={16} />Export CSV</button>
              <button className="primary-button" type="button" onClick={() => window.print()}><Icon name="print" size={16} />Print</button>
            </div>
          </div>
          {canManage && (
            <div className="report-filter-fields">
              {!currentSession && (
                <>
                  <label className="form-field"><span>Opening Cash</span><input type="number" value={openingCash} onChange={(event) => setOpeningCash(event.target.value)} /></label>
                  <label className="form-field"><span>Notes</span><input value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} /></label>
                  <button className="primary-button" type="button" onClick={() => void openSession()}><Icon name="check" size={16} />Open Session</button>
                </>
              )}
              {currentSession && (
                <>
                  <label className="form-field"><span>Counted Cash</span><input type="number" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} /></label>
                  <label className="form-field"><span>Close Notes</span><input value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} /></label>
                  <div className="report-summary-card"><span>Expected Cash</span><strong>{formatCurrency(currentSession.expectedCash)}</strong></div>
                  <button className="primary-button" type="button" onClick={() => void closeSession()}><Icon name="check" size={16} />Close Session</button>
                </>
              )}
            </div>
          )}
          <DataTable columns={sessionColumns} rows={posSessions} getRowKey={(row) => row.session.id} emptyMessage="No cashier sessions." />
        </section>
      )}

      {activeView === 'account-mapping' && (
        <section className="panel">
          <div className="report-toolbar">
            <div>
              <strong>POS Account Mapping</strong>
              <span>Completed sales post income and reversals post expense through these active account categories.</span>
            </div>
          </div>
          <DataTable columns={mappingColumns} rows={accountMappings} getRowKey={(row) => row.mappingKey} emptyMessage="No POS account mappings." />
        </section>
      )}

      {activeView === 'reports' && (
        <section className="panel report-print-area">
          <div className="report-toolbar">
            <div><strong>Store Reports</strong><span>Sales, payment mode and stock reports.</span></div>
            <div className="report-actions">
              <button className="secondary-button" type="button" onClick={() => exportCsv('store-orders.csv', ['Order No', 'Date', 'Customer', 'Total', 'Paid', 'Status'], orders.map((row) => [row.orderNo, row.orderDate, row.customerName, row.grandTotal, row.paidAmount, row.status]))}><Icon name="download" size={16} />Export CSV</button>
              <button className="primary-button" type="button" onClick={() => window.print()}><Icon name="print" size={16} />Print</button>
            </div>
          </div>
          <div className="report-summary-grid">
            {(reports?.paymentSummary ?? []).map((row: AnyRow) => <div className="report-summary-card" key={row.paymentMode}><span>{row.paymentMode}</span><strong>{formatCurrency(row.amount)}</strong></div>)}
          </div>
          <DataTable columns={productColumns.slice(0, 6)} rows={reports?.lowStock ?? []} getRowKey={(row) => row.id} emptyMessage="No low-stock products." />
        </section>
      )}
    </div>
  )
}
