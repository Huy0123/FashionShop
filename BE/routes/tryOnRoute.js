import express from 'express';
import { getUserTryOnResults, deleteTryOnResult } from '../controllers/tryOnController.js';
import auth from '../middleware/auth.js';

const tryOnRouter = express.Router();

tryOnRouter.get('/user/:userId', auth, getUserTryOnResults);
tryOnRouter.delete('/result/:resultId', auth, deleteTryOnResult);


export default tryOnRouter;