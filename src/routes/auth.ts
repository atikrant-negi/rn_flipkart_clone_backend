import { Router } from 'express';
import bodyParser from 'body-parser';

import { getUsers, getSessions } from '../services/mongodb';
import { CONSTANTS, anyEmpty, allEmpty } from '../utils';

const router = Router();

router.use(bodyParser.json());

router.post('/login', (req, res, next) => {
    const body = req.body;
    if (allEmpty(body.phone, body.email)) {
        res.status(400).json({ message: CONSTANTS.EMPTY_FIELD });
        return;
    }

    (async () => {
        try {
            // basic authentication
            const user = await getUsers().findOne(body.phone ? { phone: body.phone } : { email: body.email });
            if (user == null) {
                res.status(401).json({ message: CONSTANTS.CRED_INVALID });
                return;
            }
            
            // create a new session
            const sessionID = Math.floor(Math.random() * 1e12).toString(16);
            await getSessions().insertOne({
                userID: user._id,
                sessionID,
                created: Date.now(),
                expires: 5 * 24 * 3_600_000 // 5 days
            });
            res.status(201).json({ sessionID });
        }
        catch (err) {
            res.status(500).json({ message: CONSTANTS.ERROR_500 });
            console.log(err);
        }
    })();
});

router.post('/signup', (req, res, next) => {
    const body = req.body;
    if (allEmpty(body.phone, body.email)) {
        res.status(400).json({ message: CONSTANTS.EMPTY_FIELD });
        return;
    }

    (async () => {
        try {
            // check for username / email clashes
            const prev = await getUsers().findOne({
                $or: [
                    { phone: body.phone },
                    { email: body.email }
                ]
            });
            if (prev != null) {
                res.status(401).json({ message: CONSTANTS.PREEXISTING.USER });
                return;
            }

            // register a new user
            await getUsers().insertOne({
                phone: body.phone || '',
                email: body.email || ''
            });
            res.status(201).json({ message: CONSTANTS.CREATED.USER });
        }
        catch (err) {
            res.status(500).json({ message: CONSTANTS.ERROR_500 });
            console.log(err);
        }
    })();
});

router.post('/logout', (req, res, next) => {
    const body = req.body;
    if (anyEmpty(body.sessionID)) {
        res.status(400).json({ message: CONSTANTS.EMPTY_FIELD });
        return;
    }

    (async () => {
        try {
            // verify that the session exists, and delete it
            const ret = await getSessions().findOneAndDelete({ sessionID: body.sessionID });
            if (!ret.value) res.status(401).json({ message: CONSTANTS.CRED_INVALID });
            else res.status(200).json({ message: CONSTANTS.DELETED.SESSION });
        }
        catch(err) {
            res.status(500).json({ message: CONSTANTS.ERROR_500 });
            console.log(err);
        }
    })();
});

export default router;