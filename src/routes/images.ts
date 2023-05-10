import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';

import { CONSTANTS } from '../utils';

const router = Router();

router.get('/:type/:name', (req, res, next) => {
    fs.access(`./data/images/${req.params.type}/${req.params.name}`)
    .then(() => {
        res.status(200).sendFile(path.resolve('.', 'data', 'images', req.params.type, req.params.name));
    })
    .catch(err => {
        res.status(404).json({
            message: CONSTANTS.ERROR_404
        });
        console.log(err);
    })
});

export default router;