import ProductInventory from "../../models/ProductInventoryModel.js"
import Product from "../../models/ProductModel.js"
import Purchase from "../../models/PurchaseModel.js"
import Supplier from "../../models/SupplierModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateDate, validateMongooseId} from "../../utils/validateTypes.js"

export const adminCreatePurchase = async(req, res)=>{
    try {
        const {user} = req.body
        const {data} = req.body
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        if(!data.supplier_id || !data.invoice_no || !data.products || !data.total_purchase_amount ){return apiErrorResponce(res, "Invalid Credentials")}

        data['added_by'] = user._id

        const validSupplierId = validateMongooseId(data.supplier_id) 
        if(!validSupplierId) {return apiErrorResponce(res, "Invalid Credentials")}

        const validSupplier = await Supplier.findOne({_id : data.supplier_id})
        if(!validSupplier) {return apiErrorResponce(res, "Invalid Credentials")}

        const validatePurchase = await Purchase.findOne({supplier_id: data.supplier_id, invoice_no: data.invoice_no })
        if(validatePurchase){return apiErrorResponce(res , "Invoice No Already Existed")}

        const productBarcodes = []
        data.products?.map((product, index)=>productBarcodes.push(product.product_barcode))

        const validProduct = await Product.find({product_barcode : productBarcodes, deleted: false})
        if(validProduct.length !== data.products.length) {return apiErrorResponce(res, "Invalid Credentials")}

        let validProduct1 = true
        data.products?.forEach((product, index) => {
            if(product.expire_date){
                if(!validateDate(product.expire_date)){ validProduct1 = false; return }
            }
            if(product.manufacture_date){
                if(!validateDate(product.manufacture_date) ){ validProduct1 = false; return }
            }
            if(product.quantity_recieved <= 1){
                validProduct1 = false; return
            }
            if(!product.product_barcode || !product.quantity_recieved || !product.size || !product.mrp || !product.purchase_cost || !product.gst || !product.other_expences || !product.price){
                validProduct1 = false
                return
            }
        })
        if(!validProduct1){return apiErrorResponce(res, "Invalid Credentials")}

        const formatedData = {
            supplier_id : data.supplier_id,
            invoice_no : data.invoice_no,
            products : data.products,
            total_purchase_amount : data.total_purchase_amount,
            discount_received : data.discount_received,
            total_amount : data.total_amount,
            added_by : user._id
        }

        const purchase = new Purchase(formatedData)
        await purchase.save()

        let isInventorySaved = false
        data.products?.forEach(async(product, index) => {
            try {
                const productInventory = await ProductInventory.findOne({product_barcode : product.product_barcode})
                const formatedData = {
                    batch_no : product.batch_no,
                    stock : product.quantity_recieved,
                    size : product.size,
                    manufacture_date : product.manufacture_date,
                    expire_date : product.expire_date,
                    best_before : product.best_before,
                    mrp : product.mrp,
                    purchase_cost : product.purchase_cost ,
                    gst : product.gst ,
                    other_expences : product.other_expences ,
                    price: product.price
                }
                productInventory.product_stock.push(formatedData)
                productInventory.product_total_stock = Number(productInventory.product_total_stock) + Number(product.quantity_recieved)
                await productInventory.save()
                isInventorySaved = true
            } catch (error) {
                console.log(error)
                await Purchase.deleteOne({_id : purchase._id})
                isInventorySaved = false   
                return
            }
        })
        if(isInventorySaved) return apiErrorResponce(res, "Invalid Credentials")

        return apiSucessResponce(res , "Purchase Book created", purchase, 201)

    } catch (error) {
        console.log("error in adminCreatePurchase :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}


export const adminFetchAllPurchases = async(req,res)=>{
    try {
        const purchaseBooks = await Purchase.find()
        .populate([{ path: 'supplier_id', strictPopulate: false }]);
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
