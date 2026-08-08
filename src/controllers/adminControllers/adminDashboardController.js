import mongoose from "mongoose";
import User from "../../models/UserModel.js";
import Order from "../../models/OrderModel.js";
import Transaction from "../../models/TransactionModel.js";
import Product from "../../models/ProductModel.js";
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js";

export const adminDashboardData = async (req, res) => {
    try {

        const now = new Date();

        const months = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date( now.getFullYear(), now.getMonth() - i, 1 );

            months.push({
                label: date.toLocaleString("en-US", { month: "short" }),
                year: date.getFullYear(),
                month: date.getMonth(),
                start: new Date( date.getFullYear(), date.getMonth(), 1 ),
                end: new Date( date.getFullYear(), date.getMonth() + 1, 1 )
            });
        }

        const startDate = months[0].start
        const endDate = new Date( months[11].year, months[11].month + 1, 1 )

        const salesTransactions = await Transaction.find({ type: "income", category: "Sales", transaction_date: { $gte: startDate, $lt: endDate } }).lean();
        const purchaseTransactions = await Transaction.find({ type: "expense", category: "Purchase", transaction_date: { $gte: startDate, $lt: endDate } }).lean()

        const revenueData = months.map((month) => {

            const monthlySales = salesTransactions.filter(t => t.transaction_date >= month.start && t.transaction_date < month.end).reduce((sum, t) => sum + (t.amount || 0), 0);
            const monthlyPurchase = purchaseTransactions.filter(t => t.transaction_date >= month.start && t.transaction_date < month.end).reduce((sum, t) => sum + (t.amount || 0), 0);
            return { 
                label: month.label, 
                sales: monthlySales,
                purchase: monthlyPurchase,
                profit: (monthlySales - monthlyPurchase) > 0 ? (monthlySales - monthlyPurchase) : 0 
            };
        });

        const totalSales = salesTransactions.reduce( (sum, transaction) => sum + (transaction.amount || 0), 0 );
        const totalPurchase = purchaseTransactions.reduce( (sum, transaction) => sum + (transaction.amount || 0), 0 )
        const totalProfit = totalSales - totalPurchase;

        const orders = await Order.find({ createdAt: { $gte: startDate, $lt: endDate } }) .select( "_id order_id current_status order_status payment total_amount createdAt items").lean();
        const totalOrders = orders.length;

        const orderOverviewData = months.map((month) => {

            const monthlyOrders = orders.filter(order => order.createdAt >= month.start && order.createdAt < month.end )
            return {
                month: month.label,
                placed: monthlyOrders.filter( order => order.order_status?.placed?.status === true ).length,
                confirmed: monthlyOrders.filter( order => order.order_status?.confirmed?.status === true ).length,
                outForDelivery: monthlyOrders.filter( order => order.order_status?.out?.status === true ).length,
                delivered: monthlyOrders.filter( order => order.order_status?.delivered?.status === true ).length,
                canceled: monthlyOrders.filter( order => order.order_status?.cancelled?.status === true ).length,
                returned: 0
            };
        });

        const customers = await User.find({ deleted: false}).select("gender").lean();

        const maleCustomers = customers.filter( user => user.gender?.toLowerCase() === "male" ).length;
        const femaleCustomers = customers.filter( user => user.gender?.toLowerCase() === "female" ).length;
        const otherCustomers = customers.filter( user => user.gender?.toLowerCase() === "others" ).length;

        const customerData = {
            total_customer: [{ name: "Total", value: customers.length }],
            data: [
                { name: "Male", value: maleCustomers },
                { name: "Female", value: femaleCustomers },
                { name: "Others", value: otherCustomers }
            ]
        };

        const productSales = {};

        orders.filter( order => order.current_status === "delivered")
            .forEach(order => {
                order.items?.forEach(item => {
                    const productId = item.product_id?.toString();
                    if (!productId) return;
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            product_id: item.product_id,
                            product_name: item.product_name,
                            product_barcode: item.product_barcode,
                            quantity: 0
                        };
                    }
                    productSales[productId].quantity += item.quantity || 0;
                });
            }
        )

        const topProductIds = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

        const productIds = topProductIds.map( product => product.product_id );

        const products = await Product.find({ _id: { $in: productIds } }).select( "_id product_name product_barcode product_photo product_photos product_average_ratings" ).lean();

        const productMap = new Map( products.map(product => [ product._id.toString(), product ]) )

        const topProducts = topProductIds.map(item => {
            const product = productMap.get( item.product_id.toString() )
            return {
                product_id: item.product_id,
                product_barcode: product?.product_barcode || item.product_barcode,
                product_photos: product?.product_photos || product?.product_photo || "",
                product_name: product?.product_name || item.product_name,
                product_average_ratings: product?.product_average_ratings || 0,
                quantity_sold: item.quantity,
                product_total_stock: product?.product_total_stock || 0
            };
        });

        const inventoryResult = await Product.aggregate([
            { $match: { deleted: false} },
            {
                $group: { _id: null, totalStock: { $sum: "$product_total_stock" } }
            }
        ]);

        const totalInventory = inventoryResult[0]?.totalStock || 0;

        topProducts.forEach(product => { product.product_total_stock = product.product_total_stock || 0 })

        const currentMonth = revenueData[11];
        const previousMonth = revenueData[10];

        const calculateIncrement = ( current, previous ) => {
            if (previous === 0) { return current === 0 ? 0 : 100 }
            return Number(( ((current - previous) / previous) * 100).toFixed(2) )
        };

        // Current month orders
        const currentMonthOrders = orders.filter(order => order.createdAt >= currentMonth.start && order.createdAt < currentMonth.end ).length;
        const previousMonthOrders = orders.filter(order => order.createdAt >= previousMonth.start && order.createdAt < previousMonth.end ).length;

        // Current / previous profit
        const currentProfit = currentMonth.profit;
        const previousProfit = previousMonth.profit;

        const data = {

            purchase: {
                total_purchase: currentMonth.purchase,
                increament: calculateIncrement( currentMonth.purchase, previousMonth.purchase )
            },
            sales: {
                total_sales: currentMonth.sales,
                increament: calculateIncrement( currentMonth.sales, previousMonth.sales )
            },
            orders: {
                total_orders: currentMonthOrders,
                increament: calculateIncrement( currentMonthOrders, previousMonthOrders)
            },
            profit: {
                total_profit: currentMonth.profit,
                increament: calculateIncrement( currentProfit,previousProfit)
            },
            revenueData,
            topProducts,
            customerData,
            orderOverviewData,
            totalInventory
        };

        return apiSucessResponce( res, "Dashboard data fetched successfully.", data, 200 );

    } catch (error) {
        console.error( "Error in adminDashboardData:", error );
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
};