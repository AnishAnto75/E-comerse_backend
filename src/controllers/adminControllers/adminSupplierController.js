import mongoose from "mongoose";
import Supplier from '../../models/SupplierModel.js' 
import RecentActivity from "../../models/RecentActivityModel.js";
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { generateRandom10DigitNumber } from '../../utils/generateRandomNumber.js'

export const createSupplier = async (req, res) => {

    const session = await mongoose.startSession();

    try {
        const { supplier_name, supplier_contact_person, supplier_contact_person_phone, supplier_email, supplier_phone, supplier_gst_no, supplier_address, supplier_bank_details, payment_terms, supplier_type, notes } = req.body;

        if (!supplier_name?.trim()) { return apiErrorResponce(res, "Supplier name is required") }
        if (!supplier_phone?.trim()) { return apiErrorResponce(res, "Supplier phone no. is required") }
        
        session.startTransaction();

        // validation
        const existingSupplier = await Supplier.findOne({ supplier_name: supplier_name.trim(), deleted: false}).session(session);
        if (existingSupplier) {
            await session.abortTransaction();
            return apiErrorResponce(res, "Supplier already exists");
        }
        const existingPhone = await Supplier.findOne({ supplier_phone: supplier_phone.trim(), deleted: false }).session(session);
        if (existingPhone) {
            await session.abortTransaction();
            return apiErrorResponce(res, "Phone number already exists");
        }
        if (supplier_gst_no?.trim()) {
            const existingGST = await Supplier.findOne({ supplier_gst_no: supplier_gst_no.trim().toUpperCase(), deleted: false}).session(session);
            if (existingGST) {
                await session.abortTransaction();
                return apiErrorResponce(res, "GST number already exists");
            }
        }

        const randomNumber = generateRandom10DigitNumber()

        const formattedData = {
            supplier_id : `SUP${randomNumber}`,
            supplier_name: supplier_name.trim(),
            supplier_contact_person : supplier_contact_person?.trim(),
            supplier_contact_person_phone : supplier_contact_person_phone?.trim(),
            supplier_email : supplier_email?.trim().toLowerCase(),
            supplier_phone : supplier_phone.trim(),
            supplier_gst_no : supplier_gst_no?.trim().toUpperCase(),
            supplier_address,
            supplier_bank_details,
            payment_terms,
            supplier_type,
            notes
        }
        const supplier = await Supplier.create([formattedData], { session });

        await RecentActivity.create([{
            user_id: req.user._id,
            activity_type: "supplier",
            action: "created",
            title: "Supplier Added",
            description: `Supplier "${supplier[0].supplier_name}" has been created successfully..`,
            reference_id: supplier[0]._id,
            reference_model: "Supplier",
            metadata: {
                supplier_id: supplier[0].supplier_id,
                supplier_name: supplier[0].supplier_name,
            }
        }], { session });

        await session.commitTransaction();
        return apiSucessResponce( res, "Supplier created successfully", supplier[0]);

    } catch (error) {
        await session.abortTransaction();
        console.log("Error in createSupplier",error);
        return apiErrorResponce(res, "Internal Server Error" );
    } finally { session.endSession() }
};

export const adminFetchSupplierPage = async (req, res) => {
    try {

        const page = Math.max( parseInt(req.query.page) || 1, 1)
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit;

        const status = req.query.status?.trim()
        const search = req.query.search?.trim()

        const match = { deleted: false }
        if (status && status !== "all") {
            if (!["active", "inactive"].includes(status)) { return }
            match.status = status;
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = { $regex: escapedSearch, $options: "i" }
            match.$or = [
                { supplier_id: searchRegex },
                { supplier_name: searchRegex },
                { supplier_phone: searchRegex }
            ]
        }

        const [ summaryResult, suppliers, totalSuppliers ] = await Promise.all([
            Supplier.aggregate([
                { $match: { deleted: false }},
                { $group: {
                    _id: null,
                    total_suppliers: { $sum: 1 },
                    active_suppliers: {$sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0 ]}},
                    inactive_suppliers: { $sum: { $cond: [ { $eq: ["$status", "inactive"] }, 1, 0 ]}}
                }},
                { $project: {
                    _id: 0,
                    total_suppliers: 1,
                    active_suppliers: 1,
                    inactive_suppliers: 1
                }}
            ]),

            Supplier.find(match)
                .select(` _id supplier_id supplier_name supplier_phone supplier_contact_person supplier_contact_person_phone supplier_email supplier_gst_no supplier_address.city status`)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Supplier.countDocuments(match)
        ]);

        const summary = summaryResult[0] || {
            total_suppliers: 0,
            active_suppliers: 0,
            inactive_suppliers: 0
        };

        const totalPages = Math.ceil(totalSuppliers / limit);

        const data = {
            summary,
            suppliers,
            pagination: {
                current_page: page,
                limit,
                total_suppliers: totalSuppliers,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            }
        }
        return apiSucessResponce( res, "Supplier dashboard data fetched successfully.", data, 200 )
    } catch (error) {

        console.error( "Error in adminFetchSupplierPage:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}

export const adminFetchSupplier = async(req,res)=>{
    try {
        const {id} = req.params
        const supplier = await Supplier.findOne({supplier_id : id, deleted: false})
        return apiSucessResponce(res, "Supplier Found Successfully", supplier)
    } catch (error){
        console.log("error in adminFetchSupplier controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}




















// old code
export const adminFetchAllSuppliers = async(req,res)=>{
    try {
        const suppliers = await Supplier.find()
        return apiSucessResponce(res, "All Suppliers Fetched Sucessfully", suppliers)
    } catch (error) {
        console.log("error in adminFetchAllSuppliers controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}



