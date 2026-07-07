import express from "express";

import verifingAdmin from "../middlewares/verifingAdmin.js";
import verifyUser from "../middlewares/verifyUser.js";

import { adminFetchAllProduct, adminFetchCategoriesForCreateProductPage, adminFetchForCreateProductPage, adminFetchForProductPage, adminFetchProduct, adminFetchProductByCategory, adminSearchProducts, createProduct } from "../controllers/adminControllers/adminProductControllers.js";
import { adminAddNewStaff, adminFetchAllStaffs, adminFetchStaff } from "../controllers/adminControllers/adminStaffController.js";
import { adminBlockUser, adminFetchAllCustomer, adminFetchForCustomerPage, adminUnBlockUser, fetchAdminCustomer, fetchCustomerByIdForCustomerPage } from "../controllers/adminControllers/adminCustomerController.js";
import { fetchAllOrders, fetchAdminOrder, updateOrderStatusToConfirmed, updateOrderStatusToOut, updateOrderStatusToDelivered, updateOrderStatusToCanceled, adminFetchDeliveryStaffByNameForOrderStatus, adminFetchDeliveryStaffByIdForOrderStatus, adminFetchForOrderPage, fetchAdminOrderByIdForOrderPage } from "../controllers/adminControllers/adminOrderController.js";

import {createProductGroup, fetchAllProductGroup} from '../controllers/adminControllers/adminProductGroupController.js'
import { createProductCategory, fetchAllProductCategory, fetchCategoriesByGroup } from "../controllers/adminControllers/adminProductCategoryController.js";
import { adminCreateSupplier, adminFetchAllSuppliers, adminFetchSupplier } from "../controllers/adminControllers/adminSupplierController.js";
import { adminCreatePurchase, adminFetchAllPurchases, adminFetchAllSuppliersForPurchaseBook, adminFetchProductsByBarcodeForPurchaseEntry, adminFetchProductsByNameForPurchaseEntry, adminFetchPurchaseBook } from "../controllers/adminControllers/adminPurchaseController.js";
import { adminEditBanner, adminFetchCategoryByNameForCreateBanner, adminFetchGroupsByNameForCreateBanner, adminFetchProductsByBarcodeForCreateBanner, adminFetchProductsByNameForCreateBanner, createBanner, deleteBanner, fetchAllBanners, fetchBanner, hideBanner } from "../controllers/adminControllers/adminBannerController.js";
import { createProductBrand , fetchAllBrand, adminEditBrand, fetchBrand, adminSearchBrand} from "../controllers/adminControllers/adminProductBrandController";
import { uploadBrandImage, uploadCategoryImage, uploadGroupImage, uploadProductImage } from "../middlewares/multer.js";

const router = express.Router()


// product 
router.get('/product/fetch-for-create-product', adminFetchForCreateProductPage)
router.get('/product/fetch-categories-for-create-product/:id', adminFetchCategoriesForCreateProductPage)
router.post('/product/add-product' ,uploadProductImage.fields([{ name: "product_photo", maxCount: 1 },{ name: "product_additional_photos", maxCount: 5 }]), createProduct)




// groups
router.post('/product-group/create-group', uploadGroupImage.single("group_image"), createProductGroup)



// category
router.post('/product-category/create-category', uploadCategoryImage.single("category_image"), createProductCategory)




// brands
router.post('/brand/create-brand', uploadBrandImage.single("brand_logo"), createProductBrand)








// old


// Customer
router.get('/customer/allCustomer' , verifyUser, verifingAdmin,  adminFetchAllCustomer )
router.get('/customer/customer-page' , verifyUser, verifingAdmin,  adminFetchForCustomerPage )
router.get('/customer/customer-page/search/:user_id' , verifyUser, verifingAdmin, fetchCustomerByIdForCustomerPage )
router.get('/customer/customer_id/:user_id' , verifyUser, verifingAdmin,  fetchAdminCustomer )
router.get('/customer/block/customer_id/:user_id' , verifyUser, verifingAdmin,  adminBlockUser )
router.get('/customer/unBlock/customer_id/:user_id' , verifyUser, verifingAdmin,  adminUnBlockUser )


