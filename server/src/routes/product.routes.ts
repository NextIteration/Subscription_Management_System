import { Router, Request, Response } from 'express';
import { dbStore, ProductEntity, ProductVariantEntity } from '../services/dbStore.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { productSchema, updateProductSchema } from '../validators/product.validator.js';

const router = Router();

// GET /api/products - List products (ADMIN, STAFF)
router.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const status = req.query.status as string;
  let products = Array.from(dbStore.products.values());

  if (status) {
    products = products.filter((p) => p.status === status);
  }

  res.json({ products });
});

// GET /api/products/:id - Product detail (ADMIN, STAFF)
router.get('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const { id } = req.params;
  const product = dbStore.products.get(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product });
});

// POST /api/products - Create product (ADMIN only per PRD §2.3)
router.post('/', requireAuth, requireRole('ADMIN'), validate(productSchema), (req: Request, res: Response) => {
  const data = req.body;
  const productId = `prod-${Date.now()}`;

  const variants: ProductVariantEntity[] = (data.variants || []).map((v: any, index: number) => ({
    id: v.id || `var-${Date.now()}-${index + 1}`,
    productId,
    name: v.name,
    sku: v.sku,
    priceAdjustment: Number(v.priceAdjustment) || 0,
    description: v.description || '',
  }));

  const newProduct: ProductEntity = {
    id: productId,
    name: data.name,
    type: data.type,
    salesPrice: Number(data.salesPrice),
    costPrice: Number(data.costPrice),
    notes: data.notes || '',
    status: data.status || 'active',
    variants,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.products.set(productId, newProduct);

  res.status(201).json({
    message: 'Product created successfully',
    product: newProduct,
  });
});

// PUT /api/products/:id - Update product & variants (ADMIN only)
router.put('/:id', requireAuth, requireRole('ADMIN'), validate(updateProductSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const product = dbStore.products.get(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const data = req.body;

  let variants = product.variants;
  if (data.variants) {
    variants = data.variants.map((v: any, index: number) => ({
      id: v.id || `var-${Date.now()}-${index + 1}`,
      productId: id,
      name: v.name,
      sku: v.sku,
      priceAdjustment: Number(v.priceAdjustment) || 0,
      description: v.description || '',
    }));
  }

  const updatedProduct: ProductEntity = {
    ...product,
    ...data,
    variants,
    updatedAt: new Date(),
  };

  dbStore.products.set(id, updatedProduct);

  res.json({
    message: 'Product updated successfully',
    product: updatedProduct,
  });
});

// PATCH /api/products/:id/archive - Archive product (ADMIN only)
router.patch('/:id/archive', requireAuth, requireRole('ADMIN'), (req: Request, res: Response) => {
  const { id } = req.params;
  const product = dbStore.products.get(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.status = 'archived';
  product.updatedAt = new Date();
  dbStore.products.set(id, product);

  res.json({ message: `Product "${product.name}" archived.`, product });
});

export default router;

