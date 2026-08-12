import Staff from '../../models/StaffModel.js'
import bcrypt from 'bcrypt'
import User from '../../models/UserModel.js'
import { apiErrorResponce, apiSucessResponce } from '../../utils/apiResponce.js'
import { generateRandom10DigitNumber, generateRandom12DigitNumber } from '../../utils/generateRandomNumber.js'

export const adminCreateStaff = async (req, res) => {

    try {

        const { name, email, gender, department, role, salary, phone_number, alternate_phone_number, qualification, pancard_number, aadhar_number, DOB, joining_date } = req.body;

        const emergency_contact = JSON.parse(req.body.emergency_contact || "{}");
        const bank_details = JSON.parse(req.body.bank_details || "{}");
        const address = JSON.parse(req.body.address || "{}");

        const photo = req.file;

        if (!name?.trim()) return apiErrorResponce(res, "Staff name is required.");
        if (!gender) return apiErrorResponce(res, "Gender is required.");
        if (!department) return apiErrorResponce(res, "Department is required.");
        if (!role) return apiErrorResponce(res, "Role is required.");
        if (!phone_number?.trim()) return apiErrorResponce(res, "Phone number is required.");
        if (!joining_date || isNaN(new Date(joining_date))) return apiErrorResponce(res, "Joining date is required.");
        if (!address) return apiErrorResponce(res, "Address is required.");
        if (!address.house_no?.trim() || !address.area?.trim() || !address.city?.trim() || !address.district?.trim() || !address.state?.trim() || !address.pincode?.trim()) { return apiErrorResponce(res,"Complete address is required.") }
        if (!photo) return apiErrorResponce(res, "Staff photo is required.");

        const departmentRoles = {
            administration: ["admin", "general_manager", "manager", "assistant_manager", "staff", "bpo"],
            sales: ["manager", "assistant_manager", "staff", "bpo"],
            inventory: ["manager", "assistant_manager", "staff"],
            delivery: ["delivery", "staff"]
        };

        if (!departmentRoles[department]?.includes(role)) { return apiErrorResponce(res,"Invalid role for selected department.");}

        const duplicateConditions = [ { phone_number : phone_number.trim() } ];

        if (email?.trim()) { duplicateConditions.push({ email: email.trim().toLowerCase() }) }
        if (pancard_number?.trim()) { duplicateConditions.push({ pancard_number: pancard_number.trim().toUpperCase() }) }
        if (aadhar_number?.trim()) { duplicateConditions.push({ aadhar_number: aadhar_number.trim() });}

        const existingStaff = await Staff.findOne({ deleted: false, $or: duplicateConditions })

        if (existingStaff) {
            if (existingStaff.phone_number === phone_number.trim()) return apiErrorResponce(res, "Phone number already exists.");
            if (email && existingStaff.email === email.toLowerCase().trim()) return apiErrorResponce(res, "Email already exists.");
            if (pancard_number && existingStaff.pancard_number === pancard_number.toUpperCase().trim()) return apiErrorResponce(res, "PAN card already exists.");
            if (aadhar_number && existingStaff.aadhar_number === aadhar_number.trim()) return apiErrorResponce(res, "Aadhar number already exists.");
        }

        const staff = await Staff.create({

            staff_id: `STF${generateRandom12DigitNumber()}`,
            name: name.trim(),
            email: email?.trim().toLowerCase() || undefined,
            gender,
            department,
            role,
            salary: Number(salary) || 0,
            phone_number: phone_number.trim(),
            alternate_phone_number: alternate_phone_number?.trim() || null,
            qualification: qualification?.trim() || null,
            pancard_number: pancard_number?.trim().toUpperCase() || null,
            aadhar_number: aadhar_number?.trim() || null,
            DOB: DOB ? new Date(DOB) : null,
            emergency_contact: {
                name: emergency_contact.name?.trim() || null,
                phone_number: emergency_contact.phone_number?.trim() || null,
                relation: emergency_contact.relation || null
            },
            photo: {
                url : `/uploads/staff/${photo.filename}`,
                public_id: ""
            },
            bank_details: {
                bank_name: bank_details.bank_name?.trim() || null,
                account_number: bank_details.account_number?.trim() || null,
                branch_name: bank_details.branch_name?.trim() || null,
                ifsc: bank_details.ifsc?.trim().toUpperCase() || null,
                account_holder: bank_details.account_holder?.trim() || null
            },
            address: {
                house_no: address.house_no?.trim(),
                landmark: address.landmark?.trim() || "",
                area: address.area?.trim(),
                city: address.city?.trim(),
                district: address.district?.trim(),
                state: address.state?.trim(),
                pincode: address.pincode?.trim()
            },
            joining_date,
            created_by: req.user._id

        });

        return apiSucessResponce( res, "Staff created successfully.", staff, 201 );

    } catch (error) {
        console.log("Error in createStaff controller:", error);
        return apiErrorResponce( res, "Internal Server Error", error.message, 500 );
    }

}

