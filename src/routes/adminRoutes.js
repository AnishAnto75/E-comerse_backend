import express from "express";

import verifingAdmin from "../middlewares/verifingAdmin.js";
import verifyUser from "../middlewares/verifyUser.js";

import { adminFetchAllProduct, adminFetchCategoriesForCreateProductPage, adminFetchForCreateProductPage, adminFetchForProductPage, adminFetchProduct, adminFetchProductByCategory, adminFetchProductPage, adminSearchProducts, createProduct } from "../controllers/adminControllers/adminProductControllers.js";
import { adminCreateStaff, adminFetchAllStaffs, adminFetchPreviewStaff, adminFetchStaff, adminFetchStaffPage } from "../controllers/adminControllers/adminStaffController.js";
import { adminBlockUser, adminFetchAllCustomer, adminFetchCustomerPreviewPage, adminFetchCustomersPage, adminFetchForCustomerPage, adminUnBlockUser, fetchAdminCustomer, fetchCustomerByIdForCustomerPage } from "../controllers/adminControllers/adminCustomerController.js";
import { fetchAdminOrder, adminConfirmOrder, adminFetchDeliveryStaffForOut, adminDeliverOrder, adminOutOrder, adminCancelOrder, fetchAllAdminOrder, adminFetchOrderPage } from "../controllers/adminControllers/adminOrderController.js";

import { adminFetchGroupCategoryPage, createProductGroup} from '../controllers/adminControllers/adminProductGroupController.js'
import { createProductCategory, fetchAllProductCategory, fetchCategoriesByGroup } from "../controllers/adminControllers/adminProductCategoryController.js";
import { adminFetchAllSuppliers, adminFetchSupplier, adminFetchSupplierPage, createSupplier } from "../controllers/adminControllers/adminSupplierController.js";
import { adminCreatePurchase, adminFetchAllPurchases, adminFetchAllSuppliersForPurchaseBook, adminFetchProductsByBarcodeForPurchaseEntry, adminFetchProductsByNameForPurchaseEntry, adminFetchPurchaseBook, adminFetchPurchasePage, adminSearchProductsForCreatePurchase, adminSearchSuppliersForCreatePurchase } from "../controllers/adminControllers/adminPurchaseController.js";
import { adminEditBanner, adminFetchCategoryByNameForCreateBanner, adminFetchGroupsByNameForCreateBanner, adminFetchProductsByBarcodeForCreateBanner, adminFetchProductsByNameForCreateBanner, createBanner, deleteBanner, fetchAllBanners, fetchBanner, hideBanner } from "../controllers/adminControllers/adminBannerController.js";
import { createProductBrand , adminEditBrand, fetchBrand, adminSearchBrand, fetchBrandPage} from "../controllers/adminControllers/adminProductBrandController.js";
import { uploadBrandImage, uploadCategoryImage, uploadGroupImage, uploadProductImage, uploadStaffImage } from "../middlewares/multer.js";
import { adminDashboardData } from "../controllers/adminControllers/adminDashboardController.js";

const router = express.Router()


// dashboard
router.get('/dashboard', adminDashboardData)


// product 
router.get('/product/product_page', adminFetchProductPage)
router.get('/product/product_id/:barcode', adminFetchProduct)
router.get('/product/fetch-for-create-product', adminFetchForCreateProductPage)
router.get('/product/fetch-categories-for-create-product/:id', adminFetchCategoriesForCreateProductPage)
router.post('/product/add-product' , verifyUser, uploadProductImage.fields([{ name: "product_photo", maxCount: 1 },{ name: "product_additional_photos", maxCount: 5 }]), createProduct)
router.get('/product/all' , verifyUser, adminFetchAllProduct)                           // testing controller


// groups
router.post('/product-group/create-group', uploadGroupImage.single("group_image"), createProductGroup)
router.get('/product-group/groups_categories_page', verifyUser, adminFetchGroupCategoryPage )


// category
router.post('/product-category/create-category', uploadCategoryImage.single("category_image"), createProductCategory)


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


// Orders
router.get('/order/all-order' , verifyUser, fetchAllAdminOrder )                        // testing controllers
router.get('/order/order_page' , verifyUser, adminFetchOrderPage )
router.get('/order/order_id/:order_id' , verifyUser, fetchAdminOrder )
router.patch('/order/update/confirmed/:order_id' , verifyUser, adminConfirmOrder )
router.get('/order/get_staff/out/:term' , verifyUser, adminFetchDeliveryStaffForOut )
router.patch("/order/update/out/:order_id" , verifyUser, adminOutOrder )
router.patch("/order/update/deliver/:order_id" , verifyUser, adminDeliverOrder )
router.patch("/order/update/cancel/:order_id" , verifyUser, adminCancelOrder )


// Staff
router.post('/staff/create' , verifyUser, uploadStaffImage.single("photo"), adminCreateStaff )
router.get('/staff/staff_page' , verifyUser, adminFetchStaffPage )
router.get('/staff/staff_preview_page/:staff_id' , verifyUser, adminFetchPreviewStaff )


// Customers
router.get('/customer/customer_page' , verifyUser, adminFetchCustomersPage )
router.get('/customer/customer_preview_page/:user_id' , verifyUser, adminFetchCustomerPreviewPage )












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
router.get('/product/product_id/:id' , verifyUser, verifingAdmin, adminFetchProduct)
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



// Banner
router.post('/banner/create-banner', verifyUser, verifingAdmin, createBanner)
router.get('/banner/create/product-name/:name', verifyUser, verifingAdmin, adminFetchProductsByNameForCreateBanner)
router.get('/banner/create/product-barcode/:barcode', verifyUser, verifingAdmin, adminFetchProductsByBarcodeForCreateBanner)
router.get('/banner/create/group-name/:name', verifyUser, verifingAdmin, adminFetchGroupsByNameForCreateBanner)
router.get('/banner/create/category-name/:name', verifyUser, verifingAdmin, adminFetchCategoryByNameForCreateBanner)
router.patch('/banner/edit-banner', verifyUser, verifingAdmin, adminEditBanner)
router.get('/banner/all-banners', verifyUser, verifingAdmin, fetchAllBanners)
router.get('/banner/banner_id/:banner_id', verifyUser, verifingAdmin, fetchBanner)
router.patch('/banner/delete-banner/:id', verifyUser, verifingAdmin, deleteBanner)
router.patch('/banner/hide-banner/:id', verifyUser, verifingAdmin, hideBanner)










export default router