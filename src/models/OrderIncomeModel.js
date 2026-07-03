import mongoose from "mongoose";

const orderIncomeSchema = new mongoose.Schema({
    order_id : { type: mongoose.Schema.Types.ObjectId, ref: "Order", unique: true, required : true },
    purchase_amount:{ type : Number, required : true, min: 0 },             
    sale_amount:{ type : Number, required : true, min: 0 },
},{
    timestamps : true,
    versionKey: false
})

// it will auto calculate and save the profit
orderIncomeSchema.virtual("profit").get(function () {
    return this.sale_amount - this.purchase_amount;
});

orderIncomeSchema.set("toJSON", { virtuals: true });
orderIncomeSchema.set("toObject", { virtuals: true });

const OrderIncome = mongoose.model('OrderIncome' , orderIncomeSchema )
export default OrderIncome