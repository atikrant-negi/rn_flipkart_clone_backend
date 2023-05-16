import { Router, Request } from 'express';
import bodyParser from 'body-parser';
import { getSessions, getUsers, getProducts } from '../services/mongodb';
import { ObjectId } from 'mongodb';

import {RequestError, isEmpty, sendErrorMessage,CONSTANTS } from '../utils';

const router = Router();

type Fields = 'favorites' | 'cart' | 'orders';
type UserRequest = Request & { 
    auth: { 
        userID: any
        phone?: string 
    } 
};

// ---------- authorization

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

// ---------- favorites

router.get('/favorites', (req: UserRequest, res, next) => {
    getUserData('favorites', req.auth.userID)
    .then(x => { res.status(200).json(x); })
    .catch(err => next(err));
});

router.post('/add/favorites', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    pushProduct('favorites', req.auth.userID, new ObjectId(req.body.productID))
    .then(x => {
        res.status(201).json({
            message: `${x.modifiedCount} item/s added to favorites`
        });
    })
    .catch(err => {
        if (err.status >= 500) next(err);
        else sendErrorMessage(res, err.status, err.message);
    });
});

router.post('/remove/favorites', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    pullProduct('favorites', req.auth.userID, new ObjectId(req.body.productID))
    .then(x => {
        res.status(200).json({
            message: `${x.modifiedCount} product/s removed from favorites`
        });
    })
    .catch(err => next(err));
});

// ---------- cart

router.get('/cart', (req: UserRequest, res, next) => {
    getUserData('cart', req.auth.userID)
    .then(x => { res.status(200).json(x); })
    .catch(err => next(err));
});

router.post('/add/cart', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    pushProduct('cart', req.auth.userID, new ObjectId(req.body.productID))
    .then(x => {
        res.status(201).json({
            message: `${x.modifiedCount} item/s added to cart`
        });
    })
    .catch(err => {
        if (err.status >= 500) next(err);
        else sendErrorMessage(res, err.status, err.message);
    });
});

router.post('/remove/cart', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    pullProduct('cart', req.auth.userID, new ObjectId(req.body.productID))
    .then(x => {
        res.status(200).json({
            message: `${x.modifiedCount} product/s removed from cart`
        });
    })
    .catch(err => next(err));
});

// ---------- orders

router.get('/orders', (req: UserRequest, res, next) => {
    getUserData('orders', req.auth.userID)
    .then(x => { res.status(200).json(x); })
    .catch(err => next(err));
});

router.post('/add/orders', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    pushProduct('orders', req.auth.userID, new ObjectId(req.body.productID))
    .then(x => {
        res.status(201).json({
            message: `${x.modifiedCount} item/s added to orders`
        });
    })
    .catch(err => {
        if (err.status >= 500) next(err);
        else sendErrorMessage(res, err.status, err.message);
    });
});

router.post('/remove/orders', bodyParser.json(), (req: UserRequest, res, next) => {
    if (isEmpty(req.body.productID)) {
        sendErrorMessage(res, 400, CONSTANTS.EMPTY_FIELD);
        return;
    }

    pullProduct('orders', req.auth.userID, new ObjectId(req.body.productID))
    .then(x => {
        res.status(200).json({
            message: `${x.modifiedCount} product/s removed from orders`
        });
    })
    .catch(err => next(err));
});

export default router;

// ---------- utility functions

const getUserData = async (field: Fields, userID: ObjectId) => {
    return getUsers().findOne({
        _id: userID
    })
    .then(x => x[field] || [])
    .catch(err => {
        throw new RequestError(err.message, 500);
    });
}

const pushProduct = async (field: Fields, userID: ObjectId, productID: ObjectId) => {
    //verify the productID is valid
    const product = await getProducts().findOne({ _id: productID });
    if (!product) throw new RequestError('Product Not Found', 404);

    // prevent duplication
    const match = await getUsers().findOne({
        _id: userID,
        [ field ]: {
            $all: [ productID ]
        }
    });
    if (match) throw new RequestError('Product Already Exists', 406);

    // insert a new product
    return getUsers().updateOne(
        { _id: userID }, 
        { $push: { 
            [ field ]: productID
        }}
    )
    .catch(err => {
        throw new RequestError(err.message, 500);
    });
}

const pullProduct = async (field: Fields, userID: ObjectId, productID: ObjectId) => {
    return getUsers().updateOne(
        {_id: userID },
        { $pull: {
            [ field ]: productID
        }}
    )
    .catch(err => {
        throw new RequestError(err.message, 500);
    })
}