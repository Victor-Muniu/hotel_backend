const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 

const staffRouter = require('./routes/staffRoutes.js');
const loginRouter = require('./routes/login.js')
const departmentRouter = require("./routes/departmentRoute.js")
const itemRouter = require("./routes/itemRoutes.js")
const roomsRouter = require("./routes/roomsRoute.js")
const supplierRouter = require('./routes/supplierRoute.js')
const expenseRouter = require("./routes/expenseRoute.js")
const payrollRouter = require('./routes/payrollRoute.js')
const generalLegerRoute = require('./routes/generalLegerRoute.js')
const creditorsRouter = require('./routes/creditorsRoute.js')
const trial_balanceRouter = require('./routes/trial_balanceRoute.js')
const consolidated_purchasesRouter = require('./routes/consolidated_purchasesRoute.js')
const banquettingRouter = require('./routes/banquettingRoute.js')
const requisitionRouter = require('./routes/requisitonRoute.js')
const banquettingInvoiceRouter = require('./routes/banquettingInvoiceRouter.js')
const debtorsRouter = require('./routes/debtorsRoute.js')
const tableRouter = require('./routes/tableRoute.js')
const menuRouter = require('./routes/menuRoute.js')
const restaurantOrderRouter = require('./routes/restaurantOrderRoute.js')
const clubOrderRouter = require('./routes/clubOrderRoute.js')
const ammenitiesRouter = require('./routes/ammenitiesRoute.js')
const ammenitiesOrderRouter = require('./routes/ammenitiesOrderRoute.js')
const restaurantBillRouter = require('./routes/restaurantBillRoute.js')
const clubBillRouter =require('./routes/clubBillsRoute.js')
const transferRouter = require('./routes/transferRoute.js')
const hallAllocationRouter = require('./routes/hallAllocationRoute.js')
const chefLadderRoute = require('./routes/chefsLadderRoute.js')
const stockMovementRoute = require('./routes/stockTrackerRoute.js')
const foodRequisitionRoute= require('./routes/foodRequisitionRoute.js')
const restaurantRequisitionRoute= require('./routes/restaurantRequisitionRoute.js')
const banquettingRequisitionRoute = require('./routes/banquettingRequisitionRoute.js')
const salesRouter = require('./routes/salesRoute.js')
const stockValueRouter = require('./routes/stockvalueRoute.js')
const profitLossRouer = require('./routes/profit&lossRoute.js')
const bankStatementRouter = require('./routes/bankStatementRoute.js')
const assetsRouter = require('./routes/assetsRouter.js')
const daily_collectionsRouter = require('./routes/dailycollectionsRouter.js')
const pettyCashRouter =require('./routes/pettyCashRouter.js')
const reservationsRouter = require('./routes/reservatioRoute.js')
const laundryServiceRouter = require('./routes/laundryServiceRouter.js')
const roomServiceRouter = require('./routes/roomserviceRouter.js')
const reservationBillsRouter = require('./routes/reservationBillsRoute.js')
const laundryServiceBillRouter = require('./routes/laundryServiceBillRouter.js')
const houseKeepingRequisition = require('./routes/housekeepingRequisitionRoute.js')
const linensRouter =require('./routes/linensRouter.js')
const alcarteRouter = require('./routes/alcarteRoute.js')
const frontOfficeRequisitionRouter =require('./routes/frontOfficeRequisitionRouter.js')
const backOfficeRequisitions = require('./routes/backofficeRequisitionRouter.js')
const carrageInwardsRouter = require('./routes/carrageInwardRoute.js')
const app = express();
app.use(express.json());
 

app.use(cors());

mongoose.connect("mongodb+srv://Victor254:pnlvmn4971@cluster0.yy3cbkm.mongodb.net/Hotel_Management");
const db = mongoose.connection;
db.on('error', (err) => console.error(err));
db.once('open', () => console.log('Connected to MongoDB'));

app.use('', staffRouter);
app.use('', loginRouter);
app.use('', departmentRouter)
app.use('', itemRouter)
app.use('',roomsRouter)
app.use('',supplierRouter)
app.use('', expenseRouter)
app.use('',payrollRouter)
app.use('', generalLegerRoute)
app.use('', creditorsRouter)
app.use('', trial_balanceRouter)
app.use('', consolidated_purchasesRouter)
app.use('', banquettingRouter)
app.use('',requisitionRouter)
app.use('', banquettingInvoiceRouter)
app.use('', debtorsRouter)
app.use('', tableRouter)
app.use('', menuRouter)
app.use('', restaurantOrderRouter)
app.use('', clubOrderRouter)
app.use('',ammenitiesRouter)
app.use('', ammenitiesOrderRouter)
app.use('', restaurantBillRouter)
app.use('',clubBillRouter)
app.use('', transferRouter)
app.use('', hallAllocationRouter)
app.use('', chefLadderRoute)
app.use('', stockMovementRoute)
app.use('', foodRequisitionRoute)
app.use('', restaurantRequisitionRoute)
app.use('', banquettingRequisitionRoute)
app.use('', salesRouter)
app.use('', stockValueRouter)
app.use('', profitLossRouer)
app.use('', bankStatementRouter)
app.use('',assetsRouter)
app.use('', daily_collectionsRouter)
app.use('', pettyCashRouter)
app.use('', reservationsRouter)
app.use('', laundryServiceRouter)
app.use('', roomServiceRouter)
app.use('', reservationBillsRouter)
app.use('', laundryServiceBillRouter)
app.use('', houseKeepingRequisition)
app.use('', linensRouter)
app.use('', alcarteRouter)
app.use('',frontOfficeRequisitionRouter)
app.use('', backOfficeRequisitions)
app.use('', carrageInwardsRouter)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