// ProductGroup
router.get('/product-group/all-groups' , verifyUser , verifingAdmin, fetchAllProductGroup)


// ProductCategory
router.get('/product-category/all-categories' , verifyUser , verifingAdmin, fetchAllProductCategory)
router.get('/product-category/group-id/:id' , verifyUser , verifingAdmin, fetchCategoriesByGroup)


//ProductBrand
router.get('/brand/brand-id/:id', verifyUser, verifingAdmin, fetchBrand )
router.get('/brand/all-brand', verifyUser, verifingAdmin, fetchAllBrand )
router.get('/brand/search' , verifyUser, verifingAdmin, adminSearchBrand)
router.post('/brand/edit/:id' , verifyUser, verifingAdmin, adminEditBrand )


// Products
router.get('/product/search' , verifyUser, verifingAdmin, adminSearchProducts)
router.get('/product/all-product' , verifyUser, verifingAdmin, adminFetchAllProduct)
router.get('/product/product-page' , verifyUser, verifingAdmin, adminFetchForProductPage)
router.get('/product/product_id/:id' , verifyUser, verifingAdmin, adminFetchProduct)
router.get('/product/category/:id' , verifyUser, verifingAdmin, adminFetchProductByCategory)


//Supplier
router.post('/supplier/create-supplier' , verifyUser, verifingAdmin, adminCreateSupplier)
router.get('/supplier/all-supplier' , verifyUser, verifingAdmin, adminFetchAllSuppliers)
router.get('/supplier/supplier_id/:id' , verifyUser, verifingAdmin, adminFetchSupplier)


//Purchase
router.post('/purchase/create-purchase' , verifyUser, verifingAdmin, adminCreatePurchase)
router.get('/purchase/all-suppliers' , verifyUser, verifingAdmin, adminFetchAllSuppliersForPurchaseBook)
router.get('/purchase/product/barcode/:id' , verifyUser, verifingAdmin , adminFetchProductsByBarcodeForPurchaseEntry)
router.get('/purchase/product/name/:name' , verifyUser, verifingAdmin, adminFetchProductsByNameForPurchaseEntry)
router.get('/purchase/all-purchases' , verifyUser, verifingAdmin, adminFetchAllPurchases)
router.get('/purchase/purchase-id/:id' , verifyUser, verifingAdmin, adminFetchPurchaseBook)

// Staff
router.post('/staff/add-staff' , verifyUser, verifingAdmin , adminAddNewStaff )
router.get('/staff/all-staff' , verifyUser, verifingAdmin, adminFetchAllStaffs )
router.get('/staff/:id' , verifyUser, verifingAdmin, adminFetchStaff )


//Orders
router.get('/order/all-order' , verifyUser, verifingAdmin, fetchAllOrders )
router.get('/order/order_id/:order_id' , verifyUser, verifingAdmin, fetchAdminOrder )
router.patch('/order/update/confirmed/:id' , verifyUser, verifingAdmin, updateOrderStatusToConfirmed )
router.patch('/order/update/out/:id' , verifyUser, verifingAdmin, updateOrderStatusToOut )
router.patch('/order/update/delivered/:id' , verifyUser, verifingAdmin, updateOrderStatusToDelivered )
router.patch('/order/update/cancel/:id' , verifyUser, verifingAdmin, updateOrderStatusToCanceled )
router.get('/order/get_staff/out/:username' , verifyUser, verifingAdmin, adminFetchDeliveryStaffByNameForOrderStatus )
router.get('/order/get_staff/out/id/:id' , verifyUser, verifingAdmin, adminFetchDeliveryStaffByIdForOrderStatus )
router.get('/order/order-page' , verifyUser, verifingAdmin, adminFetchForOrderPage )
router.get('/order/order-page/search/:order_id' , verifyUser, verifingAdmin, fetchAdminOrderByIdForOrderPage )


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