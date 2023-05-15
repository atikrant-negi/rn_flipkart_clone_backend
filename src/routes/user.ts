import { Router, Request } from 'express';
import bodyParser from 'body-parser';
import { getSessions, getUsers, getProducts } from '../services/mongodb';
import { ObjectId } from 'mongodb';

import {isEmpty, sendErrorMessage,CONSTANTS } from '../utils';

const router = Router();

type UserRequest = Request & { 
    auth: { 
        userID: any
        phone?: string 
    } 
};

// authorization
router.use((req: UserRequest, res, next) => {
    if (!req.headers.authorization) {
        res.status(401).send(CONSTANTS.ERROR_401);
        return;
    }

    let auth = Buffer.from(req.headers.authorization.split(' ')[1], 'base64');
    let [phone, token] = auth.toString('ascii').split(':');

    (async () => {
        try {
            const session = await getSessions().findOne({
                sessionID: token
            });
            if (session == null) {
                sendErrorMessage(res, 401, CONSTANTS.ERROR_401);
                return
            }
    
            const user = await getUsers().findOne({
                _id: session.userID
            });
            if (user.phone != phone) {
                sendErrorMessage(res, 401, CONSTANTS.ERROR_401);
                return;
            }
            req.auth = { phone, userID: session.userID };
            next();
        }
        catch(err) { next(err); }
    })();
});

router.get('/favorites', (req: UserRequest, res, next) => {
    getUsers().findOne({
        _id: req.auth.userID
    })
    .then(x => {
        res.status(200).json(x?.favorites || [])
    })
    .catch(err => next(err));
});

router.post('/add/favorite', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    (async() => {
        try {
            // prevent duplication
            const match = await getUsers().findOne({
                _id: req.auth.userID,
                favorites: {
                    $all: [ new ObjectId(req.body.productID) ]
                }
            });
            if (match != null) {
                sendErrorMessage(res, 406, 'Product Already Exists');
                return;
            }

            //verify the productID is valid
            const product = await getProducts().findOne({
                _id: new ObjectId(req.body.productID)
            });
            if (product == null) {
                sendErrorMessage(res, 400, 'Product Not Found');
                return;
            }

            // insert a new product
            const status = await getUsers().updateOne(
                { _id: req.auth.userID }, 
                { $push: { 
                    favorites: new ObjectId(req.body.productID) 
                }}
            );
            res.status(201).json({
                message: `${status.modifiedCount} item/s added to favorites`
            });
        }
        catch(err) { next(err); }
    })();
});

router.post('/remove/favorite', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    getUsers().updateOne(
        {_id: req.auth.userID },
        { $pull: {
            favorites: new ObjectId(req.body.productID)
        }}
    )
    .then(x => {
        res.status(200).json({
            message: `${x.modifiedCount} product/s removed from favorites`
        });
    })
    .catch(err => next(err));
});

export default router;