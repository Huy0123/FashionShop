import express from 'express';
import { getUserTryOnResults, deleteTryOnResult } from '../controllers/tryOnController.js';
import authUser from '../middleware/auth.js';

const tryOnRouter = express.Router();

tryOnRouter.get('/user', authUser, getUserTryOnResults);
tryOnRouter.delete('/result/:resultId', authUser, deleteTryOnResult);


export default tryOnRouter;