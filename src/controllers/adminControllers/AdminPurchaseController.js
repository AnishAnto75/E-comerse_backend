import mongoose from "mongoose"
import ProductInventory from "../../models/ProductInventoryModel.js"
import Product from "../../models/ProductModel.js"
import Purchase from "../../models/PurchaseModel.js"
import Supplier from "../../models/SupplierModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateDate, validateMongooseId} from "../../utils/validateTypes.js"
import { generateRandom10DigitNumber } from "../../utils/generateRandomNumber.js"
import Transaction from "../../models/TransactionModel.js"
import RecentActivity from "../../models/RecentActivityModel.js"
import BusinessUnit from "../../models/BusinessUnitModel.js"
import ProductTransaction from "../../models/ProductTransactionModel.js"


export const adminFetchPurchasePage = async (req, res) => {
    try {
        const page = Math.max( parseInt(req.query.page) || 1, 1 )
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit;

        const payment_status = req.query.payment_status?.trim() 
        const search = req.query.search?.trim()

        const match = { deleted: false }
        if (payment_status && payment_status !== "all") {
            if (!["Paid", "Partial", "Pending"].includes(payment_status)) { return }
            match.payment_status = payment_status
        }
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            const searchRegex = { $regex: escapedSearch, $options: "i" }
            match.$or = [{ purchase_id: searchRegex }, { supplier_invoice_no: searchRegex }]
        }

        const summary = await Purchase.aggregate([
            { $match: { deleted: false }},
            { $group: {
                _id: null,
                total_purchases: { $sum: 1 },
                pending_purchases: { $sum: { $cond: [{ $eq: ["$payment_status", "Pending"] }, 1, 0 ]}},
                partially_paid_purchases: { $sum: { $cond: [{ $eq: ["$payment_status", "Partial"] },1, 0 ]}}
            }},
            { $project: {
                _id: 0,
                total_purchases: 1,
                pending_purchases: 1,
                partially_paid_purchases: 1
            }}
        ]);

        const purchases = await Purchase.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 }},
            { $skip: skip },
            { $limit: limit },
            { $lookup: {
                from: "suppliers",
                localField: "supplier_id",
                foreignField: "_id",
                as: "supplier"
            }},
            { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true }},
            { $project: {
                _id: 0,
                purchase_id: 1,
                supplier: {
                    _id: "$supplier._id",
                    supplier_id: "$supplier.supplier_id",
                    supplier_name: "$supplier.supplier_name",
                    supplier_phone: "$supplier.supplier_phone"
                },
                supplier_invoice_no: 1,
                invoice_date: 1,
                delivery_date: 1,
                grand_total: 1,
                balance_amount: 1,
                payment_status: 1,
                total_items: { $size: { $ifNull: ["$products", []]}}
            }}
        ])

        const totalPurchases = await Purchase.countDocuments(match);
        const totalPages = Math.ceil( totalPurchases / limit )

        const data = {
            summary: {
                total_purchases: summary[0]?.total_purchases || 0,
                pending_purchases: summary[0]?.pending_purchases || 0,
                partially_paid_purchases: summary[0]?.partially_paid_purchases || 0
            },
            purchases,
            pagination: {
                current_page: page,
                limit,
                total_purchases: totalPurchases,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            }
        }

        return apiSucessResponce( res, "Purchase page fetched successfully", data, 200);

    } catch (error) {
        console.error( "Error in adminFetchPurchasePage:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}

export const adminSearchSuppliersForCreatePurchase = async (req, res) => {
    try {
        const { query } = req.query;
        
        const escapedQuery = query?.replace( /[.*+?^${}()|[\]\\]/g, "\\$&");

        if (!escapedQuery?.trim()) { return apiSucessResponce(res, "Supplier fetched successfully", [] , 200)}


        // Search by name or Supplier
        const products = await Supplier.find({ 
            deleted: false, status: "active",
            $or: [ 
                { supplier_name: {$regex: escapedQuery, $options: "i"}}, 
                { supplier_id: { $regex: escapedQuery, $options: "i"}},
                { supplier_email: { $regex: escapedQuery, $options: "i"}},
                { supplier_phone: { $regex: escapedQuery, $options: "i"}},
            ]
        })
        .select( "_id supplier_id supplier_name supplier_email supplier_phone supplier_gst_no supplier_address")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

        return apiSucessResponce(res, "Supplier fetched successfully", products, 200)
    } catch (error) {
        console.error(error);
        return apiErrorResponce(res, "failed to search Supplier")
    }
}

export const adminSearchProductsForCreatePurchase = async (req, res) => {
    try {
        const { query } = req.query
        
        const escapedQuery = query?.replace( /[.*+?^${}()|[\]\\]/g, "\\$&");

        if (!escapedQuery?.trim()) { return apiSucessResponce(res, "product fetched successfully", [] , 200)}

        // Search by name or barcode
        const products = await Product.find({ 
            deleted: false, 
            $or: [ 
                {product_name: {$regex: escapedQuery, $options: "i"}}, 
                { product_barcode: { $regex: escapedQuery, $options: "i"}}, 
                { search_keywords: { $regex: escapedQuery, $options: "i"}} 
            ]
        })
        .select( "_id product_name product_barcode latest_batch_details current_stock product_photo")
        .limit(10)
        .lean();

        return apiSucessResponce(res, "product fetched successfully", products, 200)
    } catch (error) {
        console.error(error);
        return apiErrorResponce(res, "failed to search product")
    }
}

export const adminCreatePurchase = async (req, res) => {

    const PAYMENT_METHODS = new Set([ "Cash", "UPI", "Card", "Bank Transfer", "Cheque" ])
    const MAX_QUANTITY_PER_PRODUCT = 1000000
    const MAX_FREE_QUANTITY_PER_PRODUCT = 1000000
    const MAX_BATCH_NO_LENGTH = 50
    const MAX_REFERENCE_LENGTH = 100
    const MAX_MONEY = 999999999999
    const MAX_SIZE = 1000000
    const MAX_BEST_BEFORE = 10000
    const MAX_PRODUCTS_PER_PURCHASE = 500

    const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100
    const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
    const isValidObjectId = (value) => { 
        if ( typeof value !== "string" && !(value instanceof mongoose.Types.ObjectId) ) {return false}
        return mongoose.Types.ObjectId.isValid(value)
    }
    const parseRequiredObjectId = (value, fieldName) => {
        if (!isValidObjectId(value)) { throw new Error(`${fieldName} is invalid.`)}
        return new mongoose.Types.ObjectId(value)
    }
    const cleanString = ( value, fieldName, maxLength = 200, required = true ) => {
        if (typeof value !== "string") { 
            if (!required && (value === null || value === undefined)) { return null }
            throw new Error(`${fieldName} must be a string.`)
        }
        const result = value.trim()
        if (!result) { 
            if (!required) return null
            throw new Error(`${fieldName} is required.`)
        }
        if (result.length > maxLength) { throw new Error( `${fieldName} cannot exceed ${maxLength} characters.` )}
        return result
    }
    const parseMoney = (value, fieldName, required = true) => {
        if ( value === undefined || value === null || value === "" ) {
            if (!required) return 0 
            throw new Error(`${fieldName} is required.`)
        }
        if ( typeof value !== "number" && typeof value !== "string" ) { throw new Error(`${fieldName} must be a number.`)}
        if ( typeof value === "string" && value.trim() === "" ) { throw new Error(`${fieldName} must be a valid number.`)}

        const number = Number(value)
        if (!Number.isFinite(number)) { throw new Error(`${fieldName} must be a valid number.`) }
        if (number < 0) { throw new Error(`${fieldName} cannot be negative.`) }
        if (number > MAX_MONEY) { throw new Error(`${fieldName} exceeds the allowed limit.`)}
        return roundMoney(number)
    }
    const parseInteger = ( value, fieldName, { required = true, min = 0, max = Number.MAX_SAFE_INTEGER } = {} ) => {
        if ( value === undefined || value === null || value === "" ) {
            if (!required) return 0
            throw new Error(`${fieldName} is required.`)
        }
        if ( typeof value !== "number" && typeof value !== "string") {throw new Error(`${fieldName} must be an integer.`)}
        if ( typeof value === "string" && value.trim() === "" ) { throw new Error(`${fieldName} must be an integer.`)}

        const number = Number(value)
        if (!Number.isSafeInteger(number)) { throw new Error(`${fieldName} must be an integer.`)}
        if (number < min || number > max) { throw new Error( `${fieldName} must be between ${min} and ${max}.` )}
        return number
    }
    const parsePercentage = (value, fieldName) => {
        const number = parseMoney(value, fieldName)
        if (number > 100) { throw new Error( `${fieldName} cannot exceed 100.`)}
        return number
    }
    const parseOptionalNumber = ( value, fieldName, { min = 0, max = MAX_SIZE } = {} ) => {
        if ( value === undefined || value === null || value === "" ) { return null }
        const number = Number(value)
        if (!Number.isFinite(number)) { throw new Error( `${fieldName} must be a valid number.` )}
        if (number < min || number > max) { throw new Error( `${fieldName} must be between ${min} and ${max}.` )}
        return roundMoney(number)
    }

    const parseDate = ( value, fieldName, required = true ) => {
        if ( value === undefined || value === null || value === "" ) {
            if (!required) return null
            throw new Error(`${fieldName} is required.`)
        }
        if ( typeof value !== "string" && !(value instanceof Date)) { throw new Error(`${fieldName} is invalid.`)}
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) { throw new Error(`${fieldName} is invalid.`)}
        return date
    }

    const session = await mongoose.startSession()

    try {

        const staffId = req.user?._id

        if (!isPlainObject(req.body)) { return apiErrorResponce( res, "Invalid request body.", null, 400 ) }

        const allowedFields = new Set([ 
            "supplier_id",
            "supplier_invoice_no",
            "invoice_date",
            "delivery_date",
            "products",
            "payment_method",
            "discount_received",
            "paid_amount",
            "payment_date"
        ])

        for (const key of Object.keys(req.body)) {
            if (!allowedFields.has(key)) { return apiErrorResponce( res, `Unexpected field '${key}'.`, null, 400)}
        }

        const { supplier_id, supplier_invoice_no, invoice_date, delivery_date, products, payment_method, discount_received = 0, paid_amount = 0, payment_date = null } = req.body

        const supplierId = parseRequiredObjectId( supplier_id, "Supplier ID" )
        const supplierInvoiceNo = cleanString( supplier_invoice_no, "Supplier invoice number", MAX_REFERENCE_LENGTH )

        if (!Array.isArray(products)) { return apiErrorResponce( res, "Products must be an array.", null, 400 )}
        if (products.length === 0) { return apiErrorResponce( res, "At least one product is required.", null, 400 )}
        if (products.length > MAX_PRODUCTS_PER_PURCHASE) { return apiErrorResponce( res, `A purchase cannot contain more than ${MAX_PRODUCTS_PER_PURCHASE} products.`, null, 400 )}
        const invoiceDate = parseDate( invoice_date, "Invoice date" )
        const deliveryDate = parseDate( delivery_date, "Delivery date" )
        if (deliveryDate < invoiceDate) { return apiErrorResponce( res, "Delivery date cannot be before invoice date.", null, 400 ) }

        const paidAmount = parseMoney( paid_amount, "Paid amount" )
        let paymentMethod = null
        if (paidAmount > 0) {
            if ( typeof payment_method !== "string" || !PAYMENT_METHODS.has(payment_method) ) { throw new Error( "Valid payment method is required when payment is made." )}
            paymentMethod = payment_method
        }
        else if ( payment_method !== undefined && payment_method !== null && payment_method !== "" ) { throw new Error( "Payment method cannot be provided when paid amount is zero." )}

        let paymentDate = null
        if ( payment_date !== null && payment_date !== undefined && payment_date !== "" ) {
            paymentDate = parseDate( payment_date, "Payment date" )
        }

        const normalizedProducts = []
        const productIds = []

        const allowedProductFields = new Set([
            "product_id",
            "batch_no",
            "free_received",
            "quantity_received",
            "size",
            "manufacture_date",
            "expiry_date",
            "best_before",
            "mrp",
            "purchase_cost",
            "gst_percentage",
            "other_expenses",
            "selling_price"
        ])


        for ( let index = 0; index < products.length; index++ ) {
            const item = products[index]
            if (!isPlainObject(item)) { throw new Error( `Invalid product data at position ${index + 1}.` )}

            for (const key of Object.keys(item)) {
                if (!allowedProductFields.has(key)) { throw new Error( `Unexpected product field '${key}' at position ${index + 1}.` )}
            }

            const productId = parseRequiredObjectId( item.product_id, `Product ID at position ${index + 1}` )
            const quantityReceived = parseInteger( item.quantity_received, `Quantity at product ${index + 1}`, { required: true, min: 1, max: MAX_QUANTITY_PER_PRODUCT })
            const freeReceived = parseInteger( item.free_received ?? 0, `Free quantity at product ${index + 1}`, { required: false, min: 0, max: MAX_FREE_QUANTITY_PER_PRODUCT })
            const totalReceived = quantityReceived + freeReceived

            let batchNo = ""
            if ( item.batch_no !== undefined && item.batch_no !== null && item.batch_no !== "" ) {
                batchNo = cleanString( item.batch_no, `Batch number at product ${index + 1}`, MAX_BATCH_NO_LENGTH )
            }

            const size = parseOptionalNumber( item.size, `Size at product ${index + 1}`, { min: 0.01, max: MAX_SIZE } )
            const manufactureDate = parseDate( item.manufacture_date, `Manufacture date at product ${index + 1}`, false )
            const expiryDate = parseDate( item.expiry_date, `Expiry date at product ${index + 1}`, false )

            if ( manufactureDate && expiryDate && expiryDate < manufactureDate ) {  throw new Error( `Expiry date cannot be before manufacture date at product ${index + 1}.` )}

            const bestBefore = parseInteger( item.best_before ?? 0, `Best-before at product ${index + 1}`, { required: false, min: 0, max: MAX_BEST_BEFORE })
            const mrp = parseMoney( item.mrp, `MRP at product ${index + 1}` )
            const purchaseCost = parseMoney( item.purchase_cost, `Purchase cost at product ${index + 1}` )
            const otherExpenses = parseMoney( item.other_expenses ?? 0, `Other expenses at product ${index + 1}`)
            const sellingPrice = parseMoney( item.selling_price, `Selling price at product ${index + 1}` )
            const gstPercentage = parsePercentage( item.gst_percentage, `GST percentage at product ${index + 1}`)

            if (sellingPrice > mrp) { throw new Error( `Selling price cannot exceed MRP at product ${index + 1}.` )}

            normalizedProducts.push({
                product_id: productId,
                batch_no: batchNo,
                quantity_received: quantityReceived,
                free_received: freeReceived,
                total_received: totalReceived,
                size,
                manufacture_date: manufactureDate,
                expiry_date: expiryDate,
                best_before: bestBefore,
                mrp,
                purchase_cost: purchaseCost,
                gst_percentage: gstPercentage,
                other_expenses: otherExpenses,
                selling_price: sellingPrice
            })

            productIds.push(productId)
        }

        const uniqueProductIds = new Set(productIds.map(id => id.toString()) )
        if ( uniqueProductIds.size !== productIds.length ) { return apiErrorResponce( res, "The same product cannot appear more than once in a purchase.", null, 409 )}

        const discountReceived = parseMoney( discount_received, "Discount" )

        await session.startTransaction()

        const supplier = await Supplier.findOne({ _id: supplierId, deleted: false, status: "active" }).session(session).select("_id supplier_name").lean()
        if (!supplier) { throw new Error( "Supplier not found or inactive." )}

        const existingInvoice = await Purchase.findOne({ supplier_id: supplier._id, supplier_invoice_no: supplierInvoiceNo, deleted: false }).session(session).select("_id").lean()
        if (existingInvoice) { return apiErrorResponce( res, "Invoice number already exists for this supplier.", null, 409 )}

        const warehouses = await BusinessUnit.find({ business_unit_type: "warehouse", status: "active", deleted: false }).session(session).select("_id business_unit_id business_unit_name").lean()

        if (warehouses.length === 0) { throw new Error( "No active warehouse is configured." )}
        if (warehouses.length > 1) { throw new Error( "Multiple active warehouses detected. Configure exactly one active warehouse." )}

        const warehouse = warehouses[0]
        const dbProducts = await Product.find({ _id: { $in: productIds },deleted: false, status: { $in: [ "active", "out_of_stock" ] }}) .session(session).select( "_id product_name product_barcode product_UOM status deleted").lean()

        if ( dbProducts.length !== normalizedProducts.length ) { throw new Error( "One or more products are invalid, deleted, or unavailable." )}

        const productMap = new Map( dbProducts.map(product => [ product._id.toString(), product ]))

        let baseAmount = 0
        let gstAmount = 0
        let totalOtherExpenses = 0

        const purchaseProducts = []

        for (const item of normalizedProducts) {
            const product = productMap.get( item.product_id.toString())
            if (!product) { throw new Error( "Product not found." )}

            const lineBaseAmount = item.purchase_cost * item.quantity_received
            const lineGstAmount = lineBaseAmount * item.gst_percentage / 100
            const lineOtherExpenses = item.other_expenses * item.quantity_received 
            const lineTotal = roundMoney( lineBaseAmount + lineGstAmount + lineOtherExpenses )

            baseAmount += lineBaseAmount
            gstAmount += lineGstAmount
            totalOtherExpenses += lineOtherExpenses

            purchaseProducts.push({
                product_id: item.product_id,
                batch_no: item.batch_no,
                free_received: item.free_received,
                quantity_received: item.quantity_received,
                size: item.size,
                manufacture_date: item.manufacture_date,
                expiry_date: item.expiry_date,
                best_before: item.best_before,
                mrp: item.mrp,
                purchase_cost: item.purchase_cost,
                gst_percentage: item.gst_percentage,
                other_expenses: item.other_expenses,
                selling_price: item.selling_price,
                line_total: lineTotal
            })
        }

        baseAmount = roundMoney(baseAmount)
        gstAmount = roundMoney(gstAmount)
        totalOtherExpenses = roundMoney(totalOtherExpenses)

        const subTotalAmount = roundMoney( baseAmount + gstAmount )
        if ( discountReceived > subTotalAmount ) { throw new Error( "Discount cannot exceed subtotal amount." )}

        const grandTotal = roundMoney( subTotalAmount - discountReceived +  totalOtherExpenses )

        if (grandTotal < 0) { throw new Error( "Calculated grand total cannot be negative." )}
        if (paidAmount > grandTotal) { throw new Error( "Paid amount cannot exceed grand total." )}

        const balanceAmount = roundMoney( grandTotal - paidAmount )

        let paymentStatus = "Pending"

        if (paidAmount === 0) { paymentStatus = "Pending" }
        else if (balanceAmount === 0) { paymentStatus = "Paid" }
        else { paymentStatus = "Partial" }
        if (paidAmount > 0 && !paymentDate) { paymentDate = new Date() }
        if (paidAmount === 0 && paymentDate) { throw new Error( "Payment date cannot be provided when paid amount is zero." )}

        const payments = []

        if (paidAmount > 0) {
            payments.push({ payment_method: paymentMethod, amount: paidAmount, payment_date: paymentDate })
        }

        const [purchase] = await Purchase.create([{
            supplier_id: supplier._id,
            purchase_id: `PUR${generateRandom10DigitNumber()}`,
            supplier_invoice_no: supplierInvoiceNo,
            invoice_date: invoiceDate,
            delivery_date: deliveryDate,
            products: purchaseProducts,
            payments,
            payment_status: paymentStatus,
            sub_total_amount: subTotalAmount,
            discount_received: discountReceived,
            gst_amount: gstAmount,
            grand_total: grandTotal,
            paid_amount: paidAmount,
            balance_amount: balanceAmount,
            added_by: staffId,
            deleted: false,
            history: {}
        }], { session })

        for (const item of normalizedProducts) {
            const product = productMap.get( item.product_id.toString())
            const gstPerUnit = roundMoney( item.purchase_cost * item.gst_percentage / 100 )
            const unitPurchaseCost = roundMoney( item.purchase_cost + gstPerUnit + item.other_expenses )

            let inventory = await ProductInventory.findOne({ product_id: product._id, deleted: false }).session(session)

            if (!inventory) {
                const batch = { 
                    batch_no: item.batch_no,
                    size: item.size,
                    manufacture_date: item.manufacture_date,
                    expiry_date: item.expiry_date,
                    best_before: item.best_before,
                    quantity: item.total_received,
                    reserved_quantity: 0,
                    mrp: item.mrp,
                    purchase_cost: item.purchase_cost,
                    gst_percentage: item.gst_percentage,
                    other_expenses: item.other_expenses,
                    unit_purchase_cost: unitPurchaseCost,
                    selling_price: item.selling_price,
                    received_at: new Date()
                }

                try {
                    const created = await ProductInventory.create([{
                        product_id: product._id,
                        warehouse: { 
                            business_unit_id: warehouse._id,
                            total_stock: item.total_received,
                            reserved_stock: 0,
                            batches: [ batch ]
                        },
                        stores: [],
                        total_stock:
                        item.total_received,
                        low_stock_threshold: 5,
                        status: "active",
                        deleted: false 
                    }], { session })
                    inventory = created[0]
                }
                catch (error) {
                    if (error?.code === 11000) { throw new Error( `Inventory for ${product.product_name} was created concurrently. Please retry the purchase.`)}
                    throw error
                }
            }
            else {
                if ( !inventory.warehouse || !inventory.warehouse.business_unit_id ) { throw new Error( `Inventory for ${product.product_name} has no valid warehouse.` )}
                if ( inventory.warehouse.business_unit_id.toString() !== warehouse._id.toString() ) { throw new Error( `Inventory for ${product.product_name} belongs to another warehouse.` )}
                inventory.warehouse.batches.push({
                    batch_no: item.batch_no,
                    size: item.size,
                    manufacture_date: item.manufacture_date,
                    expiry_date: item.expiry_date,
                    best_before: item.best_before,
                    quantity: item.total_received,
                    reserved_quantity: 0,
                    mrp: item.mrp,
                    purchase_cost: item.purchase_cost,
                    gst_percentage: item.gst_percentage,
                    other_expenses: item.other_expenses,
                    unit_purchase_cost: unitPurchaseCost,
                    selling_price: item.selling_price,
                    received_at: new Date()
                })

                inventory.warehouse.total_stock = roundMoney( inventory.warehouse.total_stock + item.total_received )
                inventory.total_stock = roundMoney( inventory.total_stock + item.total_received )
                inventory.status = "active"

                await inventory.save({ session })
            }

            await Product.updateOne({ _id: product._id, deleted: false },
                { 
                    $inc: { current_stock: item.total_received },
                    $set: { latest_batch_details: {
                        batch_no: item.batch_no,
                        size: item.size,
                        manufacture_date: item.manufacture_date,
                        expiry_date: item.expiry_date,
                        best_before: item.best_before,
                        mrp: item.mrp,
                        purchase_cost: item.purchase_cost,
                        gst_percentage: item.gst_percentage,
                        other_expenses: item.other_expenses,
                        unit_purchase_cost: unitPurchaseCost,
                        selling_price: item.selling_price
                    }}
                }, { session }
            )

            await ProductTransaction.create([{ 
                product_id: product._id,
                purchase_id: purchase._id,
                batch_no: item.batch_no,
                transaction_type: "stock_in",
                source: "purchase",
                quantity: item.total_received,
                purchase_cost: unitPurchaseCost,
                total_amount: roundMoney( unitPurchaseCost * item.total_received ),
                reference_id: purchase._id,
                reference_type: "Purchase",
                reference_no: purchase.purchase_id,
                created_by: staffId,
                note: `Stock received from purchase ${purchase.purchase_id}.`
            }], { session })
        }

        await Supplier.updateOne({ _id: supplier._id },
            {
                $inc: { total_purchase_amount: grandTotal, total_orders: 1 },
                $set: { last_purchase_date: deliveryDate }
            }, { session }
        )

        if (paidAmount > 0) {
            await Transaction.create( [{
                type: "expense",
                category: "Purchase",
                title: "Purchase Expense",
                amount: paidAmount,
                payment_method: paymentMethod,
                reference_no: purchase.purchase_id,
                purchase_id: purchase._id,
                notes: `Purchase from supplier ${supplier.supplier_name}.`,
                transaction_date: paymentDate,
                performed_by: staffId,
                metadata: {
                    supplier_id: supplier._id,
                    supplier_invoice_no: supplierInvoiceNo,
                    payment_status: paymentStatus,
                    grand_total: grandTotal,
                    paid_amount: paidAmount,
                    balance_amount: balanceAmount
                }
            }], { session })
        }

        await RecentActivity.create([{
            performed_by: staffId,
            activity_type: "purchase",
            action: "created",
            title: "Purchase Created",
            description: `Purchase ${purchase.purchase_id} created successfully`,
            reference_id: purchase._id,
            reference_model: "Purchase",
            metadata: { 
                purchase_id: purchase.purchase_id,
                product_count: purchaseProducts.length,
                grand_total: grandTotal,
                paid_amount: paidAmount,
                balance_amount: balanceAmount,
                payment_method: paymentMethod,
                payment_status: paymentStatus
            }
        }], { session })

        await session.commitTransaction()

        const data = {
            purchase_id: purchase._id,
            purchase_no: purchase.purchase_id,
            warehouse_id: warehouse._id,
            product_count: purchaseProducts.length,
            sub_total_amount: subTotalAmount,
            gst_amount: gstAmount,
            discount_received: discountReceived,
            other_expenses: totalOtherExpenses,
            grand_total: grandTotal,
            paid_amount: paidAmount,
            balance_amount: balanceAmount,
            payment_method: paymentMethod,
            payment_status: paymentStatus
        }

        return apiSucessResponce( res,  "Purchase created and inventory updated successfully.", data, 201 )

    }
    catch (error) {
        if (session.inTransaction()) { await session.abortTransaction() }
        console.error( "adminCreatePurchase error:", error )

        if (error?.name === "ValidationError") { return apiErrorResponce( res, "Invalid purchase data.", null, 400 )}
        if (error?.name === "CastError") {  return apiErrorResponce( res, "Invalid data provided.", null, 400 )}
        if (error?.code === 11000) { return apiErrorResponce( res, "Purchase or supplier invoice already exists.", null, 409 )}

        const validationMessages = new Set([
            "Supplier not found or inactive.",
            "No active warehouse is configured.",
            "Multiple active warehouses detected. Configure exactly one active warehouse.",
            "Product not found.",
            "Discount cannot exceed subtotal amount.",
            "Calculated grand total cannot be negative.",
            "Paid amount cannot exceed grand total.",
            "Payment date cannot be provided when paid amount is zero.",
            "At least one product is required.",
            "Products must be an array."
        ])


        if ( typeof error?.message === "string" && ( validationMessages.has(error.message) || error.message.includes("is required.") || error.message.includes("is invalid.") || error.message.includes("must be") || error.message.includes("cannot") || error.message.includes("cannot exceed") || error.message.includes("cannot be") || error.message.includes("exceeds the allowed limit") || error.message.includes("between") )) {
            return apiErrorResponce( res, error.message, null, 400 )
        }
        return apiErrorResponce( res, "Unable to create purchase. Please try again.", null, 500 )
    }
    finally {
        await session.endSession()
    }
}















































// testing
export const fetchAllAdminPurchases = async(req , res)=>{
    try {
        const purchases = await Purchase.find().sort({createdAt : -1})

        apiSucessResponce(res , "purchases Fetched Sucessfully" , {purchases})
    } catch (error) {
        console.log("error in fetchAllAdminPurchases controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const getpurchase = async(req , res)=>{
    try {
        const {id} = req.params
        console.log(id)
        const purchase = await Purchase.findOne({_id: id})

        if(!purchase) {return apiErrorResponce(res , "No purchase Found" )}

        return apiSucessResponce(res , "Order Fetched Sucessfully" , purchase )
    } catch (error) {
        console.log("error in getPurchase controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}
















// old code


export const adminFetchAllPurchases = async(req,res)=>{
    try {
        const purchaseBooks = await Purchase.find()
        .populate([{ path: 'supplier_id', strictPopulate: false }])
        return apiSucessResponce(res, "Purchase Books Fetched Sucessfully", purchaseBooks)
    } catch (error) {
        console.log("error in fetchAllPurchases controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchPurchaseBook = async(req,res)=>{
    try {
        const {id} = req.params
        if(!validateMongooseId(id)){return apiErrorResponce(res, "Invalid Credentials")}
        const purchaseBook = await Purchase.findOne({_id : id})
        return apiSucessResponce(res, "Purchase Book Found Successfully", purchaseBook)
    } catch (error) {
        console.log("error in adminFetchPurchaseBook controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}


export const adminFetchAllSuppliersForPurchaseBook = async(req, res)=>{
    try {
        const suppliers = await Supplier.find().select(["_id", "supplier_id", "supplier_name"])
        return apiSucessResponce(res, "All Suppliers Fetched Successfully", suppliers)
    } catch (error) {
        console.log("error in adminFetchAllSuppliersForPurchaseBook controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchProductsByBarcodeForPurchaseEntry = async(req, res)=>{
    try {
        const {id} = req.params
        const product = await Product.findOne({product_barcode : id, deleted: false}).select(['_id', 'product_barcode', 'product_name'])
        if(product){
            return apiSucessResponce(res, "Product found Successfully", product)
        }
        return apiErrorResponce(res , "Invalid Barcode")
    } catch (error) {
        console.log("error in adminFetchProductsByBarcodeForPurchaseEntry controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchProductsByNameForPurchaseEntry = async(req, res)=>{
    try {
        const { name } = req.params;
        const products = await Product.find({product_name : {$regex: name, $options: 'i'} , deleted: false}).select(['_id', 'product_barcode', 'product_name' ]).limit(10)
        return apiSucessResponce(res, "Products found Successfully", products)
    } catch (error) {
        console.log("error in adminFetchProductsByBarcodeForPurchaseEntry controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}
