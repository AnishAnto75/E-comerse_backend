import Product from "../../models/ProductModel.js"
import Purchase from "../../models/PurchaseModel.js"
import Supplier from "../../models/SupplierModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateMongooseId} from "../../utils/validateTypes.js"

export const adminCreatePurchase = async(req, res)=>{
    try {
        const {user} = req.body
        const {data} = req.body
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        if(!data.supplier_id || !data.invoice_no || !data.products || !data.total_purchase_amount || !data.payment_done){return apiErrorResponce(res, "Invalid Credentials")}
        data['added_by'] = user._id

        const validatePurchase = await Purchase.findOne({supplier_id: data.supplier_id, invoice_no: data.invoice_no })
        if(validatePurchase){return apiErrorResponce(res , "Invoice No Already Entered")}

        const product_barcodes = data.products?.map((product)=>{return product.product_barcode})
        let products = await Product.find({product_barcode: product_barcodes, deleted: false})
        if(product_barcodes.length !== products.length){return apiErrorResponce(res, "Few product Not Found")}

        const filteredProducts = products.map((product, index) => {
            const ps = data.products.filter(ps=> ps.product_barcode == product.product_barcode)[0]
            const dta = {
                batch_no: ps.batch_no ,
                stock : ps.quantity_recieved,
                quantity : ps.quantity,
                manufacture_date: ps.manufacture_date,
                expire_date: ps.expire_date,
                best_before: ps.best_before,
                mrp: ps.mrp,
                purchase_cost : ps.purchase_cost ,
                other_expences : ps.other_expences,
                gst : ps.gst,
                price: ps.price,
                added_by : user._id
            }
            product.product_stock.push(dta)
            product.product_total_stock = parseInt(ps.quantity_recieved) + parseInt(product.product_total_stock)
            return product
        })

        const purchase = new Purchase(data)
        await purchase.save()

        filteredProducts?.forEach(async(pro, index) => {
            await Product.findOneAndUpdate({ _id: pro._id }, { product_stock: pro.product_stock, product_total_stock: pro.product_total_stock }, {new: true} )
        })

        return apiSucessResponce(res , "Purchase Book created", purchase, 201)

    } catch (error) {
        console.log("error in adminCreatePurchase :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

export const adminFetchAllPurchases = async(req,res)=>{
    try {
        const purchaseBooks = await Purchase.find().populate([{ path: 'supplier_id', strictPopulate: false }]);
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
        const suppliers = await Supplier.find().select(['supplier_name', "supplier_id"])
        return apiSucessResponce(res, "All Suppliers Fetched Sucessfully", suppliers)
    } catch (error) {
        console.log("error in adminFetchAllSuppliersForPurchaseBook controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchProductsByBarcodeForPurchaseEntry = async(req, res)=>{
    try {
        const {barcode} = req.params
        const products = await Product.findOne({product_barcode : barcode, deleted: false}).select(['_id', 'product_barcode', 'product_name', 'product_total_stock', 'product_stock', ])
        return apiSucessResponce(res, "Products found Successfully", products)
    } catch (error) {
        console.log("error in adminFetchProductsByBarcodeForPurchaseEntry controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchProductsByNameForPurchaseEntry = async(req, res)=>{
    try {
        const { name } = req.params;
        const products = await Product.find({product_name : {$regex: name, $options: 'i'} , deleted: false}).select(['_id', 'product_barcode', 'product_name', 'product_total_stock', 'product_stock', ]).limit(5)
        return apiSucessResponce(res, "Products found Successfully", products)
    } catch (error) {
        console.log("error in adminFetchProductsByBarcodeForPurchaseEntry controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}