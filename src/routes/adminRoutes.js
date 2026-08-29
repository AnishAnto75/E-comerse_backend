import express from "express";

import verifingAdmin from "../middlewares/verifingAdmin.js";
import verifyUser from "../middlewares/verifyUser.js";

import { adminAddProductFAQs, adminEditProduct, adminEditProductInventoryBatch, adminFetchAllProduct, adminFetchCategoriesForCreateProductPage, adminFetchForCreateProductPage, adminFetchForEditProductPage, adminFetchForProductPage, adminFetchProductByCategory, adminFetchProductPage, adminFetchProductPreview, adminFetchProductView, adminSearchProducts, adminSearchProductsForAddVarient, createProduct } from "../controllers/adminControllers/adminProductControllers.js";
import { adminCreateStaff, adminFetchAllStaffs, adminFetchPreviewStaff, adminFetchStaff, adminFetchStaffPage } from "../controllers/adminControllers/adminStaffController.js";
import { adminBlockUser, adminFetchAllCustomer, adminFetchCustomerPreviewPage, adminFetchCustomersPage, adminFetchForCustomerPage, adminUnBlockUser, fetchAdminCustomer, fetchCustomerByIdForCustomerPage } from "../controllers/adminControllers/adminCustomerController.js";
import { fetchAdminOrder, adminConfirmOrder, adminFetchDeliveryStaffForOut, adminDeliverOrder, adminOutOrder, adminCancelOrder, fetchAllAdminOrder, adminFetchOrderPage } from "../controllers/adminControllers/adminOrderController.js";

import { adminFetchGroupCategoryPage, createProductGroup} from '../controllers/adminControllers/adminProductGroupController.js'
import { adminFetchGroupsForCreateCategory, createProductCategory, fetchAllProductCategory, fetchCategoriesByGroup } from "../controllers/adminControllers/adminProductCategoryController.js";
import { adminFetchAllSuppliers, adminFetchSupplier, adminFetchSupplierPage, createSupplier } from "../controllers/adminControllers/adminSupplierController.js";
import { adminCreatePurchase, adminFetchAllPurchases, adminFetchAllSuppliersForPurchaseBook, adminFetchProductsByBarcodeForPurchaseEntry, adminFetchProductsByNameForPurchaseEntry, adminFetchPurchaseBook, adminFetchPurchasePage, adminSearchProductsForCreatePurchase, adminSearchSuppliersForCreatePurchase, fetchAllAdminPurchases, getpurchase } from "../controllers/adminControllers/adminPurchaseController.js";
import { createProductBrand , adminEditBrand, fetchBrand, adminSearchBrand, fetchBrandPage} from "../controllers/adminControllers/adminProductBrandController.js";
import { uploadBrandImage, uploadCategoryImage, uploadGroupImage, uploadProductImage, uploadStaffImage } from "../middlewares/multer.js";
import { adminDashboardData } from "../controllers/adminControllers/adminDashboardController.js";
import { adminFetchActivityPage, adminFetchPreviewActivity } from "../controllers/adminControllers/adminActivityController.js";
import { adminCreateTransaction, adminFetchTransactionsPage } from "../controllers/adminControllers/adminTransactionsController.js";
import { adminCreateBusinessUnit, fetchAllBusinessUnit } from "../controllers/adminControllers/adminBusinessUnitController.js";

const router = express.Router()


// dashboard
router.get('/dashboard', adminDashboardData)


// product 
router.get('/product/product_page', adminFetchProductPage)
router.get('/product/product_preview/product_id/:barcode', adminFetchProductPreview)
router.get('/product/product_id/:barcode', adminFetchProductView)
router.get('/product/fetch-for-create-product', adminFetchForCreateProductPage)
router.get('/product/fetch-categories-for-create-product/:id', adminFetchCategoriesForCreateProductPage)
router.post('/product/add-product' , verifyUser, uploadProductImage.fields([{ name: "product_photo", maxCount: 1 },{ name: "product_additional_photos", maxCount: 5 }]), createProduct)

router.get('/product/fetch-for-edit-product/:barcode', adminFetchForEditProductPage)
router.put( "/product/edit/:barcode", verifyUser, adminEditProduct )

router.patch( "/product/inventory/:product_id/batch/:batch_id", verifyUser, adminEditProductInventoryBatch )

router.post('/product/add-faqs/:barcode' , verifyUser, adminAddProductFAQs)
router.get('/product/add-varient/search-products/' , verifyUser, adminSearchProductsForAddVarient)

router.get('/product/all' , verifyUser, adminFetchAllProduct)                           // testing controller


// groups
router.post('/product-group/create-group', uploadGroupImage.single("group_image"), createProductGroup)

router.get('/product-group/groups_categories_page', verifyUser, adminFetchGroupCategoryPage )

// category
router.post('/product-category/create-category', uploadCategoryImage.single("category_image"), createProductCategory)
router.get('/product-category/fetch_groups_for_create', verifyUser, adminFetchGroupsForCreateCategory)


// brands
router.post('/brand/create-brand', uploadBrandImage.single("brand_logo"), createProductBrand)
router.get('/brand/brand_page', verifyUser, fetchBrandPage )
router.get('/brand/brand_id/:id', verifyUser, fetchBrand)