export const adminFetchStaffPage = async (req, res) => {
    try {

        const page = Math.max( parseInt(req.query.page) || 1, 1 )
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit;

        const search = req.query.search?.trim() || "";
        const status = req.query.status?.trim() || "";
        const department = req.query.department?.trim() || "";
        const role = req.query.role?.trim() || "";

        const match = { deleted: false };

        if (status) { match.status = status }
        if (department) { match.department = department }
        if (role) { match.role = role }
        if (search) { match.$or = [
            { staff_id: { $regex: search, $options: "i"}},
            { name: { $regex: search, $options: "i" }},
            { email: { $regex: search, $options: "i" }},
            { phone_number: { $regex: search, $options: "i"}}
        ]}

        const summaryResult = await Staff.aggregate([
            { $match: { deleted: false }},
            { $group: {
                _id: null,
                total_employee: { $sum: 1 },
                active_employee: { $sum: { $cond: [{ $eq: ["$status", "active"]}, 1, 0 ]}},
                inactive_employee: { $sum: { $cond: [{ $eq: ["$status", "inactive"]}, 1, 0 ]}},
                blocked_employee: { $sum: { $cond: [{ $eq: ["$status", "blocked"]}, 1, 0 ]}}}
            },
            { $project: {
                _id: 0,
                total_employee: 1,
                active_employee: 1,
                inactive_employee: 1,
                blocked_employee: 1
            }}
        ])

        const totalStaff = await Staff.countDocuments(match);
        const totalPages = Math.ceil( totalStaff / limit )

        const staffs = await Staff.find(match)
            .select(` staff_id name email gender salary photo status department role phone_number DOB joining_date`)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const data = {
            summary: {
                total_employee: summaryResult[0]?.total_employee || 0,
                active_employee: summaryResult[0]?.active_employee || 0,
                inactive_employee: summaryResult[0]?.inactive_employee || 0,
                blocked_employee: summaryResult[0]?.blocked_employee || 0
            },
            staffs,
            pagination: {
                current_page: page,
                limit,
                total_staff: totalStaff,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            }
        }

        return apiSucessResponce( res, "Staff page fetched successfully", data, 200 )

    } catch (error) {
        console.error( "Error in adminFetchStaffPage:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}

export const adminFetchPreviewStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;
        if (!staff_id?.trim()) { return apiErrorResponce( res, "Staff ID is required", null, 400 )}

        const staff = await Staff.findOne({ staff_id: staff_id.trim(),deleted: false })
            .select(` staff_id name email gender department role salary phone_number alternate_phone_number emergency_contact DOB photo qualification pancard_number aadhar_number status joining_date last_login blocked_at blocked_reason `)
            .lean()

        if (!staff) { return apiErrorResponce( res, "Staff not found", null, 404 )}

        return apiSucessResponce( res, "Staff fetched successfully", staff, 200 )

    } catch (error) {
        console.error( "Error in adminFetchStaff:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}






















// old cold

export const adminFetchAllStaffs = async(req , res)=>{
    try {
        const staff = await Staff.find()
        return apiSucessResponce(res, "staff fetched sucessfully", staff)
    } catch (error) {
        console.log("error in adminFetchAllStaffs controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchStaff = async(req,res)=>{
    try {
        const {id} = req.params
        const staff = await Staff.findOne({staff_id : id})
        return apiSucessResponce(res, "Staff Found Successfully", staff)
    } catch (error) {
        console.log("error in adminFetchSupplier controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}
