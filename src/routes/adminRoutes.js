import express from "express";

import verifingAdmin from "../middlewares/verifingAdmin.js";
import verifyUser from "../middlewares/verifyUser.js";

import { CreateProduct, adminFetchAllProduct, adminFetchForProductPage, adminFetchProduct, adminSearchProducts } from "../controllers/adminControllers/adminProductControllers.js";
import { adminAddNewStaff, adminFetchAllStaffs, adminFetchStaff } from "../controllers/adminControllers/adminStaffController.js";
import { adminFetchAllCustomer, adminFetchForCustomerPage, fetchAdminCustomer, fetchCustomerByIdForCustomerPage } from "../controllers/adminControllers/adminCustomerController.js";
import { fetchAllOrders, fetchAdminOrder, updateOrderStatusToConfirmed, updateOrderStatusToOut, updateOrderStatusToDelivered, updateOrderStatusToCanceled, adminFetchDeliveryStaffByNameForOrderStatus, adminFetchDeliveryStaffByIdForOrderStatus, adminFetchForOrderPage, fetchAdminOrderByIdForOrderPage } from "../controllers/adminControllers/adminOrderController.js";

import {createProductGroup, fetchAllProductGroup} from '../controllers/adminControllers/adminProductGroupController.js'
import { createProductCategory, fetchAllProductCategory } from "../controllers/adminControllers/adminProductCategoryController.js";
import { adminCreateSupplier, adminFetchAllSuppliers, adminFetchSupplier } from "../controllers/adminControllers/adminSupplierController.js";
import { adminCreatePurchase, adminFetchAllPurchases, adminFetchAllSuppliersForPurchaseBook, adminFetchProductsByBarcodeForPurchaseEntry, adminFetchProductsByNameForPurchaseEntry, adminFetchPurchaseBook } from "../controllers/adminControllers/adminPurchaseController.js";
import { adminEditBanner, adminFetchCategoryByNameForCreateBanner, adminFetchGroupsByNameForCreateBanner, adminFetchProductsByBarcodeForCreateBanner, adminFetchProductsByNameForCreateBanner, createBanner, deleteBanner, fetchAllBanners, fetchBanner, hideBanner } from "../controllers/adminControllers/adminBannerController.js";

const router = express.Router()

// Customer
router.get('/customer/allCustomer' , verifyUser ,  adminFetchAllCustomer )
router.get('/customer/customer-page' , verifyUser ,  adminFetchForCustomerPage )
router.get('/customer/customer-page/search/:user_id' , verifyUser , fetchCustomerByIdForCustomerPage )
router.get('/customer/customer-page/search/:user_id' , verifyUser , fetchCustomerByIdForCustomerPage )
router.get('/customer/customer_id/:user_id' , verifyUser ,  fetchAdminCustomer )


// ProductGroup
router.post('/product-group/create-product-group' , verifyUser , verifingAdmin, createProductGroup)
router.get('/product-group/all-groups' , verifyUser , verifingAdmin, fetchAllProductGroup)

// ProductCategory
router.post('/product-category/create-product-category' , verifyUser , verifingAdmin, createProductCategory)
router.get('/product-category/all-categories' , verifyUser , verifingAdmin, fetchAllProductCategory)

// Products
router.post('/product/add-product' , verifyUser ,  CreateProduct)
router.get('/product/search' , verifyUser , adminSearchProducts)
router.get('/product/all-product' , verifyUser , adminFetchAllProduct)
router.get('/product/product-page' , verifyUser , adminFetchForProductPage)
router.get('/product/product_id/:id' , verifyUser ,  adminFetchProduct)

//Supplier
router.post('/supplier/create-supplier' , verifyUser , adminCreateSupplier)
router.get('/supplier/all-supplier' , verifyUser , adminFetchAllSuppliers)
router.get('/supplier/:id' , verifyUser ,  adminFetchSupplier)

//Purchase
router.post('/purchase/create-purchase' , verifyUser , adminCreatePurchase)
router.get('/purchase/all-purchases' , verifyUser ,  adminFetchAllPurchases)
router.get('/purchase/all-suppliers' , verifyUser ,  adminFetchAllSuppliersForPurchaseBook)
router.get('/purchase/:id' , verifyUser ,  adminFetchPurchaseBook)
router.get('/purchase/product/barcode/:barcode' , verifyUser ,  adminFetchProductsByBarcodeForPurchaseEntry)
router.get('/purchase/product/name/:name' , verifyUser , adminFetchProductsByNameForPurchaseEntry)

// Staff
router.post('/staff/add-staff' , verifyUser ,  adminAddNewStaff )
router.get('/staff/all-staff' , verifyUser ,  adminFetchAllStaffs )
router.get('/staff/:id' , verifyUser ,  adminFetchStaff )

//Orders
router.get('/order/all-order' , verifyUser ,  fetchAllOrders )
router.get('/order/order_id/:order_id' , verifyUser ,  fetchAdminOrder )
router.patch('/order/update/confirmed/:id' , verifyUser ,  updateOrderStatusToConfirmed )
router.patch('/order/update/out/:id' , verifyUser ,  updateOrderStatusToOut )
router.patch('/order/update/delivered/:id' , verifyUser ,  updateOrderStatusToDelivered )
router.patch('/order/update/cancel/:id' , verifyUser ,  updateOrderStatusToCanceled )
router.get('/order/get_staff/out/:username' , verifyUser ,  adminFetchDeliveryStaffByNameForOrderStatus )
router.get('/order/get_staff/out/id/:id' , verifyUser ,  adminFetchDeliveryStaffByIdForOrderStatus )
router.get('/order/order-page' , verifyUser ,  adminFetchForOrderPage )
router.get('/order/order-page/search/:order_id' , verifyUser , fetchAdminOrderByIdForOrderPage )

// Banner
router.post('/banner/create-banner', verifyUser, createBanner)
router.get('/banner/create/product-name/:name', verifyUser, adminFetchProductsByNameForCreateBanner)
router.get('/banner/create/product-barcode/:barcode', verifyUser, adminFetchProductsByBarcodeForCreateBanner)
router.get('/banner/create/group-name/:name', verifyUser, adminFetchGroupsByNameForCreateBanner)
router.get('/banner/create/category-name/:name', verifyUser, adminFetchCategoryByNameForCreateBanner)
router.patch('/banner/edit-banner', verifyUser, adminEditBanner)
router.get('/banner/all-banners', verifyUser, fetchAllBanners)
router.get('/banner/banner_id/:banner_id', verifyUser, fetchBanner)
router.patch('/banner/delete-banner/:id', verifyUser, deleteBanner)
router.patch('/banner/hide-banner/:id', verifyUser, hideBanner)

export default router