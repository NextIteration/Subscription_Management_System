import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { Product, ProductVariant } from '../../types';
import { Package, Plus, Edit2, Trash2, Layers, DollarSign, Tag, Info } from 'lucide-react';

export const ProductList: React.FC = () => {
  const { products, addProduct, updateProduct, archiveProduct } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<Product['type']>('Software License');
  const [salesPrice, setSalesPrice] = useState(499);
  const [costPrice, setCostPrice] = useState(95);
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setType('Software License');
    setSalesPrice(499);
    setCostPrice(95);
    setNotes('');
    setVariants([
      { id: `var-${Date.now()}-1`, name: 'Standard Edition', sku: 'BL-STD', priceAdjustment: 0 },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setType(p.type);
    setSalesPrice(p.salesPrice);
    setCostPrice(p.costPrice);
    setNotes(p.notes);
    setVariants(p.variants);
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    const newV: ProductVariant = {
      id: `var-${Date.now()}-${variants.length + 1}`,
      name: 'New Tier Variant',
      sku: `BL-VAR-${variants.length + 1}`,
      priceAdjustment: 100,
    };
    setVariants([...variants, newV]);
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        type,
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice),
        notes,
        variants,
      });
    } else {
      addProduct({
        name,
        type,
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice),
        notes,
        status: 'active',
        variants,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Product Management"
        subtitle="Configure software platform tiers, cloud compute services, API allocations, and variant price adjustments."
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-[#0e1013]">Product Catalog</h3>
          <p className="text-xs text-[#526071]">{products.length} live software SKUs and services</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-5 rounded-full transition shadow-xs"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between hover:bg-[#c9dbe7] transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white/70 px-2.5 py-1 rounded-full">
                    {product.type}
                  </span>
                  <h4 className="text-lg font-extrabold text-[#0e1013] mt-2 tracking-tight">
                    {product.name}
                  </h4>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="p-1.5 rounded-full hover:bg-white text-neutral-600 hover:text-neutral-900 transition"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => archiveProduct(product.id)}
                    className="p-1.5 rounded-full hover:bg-rose-100 text-neutral-400 hover:text-rose-600 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                {product.notes}
              </p>

              {/* Price Details */}
              <div className="mt-4 flex items-center space-x-4 bg-white/60 p-3 rounded-2xl">
                <div>
                  <span className="text-[10px] text-[#526071] font-semibold block">Base Sales Price</span>
                  <span className="text-base font-extrabold text-[#0e1013]">
                    ${product.salesPrice.toFixed(2)}
                  </span>
                </div>
                <div className="border-l border-[rgba(160,190,215,0.4)] pl-4">
                  <span className="text-[10px] text-[#526071] font-semibold block">Unit Cost Price</span>
                  <span className="text-base font-extrabold text-[#64748b]">
                    ${product.costPrice.toFixed(2)}
                  </span>
                </div>
                <div className="border-l border-[rgba(160,190,215,0.4)] pl-4">
                  <span className="text-[10px] text-[#526071] font-semibold block">Estimated Margin</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {Math.round(((product.salesPrice - product.costPrice) / product.salesPrice) * 100)}%
                  </span>
                </div>
              </div>

              {/* Variants Section */}
              <div className="mt-4">
                <span className="text-[11px] font-bold text-[#0e1013] block mb-1.5">
                  Configured Variants & Price Deltas ({product.variants.length})
                </span>
                <div className="space-y-1.5">
                  {product.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between bg-white/70 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#0e1013]">{v.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono ml-2">[{v.sku}]</span>
                      </div>
                      <span className="font-mono font-bold text-sky-900">
                        {v.priceAdjustment > 0
                          ? `+$${v.priceAdjustment}`
                          : v.priceAdjustment === 0
                          ? 'Included'
                          : `-$${Math.abs(v.priceAdjustment)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Specify product attributes, pricing, notes, and SKU tier variants."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              placeholder="e.g. Real-time Telemetry Gateway"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Product Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Product['type'])}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              >
                <option value="Software License">Software License</option>
                <option value="Cloud Service">Cloud Service</option>
                <option value="API Access">API Access</option>
                <option value="Support & Service">Support & Service</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Sales Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={salesPrice}
                onChange={(e) => setSalesPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Notes & Functional Specs</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              placeholder="Operational details, licensing terms, SLA specifications..."
            />
          </div>

          {/* Variants section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-[#0e1013]">Product Variants & Adjustments</label>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-xs font-bold text-sky-800 hover:underline flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {variants.map((v, idx) => (
                <div key={v.id} className="flex items-center space-x-2 bg-white/70 p-2 rounded-xl">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => handleUpdateVariant(v.id, { name: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs"
                    placeholder="Variant name"
                  />
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleUpdateVariant(v.id, { sku: e.target.value })}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-mono"
                    placeholder="SKU"
                  />
                  <div className="flex items-center space-x-1 w-24">
                    <span className="text-neutral-500 font-bold">$</span>
                    <input
                      type="number"
                      value={v.priceAdjustment}
                      onChange={(e) => handleUpdateVariant(v.id, { priceAdjustment: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs"
                      placeholder="+/-"
                    />
                  </div>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[rgba(160,190,215,0.4)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-white/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#0e1013] text-white text-xs font-bold hover:bg-neutral-800 transition shadow-xs"
            >
              {editingProduct ? 'Save Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

