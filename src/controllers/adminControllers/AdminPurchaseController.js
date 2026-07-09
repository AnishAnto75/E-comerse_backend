import mongoose from "mongoose"
import ProductInventory from "../../models/ProductInventoryModel.js"
import Product from "../../models/ProductModel.js"
import Purchase from "../../models/PurchaseModel.js"
import Supplier from "../../models/SupplierModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateDate, validateMongooseId} from "../../utils/validateTypes.js"
import { generateRandom10DigitNumber } from "../../utils/generateRandomNumber.js"
import Transaction from "../../models/TransactionModel.js"
import RecentActivity from "../../models/recentActivityModel.js"


export const adminCreatePurchase = async(req, res)=>{

    const session = await mongoose.startSession();

    try{
        const { supplier_id, supplier_invoice_no, invoice_date, delivery_date, products, payment_method, discount_received = 0, paid_amount = 0, payment_date } = req.body;

        if ( !supplier_id || !supplier_invoice_no?.trim() || !invoice_date || !delivery_date){ return apiErrorResponce(res,"Missing required fields");}
        if(!Array.isArray(products) || products.length===0){ return apiErrorResponce(res,"Please add at least one product");}

        session.startTransaction();

        // Validation
        const supplier = await Supplier.findOne({ _id:supplier_id, deleted: false, status:"active"}).session(session);
        if(!supplier){await session.abortTransaction(); return apiErrorResponce(res,"Invalid supplier");}

        const existingInvoice = await Purchase.findOne({ supplier_id, supplier_invoice_no: supplier_invoice_no.trim(), deleted:false }).session(session);
        if(existingInvoice){await session.abortTransaction(); return apiErrorResponce( res, "Invoice number already exists for this supplier");}

        const ids = products.map(item=>item.product_id);
        if(new Set(ids).size !== ids.length){ await session.abortTransaction(); return apiErrorResponce(res, "Duplicate products are not allowed")}

        const dbProducts = await Product.find({ _id:{ $in: ids }, deleted:false}).session(session);
        if(dbProducts.length !== ids.length){ await session.abortTransaction();  return apiErrorResponce(res, "One or more products are invalid" );}

        const productMap = new Map();
        dbProducts.forEach(product=>{ productMap.set(product._id.toString(), product);});

        // formatting product data and calculating sub_total and gst_amount for purchase
        let formattedProducts = [];
        let subTotal = 0;
        let gstAmount = 0;
        const round = (value)=>Number(value.toFixed(2));
        
        for(const item of products){
            const product = productMap.get(item.product_id.toString());
            const quantity = Number(item.quantity_received);
            const purchaseCost = Number(item.purchase_cost);
            const gst = Number(item.gst_percentage);
            const otherExpenses = Number(item.other_expenses);
            const mrp = Number(item.mrp);
            const sellingPrice = Number(item.selling_price);
            const freeReceived = Number(item.free_received || 0);

            // validating product
            if( !Number.isFinite(quantity) || quantity <= 0){ await session.abortTransaction(); return apiErrorResponce( res, `Invalid quantity for ${product.product_name}` )}
            if( !Number.isFinite(purchaseCost) || purchaseCost < 0 ){ await session.abortTransaction(); return apiErrorResponce( res, `Invalid purchase cost for ${product.product_name}` )}
            if( !Number.isFinite(gst) || gst < 0){ await session.abortTransaction(); return apiErrorResponce( res, `Invalid GST for ${product.product_name}`)}
            if( !Number.isFinite(otherExpenses) || otherExpenses < 0){ await session.abortTransaction();  return apiErrorResponce( res, `Invalid other expenses for ${product.product_name}` )}
            if( !Number.isFinite(mrp) || mrp < 0){ await session.abortTransaction(); return apiErrorResponce( res, `Invalid MRP for ${product.product_name }`) }
            if( !Number.isFinite(sellingPrice) || sellingPrice < 0){await session.abortTransaction(); return apiErrorResponce( res, `Invalid selling price for ${product.product_name}`) }
            if( !Number.isFinite(freeReceived) || freeReceived < 0) { await session.abortTransaction(); return apiErrorResponce(res, `Invalid free quantity for ${product.product_name}`) }
            if( sellingPrice > mrp) { await session.abortTransaction(); return apiErrorResponce(res, `${product.product_name}: Selling price cannot exceed MRP`);}
            if( item.manufacture_date && item.expiry_date && new Date(item.expiry_date) <= new Date(item.manufacture_date)) { await session.abortTransaction(); return apiErrorResponce(res, `${product.product_name}: Expiry date must be after manufacture date`) }

            const lineAmount = round(quantity * purchaseCost);
            const gstValue = round((lineAmount * gst)/100);
            const lineTotal = round( lineAmount + gstValue + otherExpenses );

            gstAmount += gstValue;
            subTotal += lineTotal;

            formattedProducts.push({
                product_id: product._id,
                batch_no:item.batch_no?.trim() || "",
                free_received: freeReceived,
                quantity_received: quantity,
                size: item.size,
                manufacture_date: item.manufacture_date || null,
                expiry_date: item.expiry_date || null,
                best_before: item.best_before || null,
                mrp,
                purchase_cost: purchaseCost,
                gst_percentage: gst,
                other_expenses: otherExpenses,
                selling_price: sellingPrice,
                line_total: lineTotal
            });
        }

        subTotal = round(subTotal);
        gstAmount = round(gstAmount);

        if(Number(discount_received) > subTotal){
            await session.abortTransaction();
            return apiErrorResponce(res, "Discount cannot exceed subtotal");
        }

        const grandTotal = round( subTotal - Number(discount_received));
        if(Number(paid_amount) > grandTotal){ await session.abortTransaction(); return apiErrorResponce( res, "Paid amount cannot exceed grand total");}

        const balanceAmount = round( grandTotal - Number(paid_amount));

        let paymentStatus = "Pending";
        if(balanceAmount === 0){ paymentStatus = "Paid";}
        else if(Number(paid_amount) > 0){ paymentStatus = "Partial";}

        const purchaseData = {
            supplier_id,
            purchase_id : `PUR${generateRandom10DigitNumber()}`,
            supplier_invoice_no: supplier_invoice_no.trim(),
            invoice_date,
            delivery_date,
            products: formattedProducts,
            payment_method,
            payment_status: paymentStatus,
            sub_total_amount: subTotal,
            discount_received: Number(discount_received),
            gst_amount: gstAmount,
            grand_total: grandTotal,
            paid_amount: Number(paid_amount),
            balance_amount: balanceAmount,
            payment_date: Number(paid_amount) > 0 ? (payment_date || new Date()) : null,
            added_by: req.user._id
        };

        const purchase = await Purchase.create( [purchaseData] , { session });

        // Inventory and Product update 
        for(const item of formattedProducts){
            const product = productMap.get(item.product_id.toString());
            const totalStock = item.quantity_received + item.free_received;
            const inventory = await ProductInventory.findOne({ product_id:item.product_id}).session(session);

            let updatedTotalStock = totalStock;

            // create inventory if new product
            if(!inventory){
                await ProductInventory.create([{
                    product_id:item.product_id,
                    product_barcode: product.product_barcode,
                    product_total_stock: totalStock,
                    product_stock:[{
                        purchase_id:purchase[0]._id,
                        batch_no:item.batch_no,
                        stock:totalStock,
                        size:item.size,
                        manufacture_date: item.manufacture_date || null,
                        expiry_date: item.expiry_date || null,
                        best_before: item.best_before || null,
                        mrp : item.mrp,
                        purchase_cost: item.purchase_cost,
                        gst_percentage: item.gst_percentage,
                        other_expenses: item.other_expenses,
                        selling_price: item.selling_price
                    }]
                }],{ session });
            }
            // update inventory
            else{
                inventory.product_total_stock += totalStock;

                updatedTotalStock = inventory.product_total_stock;

                inventory.product_stock.push({
                    purchase_id:purchase[0]._id,
                    batch_no:item.batch_no,
                    stock:totalStock,
                    size:item.size,
                    manufacture_date: item.manufacture_date,
                    expiry_date: item.expiry_date,
                    best_before: item.best_before,
                    mrp:item.mrp,
                    purchase_cost: item.purchase_cost,
                    gst_percentage: item.gst_percentage,
                    other_expenses: item.other_expenses,
                    selling_price: item.selling_price
                });
                await inventory.save({ session });
            }

             // update latest batch in product
            await Product.updateOne( { _id: item.product_id },
                { $set: {
                    current_stock: updatedTotalStock,
                    out_of_stock: updatedTotalStock <= 0,
                    latest_batch_details: {
                        batch_no: item.batch_no,
                        size: item.size,
                        manufacture_date: item.manufacture_date || null,
                        expiry_date: item.expiry_date || null,
                        best_before: item.best_before || 0,
                        mrp: item.mrp,
                        purchase_cost: item.purchase_cost,
                        gst_percentage: item.gst_percentage,
                        other_expenses: item.other_expenses,
                        selling_price: item.selling_price,
                    }}
                }, { session }
            )
        }

        // updating supplier
        supplier.total_purchase_amount = round(supplier.total_purchase_amount + grandTotal);
        supplier.total_orders += 1;
        supplier.last_purchase_date = delivery_date;
        await supplier.save({ session });

        // recording transactions
        if(Number(paid_amount) > 0){
            await Transaction.create([{
                type: "expense",
                category: "Purchase",
                title: `Purchased ${purchase[0].purchase_id}`,
                amount: Number(paid_amount),
                payment_method,
                reference_no: purchase[0].purchase_id,
                purchase_id: purchase[0]._id,
                transaction_date: payment_date || new Date(),
                added_by:req.user._id
            }],{ session });
        }

        // recording recentActivity
        await RecentActivity.create([{
            user_id: req.user._id,
            activity_type: "purchase",
            action: "created",
            title: "Purchase Created",
            description: `Purchase ${purchase[0].purchase_id} created successfully.`,
            reference_id: purchase[0]._id,
            reference_model: "Purchase",
            metadata: {
                purchase_id: purchase[0].purchase_id,
                supplier_id: supplier._id,
                supplier_name: supplier.supplier_name,
                paid_amount,
                grand_total,
                payment_status
            }
        }], { session });

        await session.commitTransaction();
        return apiSucessResponce( res, "Purchase entry created successfully", purchase[0]);

    } catch (error) {
        await session.abortTransaction();
        console.log("error in adminCreatePurchase :", error);
        return apiErrorResponce( res, "internal server error", null, 500);

    } finally { await session.endSession();}
}