// Supplier
router.post('/supplier/create-supplier', verifyUser , createSupplier)
router.get('/supplier/supplier_page', verifyUser , adminFetchSupplierPage)
router.get('/supplier/supplier_id/:id', verifyUser , adminFetchSupplier)


// Purchase
router.get( "/purchase/purchase_page", verifyUser, adminFetchPurchasePage )
router.post('/purchase/create-purchase' , verifyUser, adminCreatePurchase)
router.get('/purchase/create-purchase/fetch-supplier/' , verifyUser, adminSearchSuppliersForCreatePurchase)
router.get('/purchase/create-purchase/search-products/' , verifyUser, adminSearchProductsForCreatePurchase)

router.get('/purchase/all-purchase' , verifyUser, fetchAllAdminPurchases )                        // testing controllers
router.get('/purchase/purchase_id/:id' , verifyUser, getpurchase )                        // testing controllers

// Orders
router.get('/order/order_page' , verifyUser, adminFetchOrderPage )
router.get('/order/order_id/:order_id' , verifyUser, fetchAdminOrder )
router.patch('/order/update/confirmed/:order_id' , verifyUser, adminConfirmOrder )
router.get('/order/get_staff/out/:term' , verifyUser, adminFetchDeliveryStaffForOut )
router.patch("/order/update/out/:order_id" , verifyUser, adminOutOrder )
router.patch("/order/update/deliver/:order_id" , verifyUser, adminDeliverOrder )
router.patch("/order/update/cancel/:order_id" , verifyUser, adminCancelOrder )

router.get('/order/all-order' , verifyUser, fetchAllAdminOrder )                        // testing controllers


// Staff
router.get('/staff/staff_page' , verifyUser, adminFetchStaffPage )
router.get('/staff/staff_preview_page/:staff_id' , verifyUser, adminFetchPreviewStaff )
router.post('/staff/create' , verifyUser, uploadStaffImage.single("photo"), adminCreateStaff )


// Customers
router.get('/customer/customer_page' , verifyUser, adminFetchCustomersPage )
router.get('/customer/customer_preview_page/:user_id' , verifyUser, adminFetchCustomerPreviewPage )


// Recent Activity
router.get('/activity/activity_page' , verifyUser, adminFetchActivityPage )
router.get('/activity/activity_preview_page/:_id' , verifyUser, adminFetchPreviewActivity )


// Transactions
router.get('/transaction/transaction_page' , verifyUser, adminFetchTransactionsPage )
router.post('/transaction/create' , verifyUser, adminCreateTransaction )


// Business unit
router.post('/business-unit/create' , verifyUser, adminCreateBusinessUnit )
router.get('/business-unit/all' , verifyUser, fetchAllBusinessUnit )                        // testing controllers









// old


// Customer
router.get('/customer/allCustomer' , verifyUser, verifingAdmin,  adminFetchAllCustomer )
router.get('/customer/customer-page' , verifyUser, verifingAdmin,  adminFetchForCustomerPage )
router.get('/customer/customer-page/search/:user_id' , verifyUser, verifingAdmin, fetchCustomerByIdForCustomerPage )
router.get('/customer/customer_id/:user_id' , verifyUser, verifingAdmin,  fetchAdminCustomer )
router.get('/customer/block/customer_id/:user_id' , verifyUser, verifingAdmin,  adminBlockUser )
router.get('/customer/unBlock/customer_id/:user_id' , verifyUser, verifingAdmin,  adminUnBlockUser )


// ProductCategory
router.get('/product-category/all-categories' , verifyUser , verifingAdmin, fetchAllProductCategory)
router.get('/product-category/group-id/:id' , verifyUser , verifingAdmin, fetchCategoriesByGroup)


//ProductBrand
router.get('/brand/brand-id/:id', verifyUser, verifingAdmin, fetchBrand )
router.get('/brand/search' , verifyUser, verifingAdmin, adminSearchBrand)
router.post('/brand/edit/:id' , verifyUser, verifingAdmin, adminEditBrand )


// Products
router.get('/product/search' , verifyUser, verifingAdmin, adminSearchProducts)
router.get('/product/all-product' , verifyUser, verifingAdmin, adminFetchAllProduct)
router.get('/product/product-page' , verifyUser, verifingAdmin, adminFetchForProductPage)
router.get('/product/product_id/:id' , verifyUser, verifingAdmin, adminFetchProductView)
router.get('/product/category/:id' , verifyUser, verifingAdmin, adminFetchProductByCategory)


//Supplier
router.get('/supplier/all-supplier' , verifyUser, verifingAdmin, adminFetchAllSuppliers)


//Purchase
router.get('/purchase/all-suppliers' , verifyUser, verifingAdmin, adminFetchAllSuppliersForPurchaseBook)
router.get('/purchase/product/barcode/:id' , verifyUser, verifingAdmin , adminFetchProductsByBarcodeForPurchaseEntry)
router.get('/purchase/product/name/:name' , verifyUser, verifingAdmin, adminFetchProductsByNameForPurchaseEntry)
router.get('/purchase/all-purchases' , verifyUser, verifingAdmin, adminFetchAllPurchases)
router.get('/purchase/purchase-id/:id' , verifyUser, verifingAdmin, adminFetchPurchaseBook)

// Staff
router.get('/staff/all-staff' , verifyUser, verifingAdmin, adminFetchAllStaffs )
router.get('/staff/:id' , verifyUser, verifingAdmin, adminFetchStaff )









export default router