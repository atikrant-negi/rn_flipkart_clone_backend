import { Router } from 'express';
import { getProducts } from '../services/mongodb';
import { ObjectId } from 'mongodb';

import { CONSTANTS } from '../utils';

const router = Router();

const g_filters = {
    'price': 'price.discount', 
    'rating': 'rating'
} as { [key: string]: string };

// find by id
router.get('/:id', (req, res, next) => {
    let id = null;
    try {
        id = new ObjectId(req.params.id);
    }
    catch (err) {
        res.status(404).json({
            message: CONSTANTS.ERROR_404
        });
        return;
    }

    getProducts().findOne({ _id: id })
    .then(x => {
        if (!x) res.status(404).json({
            message: CONSTANTS.ERROR_404
        });
        else res.status(200).json(x);
    }).catch(err => {
        res.status(500).json({
            message: CONSTANTS.ERROR_500
        });
        console.log(err);
    });
});

// find by category, limit by amount and offset
// query parameters: tags [required], (offset, limit, sort, sortOrder)[optional]
router.get('/', (req, res, next) => {
    if (!req.query.tags) {
        next();
        return;
    }
    const tags = req.query.tags as string || '';
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 0, 50);
    const sortFilters = req.query.sort?.toString()?.split(' ') || [];
    const sortOrders = req.query.sortOrder?.toString()?.split(' ') || [];    

    // compute find paramters
    const tagFilter = tags.split(' ').map(x => ({ tag: x }));
    let sortOptions = [];
    for (let i = 0; i < sortFilters.length; i++) {
        if (g_filters[sortFilters[i]]) {
            sortOptions.push(
                [g_filters[sortFilters[i]], sortOrders[i] == 'desc' ? -1 : 1]
            );
        }
    }

    getProducts().find({
        $or: tagFilter
    }, {
        limit,
        skip: offset,
        sort: sortOptions
    }).toArray()
    .then(x => {
        res.status(200).json(x || []);
    })
    .catch(err => {
        res.status(500).json({ message: CONSTANTS.ERROR_500 });
        console.log(err);
    })
});

export default router;