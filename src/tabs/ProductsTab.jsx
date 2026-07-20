import { useEffect, useState } from 'react';
import { adminApi } from '../api/index.js';
import { AddProductModal } from '../components/AddProductModal.jsx';

export function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.getProducts(), adminApi.getCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleProductsCreated = (created) => {
    setProducts((prev) => [
      ...created.map((p) => ({
        ...p,
        category_name: categories.find((c) => c.vstitch_category_id === p.category_id)?.category_name || null,
      })),
      ...prev,
    ]);
  };

  const handleCategoriesChanged = (category) => {
    setCategories((prev) => (prev.some((c) => c.vstitch_category_id === category.vstitch_category_id) ? prev : [...prev, category]));
  };

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm flex items-center justify-between">
          {error}
          <button onClick={load} className="underline text-xs">Retry</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-[#8A8375]">{loading ? "Loading…" : `${products.length} products in catalogue`}</div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E]"
        >
          + Add Product
        </button>
      </div>
      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2620] text-left text-[11px] uppercase tracking-[0.1em] text-[#8A8375]">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#8A8375]">Loading products…</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#8A8375]">No products yet. Click "+ Add Product" to create one.</td></tr>
            )}
            {!loading && products.map((p, i) => {
              const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
              const skus = p.variants.map((v) => v.sku).join(", ");
              const displayPrice = p.variants[0]?.price ?? p.base_price;
              const status = !p.is_active ? "Draft" : totalStock === 0 ? "Out of stock" : "Published";
              return (
                <tr key={p.vstitch_product_id} className={i !== products.length - 1 ? "border-b border-[#221E17]" : ""}>
                  <td className="px-5 py-4 text-[#EDE7DD]">{p.product_name}</td>
                  <td className="px-5 py-4 text-[#B8B2A3]">{p.category_name || "—"}</td>
                  <td className="px-5 py-4 text-[#B8B2A3]">{skus}</td>
                  <td className={`px-5 py-4 ${totalStock === 0 ? "text-[#E0716A]" : totalStock < 5 ? "text-[#D9A441]" : "text-[#EDE7DD]"}`}>{totalStock}</td>
                  <td className="px-5 py-4 text-[#EDE7DD]">₹{displayPrice.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs border ${
                      status === "Published" ? "bg-[#1F3A24] text-[#6FCF7A] border-[#2A5E36]" :
                      status === "Out of stock" ? "bg-[#3A1F1F] text-[#E0716A] border-[#5E2A2A]" :
                      "bg-[#2A2620] text-[#B8B2A3] border-[#3A3428]"
                    }`}>{status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        onCategoriesChanged={handleCategoriesChanged}
        onProductsCreated={handleProductsCreated}
      />
    </div>
  );
}