export const adminSearchProductsForCreatePurchase = async (req, res) => {
    try {
        const { query } = req.query;
        
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
};





























// old code

// export const adminCreatePurchase = async(req, res)=>{
//     const {user} = req.body
//     const {data} = req.body
//     if(!data){return apiErrorResponce(res, "Invalid Credentials")}

//     if(!data.supplier_id || !data.invoice_no || !data.products || !data.total_purchase_amount ){return apiErrorResponce(res, "Invalid Credentials")}

//     data['added_by'] = user._id

//     const validSupplierId = validateMongooseId(data.supplier_id) 
//     if(!validSupplierId) {return apiErrorResponce(res, "Invalid Credentials")}
 
//     const validSupplier = await Supplier.findOne({_id : data.supplier_id})
//     if(!validSupplier) {return apiErrorResponce(res, "Invalid Credentials")}
        
//     const validatePurchase = await Purchase.findOne({supplier_id: data.supplier_id, invoice_no: data.invoice_no })
//     if(validatePurchase){return apiErrorResponce(res , "Invoice No Already Existed")}
    
//     const productBarcodes = data.products.map( product => product.product_barcode)
//     const validProduct = await Product.find({product_barcode : productBarcodes, deleted: false})
//     if(validProduct.length !== data.products.length) {return apiErrorResponce(res, "Invalid Credentials")}
    
//     let validProduct1 = true
//     data.products?.forEach((product, index) => {
//         if(product.expire_date){
//             if(!validateDate(product.expire_date)){ validProduct1 = false; return }
//         }
//         if(product.manufacture_date){
//             if(!validateDate(product.manufacture_date) ){ validProduct1 = false; return }
//         }
//         if(product.quantity_recieved < 1 || !product.product_barcode || !product.quantity_recieved || !product.size || !product.mrp || !product.purchase_cost || !product.gst || Number.isNaN(Number(product.other_expences)) || !product.price || !product.total_purchase_cost){
//             validProduct1 = false
//             return
//         }
//     })
//     if(!validProduct1){return apiErrorResponce(res, "Invalid Credentials")}
        
//     const session = await mongoose.startSession();
//     try {
//         session.startTransaction();

//         const formatedData = {
//             supplier_id : data.supplier_id,
//             invoice_no : data.invoice_no,
//             products : data.products,
//             total_purchase_amount : data.total_purchase_amount,
//             discount_received : data.discount_received,
//             total_amount : data.total_amount,
//             added_by : user._id
//         }

//         const purchase = new Purchase(formatedData)
//         await purchase.save({session})

//         for (const product of data.products) {
//             const productInventory = await ProductInventory.findOne({product_barcode : product.product_barcode}).session(session)
//             if (!productInventory) { throw new Error(`Inventory not found for ${product.product_barcode}`)}
//             const formatedData = {
//                 batch_no : product.batch_no,
//                 stock : product.quantity_recieved,
//                 size : product.size,
//                 manufacture_date : product.manufacture_date,
//                 expire_date : product.expire_date,
//                 best_before : product.best_before,
//                 mrp : product.mrp,
//                 purchase_cost : product.purchase_cost ,
//                 gst : product.gst ,
//                 other_expences : product.other_expences ,
//                 price: product.price,
//                 total_purchase_cost : product.total_purchase_cost
//             }
//             productInventory.product_stock.push(formatedData)
//             productInventory.product_total_stock = Number(productInventory.product_total_stock) + Number(product.quantity_recieved)
//             await productInventory.save({session})
//         }

//         await session.commitTransaction();

//         return apiSucessResponce(res , "Purchase Book created", purchase, 201)

//     } catch (error) {
//         await session.abortTransaction();
//         console.log("error in adminCreatePurchase :" , error)
//         return apiErrorResponce(res, "internal server error", null, 500 )
//     } finally {
//         await session.endSession();
//     }
// }


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
