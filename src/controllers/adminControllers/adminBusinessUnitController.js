import mongoose from "mongoose"
import BusinessUnit from "../../models/BusinessUnitModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const adminCreateBusinessUnit = async (req, res) => {

    const session = await mongoose.startSession()

    try {

        const {
            business_unit_id,
            business_unit_name,
            business_unit_type,
            contact,
            address,
            working_hours,
            total_assets
        } = req.body

        if ( typeof business_unit_id !== "string" || !business_unit_id.trim() ) { return apiErrorResponce( res, "Business unit ID is required.", null, 400 )}
        if ( typeof business_unit_name !== "string" || !business_unit_name.trim() ) { return apiErrorResponce( res, "Business unit name is required.", null, 400 )}
        if ( typeof business_unit_type !== "string" || !business_unit_type.trim() ) { return apiErrorResponce( res, "Business unit type is required.", null, 400 )}

        const unitId = business_unit_id.trim().toUpperCase()
        const unitName = business_unit_name.trim()
        const unitType = business_unit_type.trim().toLowerCase()

        if (unitId.length > 50) { return apiErrorResponce( res, "Business unit ID cannot exceed 50 characters.", null, 400 )}
        if (!/^[A-Z0-9_-]+$/.test(unitId)) { return apiErrorResponce( res, "Business unit ID can contain only letters, numbers, hyphens and underscores.", null, 400 )}
        if (unitName.length < 2) { return apiErrorResponce( res, "Business unit name must contain at least 2 characters.", null, 400 )}
        if (unitName.length > 100) { return apiErrorResponce( res, "Business unit name cannot exceed 100 characters.", null, 400 )}

        const allowedTypes = [ "warehouse", "store", "office" ]

        if (!allowedTypes.includes(unitType)) { return apiErrorResponce( res, "Invalid business unit type.", null, 400 )}

        const normalizedContact = {
            phone: "",
            email: ""
        }

        if (contact !== undefined) {
            if ( contact === null || typeof contact !== "object" || Array.isArray(contact)) { return apiErrorResponce( res, "Invalid contact information.", null, 400 )}
            if (contact.phone !== undefined && contact.phone !== null) {
                if (typeof contact.phone !== "string") { return apiErrorResponce( res, "Phone number must be a string.", null, 400 )}
                const phone = contact.phone.trim()
                if (phone) {
                    if (!/^(?:\+91[-\s]?)?[6-9]\d{9}$/.test(phone)) { return apiErrorResponce( res, "Invalid Indian phone number.", null, 400 )}
                    normalizedContact.phone = phone
                }
            }

            if (contact.email !== undefined && contact.email !== null) {
                if (typeof contact.email !== "string") { return apiErrorResponce( res, "Email must be a string.", null, 400 )}
                const email = contact.email.trim().toLowerCase()
                if (email) {
                    if ( !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ) { return apiErrorResponce( res, "Invalid email address.", null, 400 )}
                    normalizedContact.email = email
                }
            }
        }

        if ( !address || typeof address !== "object" || Array.isArray(address)) { return apiErrorResponce( res, "Address information is required.", null, 400 )}

        const requiredAddressFields = [
            "address_line_1",
            "area",
            "city",
            "state",
            "pincode"
        ]

        for (const field of requiredAddressFields) {
            if ( typeof address[field] !== "string" || !address[field].trim()) { return apiErrorResponce( res, `${field.replaceAll("_", " ")} is required.`, null, 400 )}
        }

        const pincode = address.pincode.trim()
        if (!/^[1-9][0-9]{5}$/.test(pincode)) { return apiErrorResponce( res, "Invalid Indian pincode.", null, 400 )}

        const normalizedAddress = {
            address_line_1: address.address_line_1.trim(),
            address_line_2: typeof address.address_line_2 === "string" ? address.address_line_2.trim() : "",
            area: address.area.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
            pincode,
            country: typeof address.country === "string" && address.country.trim() ? address.country.trim() : "India"
        }

        if (normalizedAddress.address_line_1.length > 200) { return apiErrorResponce( res, "Address line 1 cannot exceed 200 characters.", null, 400 )}
        if (normalizedAddress.address_line_2.length > 200) { return apiErrorResponce( res, "Address line 2 cannot exceed 200 characters.", null, 400 )}
        if (normalizedAddress.area.length > 100) { return apiErrorResponce( res, "Area cannot exceed 100 characters.", null, 400 )}
        if (normalizedAddress.city.length > 100) { return apiErrorResponce( res, "City cannot exceed 100 characters.", null, 400 )}
        if (normalizedAddress.state.length > 100) { return apiErrorResponce( res, "State cannot exceed 100 characters.", null, 400 )}

        const openingTime = working_hours?.opening_time?.trim() || "09:00"
        const closingTime = working_hours?.closing_time?.trim() || "21:00"

        const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
        if (!timeRegex.test(openingTime)) { return apiErrorResponce( res, "Opening time must be in HH:mm format.", null, 400 )}
        if (!timeRegex.test(closingTime)) { return apiErrorResponce( res, "Closing time must be in HH:mm format.", null, 400 )}

        let assets = 0
        if (total_assets !== undefined) {
            if ( typeof total_assets !== "number" || !Number.isFinite(total_assets)) { return apiErrorResponce( res, "Total assets must be a valid number.", null, 400 )}
            if (total_assets < 0) { return apiErrorResponce( res, "Total assets cannot be negative.", null, 400 )}
            assets = total_assets
        }

        await session.startTransaction()

        const existingBusinessUnit = await BusinessUnit.findOne({ business_unit_id: unitId }).select("_id business_unit_id deleted") .session(session).lean()

        if (existingBusinessUnit) {
            await session.abortTransaction()
            return apiErrorResponce( res, "Business unit ID already exists.", null, 409 )
        }

        if (unitType === "warehouse") {
            const existingWarehouse = await BusinessUnit.findOne({ business_unit_type: "warehouse", deleted: false, status: { $ne: "permanently_closed" }}) .select("_id business_unit_id business_unit_name").session(session).lean()

            if (existingWarehouse) {
                await session.abortTransaction()
                return apiErrorResponce( res, "An active warehouse already exists. Only one warehouse is allowed.", { business_unit_id: existingWarehouse.business_unit_id, business_unit_name: existingWarehouse.business_unit_name }, 409)
            }
        }

        const historyEntry = {
            action: "create",
            performed_by: req.user._id,
            performed_at: new Date(),
            changes: {}
        }

        const [businessUnit] = await BusinessUnit.create([ {
            business_unit_id: unitId,
            business_unit_name: unitName,
            business_unit_type: unitType,
            contact: normalizedContact,
            address: normalizedAddress,
            working_hours: {
                opening_time: openingTime,
                closing_time: closingTime
            },
            total_assets: assets,
            status: "active",
            deleted: false,
            history: [historyEntry]
        }], { session })

        await session.commitTransaction()
        return apiSucessResponce( res, "Business unit created successfully.", { business_unit: businessUnit }, 201)

    } catch (error) {

        if (session.inTransaction()) { await session.abortTransaction() }
        console.error( "Error in adminCreateBusinessUnit:", error )

        if (error?.code === 11000) { return apiErrorResponce( res, "Business unit ID already exists.", null, 409 )}
        if (error instanceof mongoose.Error.ValidationError) {
            const errors = Object.values(error.errors).map((err) => ({ field: err.path, message: err.message }))
            return apiErrorResponce( res, "Business unit validation failed.", errors, 400 )
        }
        if (error instanceof mongoose.Error.CastError) { return apiErrorResponce( res, "Invalid business unit data.", null, 400 )}

        return apiErrorResponce( res, "Internal Server Error.", null, 500 )

    } finally { await session.endSession() }
}



export const fetchAllBusinessUnit = async(req , res)=>{
    try {
        const businessUnit = await BusinessUnit.find().sort({createdAt: -1})

        apiSucessResponce(res , "Business Unit Fetched Sucessfully" , businessUnit)
    } catch (error) {
        console.log("error in fetchAllBusinessUnit controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}
