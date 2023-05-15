import { Response } from 'express';

export const CONSTANTS = {
    EMPTY_FIELD: 'body contains empty of missing fields',
    CRED_INVALID: 'invalid credentials' ,
    ERROR_404: '404, Not found',
    ERROR_500: '500, Internal error',
    ERROR_401: '401, Unauthorized',

    CREATED: {
        USER: 'user created successfully'
    },
    PREEXISTING: {
        USER: 'phone or email already exists'
    },
    DELETED: {
        SESSION: 'session destroyed'
    }
};

export const isEmpty = (field: any) => {
    return (field == undefined || field == '')
};

export const anyEmpty = (...fields: any) => {
    for (let x of fields) {
        if (isEmpty(x)) return true;
    }
    return false;
};

export const allEmpty = (...fields: any) => {
    for (let x of fields) {
        if (!isEmpty(x)) return false;
    }
    return true;
};

export const sendErrorMessage = (res: Response, status: number, message: string, error?: any) => {
    res.status(status).json({ message });
    if (status >= 500) console.log(error);
};