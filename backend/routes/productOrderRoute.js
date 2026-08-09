import express from 'express';
import { placeProductOrder, getAdvisorProductOrders, payProductOrder } from '../controllers/productOrderController.js';
import authAdvisor from '../middlewares/authAdvisor.js';

const productOrderRouter = express.Router();

productOrderRouter.use(authAdvisor);
productOrderRouter.post('/place', placeProductOrder);
productOrderRouter.get('/list', getAdvisorProductOrders);
productOrderRouter.post('/pay', payProductOrder);

export default productOrderRouter;
